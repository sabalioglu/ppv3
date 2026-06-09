import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  Brain,
  Receipt,
  Image,
  FlipHorizontal,
  Images,
  Calculator,
  X,
  Check,
  Plus,
  CreditCard as Edit,
  ChefHat,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, type Colors } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import {
  OpenAIVisionService,
  type OpenAIVisionResult,
} from '@/lib/openaiVisionService';
import * as ImageManipulator from 'expo-image-manipulator';
import { ReceiptLearningService } from '@/lib/learningService';
import { ReceiptLearning, UserFeedback, ParsedItem } from '@/types/learning';
import { showPrompt } from '@/lib/crossPlatformUtils';
import { t } from '@/lib/i18n';
import { confirmDestructive } from '@/lib/ui/confirm';
import ScanSurface, {
  type ScanResultData,
} from '@/components/camera/ScanSurface';

type ScanMode =
  | 'food-recognition'
  | 'receipt-scanner'
  | 'multiple-images'
  | 'calorie-counter';

// One scan = capture/pick -> optimize -> analyze. Every step is visible; while
// optimizing/analyzing (or showing a result) the live CameraView is UNMOUNTED
// and ScanSurface takes the screen — never a <Modal> over the camera preview
// (iOS doesn't reliably render those, which made scans look like nothing ran).
type ScanPhase = 'idle' | 'capturing' | 'optimizing' | 'analyzing';

interface ScanResult {
  type: ScanMode;
  data: ScanResultData;
}

interface EnhancedParsedItem extends ParsedItem {
  id: string;
  confidence: number;
  is_food: boolean;
  pattern_matched?: string;
  user_action?: 'pending' | 'confirmed' | 'rejected' | 'edited';
}

// Resize + compress the captured JPEG and return base64 directly. Cameras shoot
// multi-MB JPEGs; sending that as a base64 JSON body is heavy/fragile (the call
// could fail before ever reaching the edge fn). A ~1024px q0.6 JPEG is ~200KB →
// small, reliable payload. (Gemini vision needs base64 anyway — we just shrink first.)
async function shrinkToBase64(uri: string): Promise<string> {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!out.base64) throw new Error('Image processing returned no data');
  return out.base64;
}

// Explicit cap on each vision call so a stalled request surfaces as a real,
// retryable error instead of an indefinite spinner.
const VISION_TIMEOUT_MS = 60000;
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(t('camera.analysisTimeout'))), ms),
    ),
  ]);
}

const ANALYZE_LABEL_KEY: Record<ScanMode, string> = {
  'food-recognition': 'camera.loadingFood',
  'multiple-images': 'camera.loadingMultiple',
  'calorie-counter': 'camera.loadingCalorie',
  'receipt-scanner': 'camera.loadingReceipt',
};

export default function CameraScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanMode, setScanMode] = useState<ScanMode>('food-recognition');
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [pendingUris, setPendingUris] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState({ done: 0, total: 0 });
  const [showTutorial, setShowTutorial] = useState(true);
  const [multipleImages, setMultipleImages] = useState<string[]>([]);

  // Enhanced Receipt Parser States
  const [showAddToInventoryModal, setShowAddToInventoryModal] = useState(false);
  const [parsedItems, setParsedItems] = useState<EnhancedParsedItem[]>([]);
  const [learningStartTime, setLearningStartTime] = useState<number>(0);
  const [currentReceiptLearningId, setCurrentReceiptLearningId] = useState<
    string | null
  >(null);
  const [originalReceiptText, setOriginalReceiptText] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);

  const [lastScanImageUri, setLastScanImageUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const tutorialOpacity = useRef(new Animated.Value(1)).current;

  const CAMERA_MODES = {
    'food-recognition': {
      title: t('camera.modeFoodRecognition'),
      icon: Brain,
      color: colors.secondary,
      description: 'Malzemeleri tanı',
    },
    'multiple-images': {
      title: t('camera.modeMultiple'),
      icon: Images,
      color: colors.primary,
      description: 'Toplu analiz',
    },
    'calorie-counter': {
      title: t('camera.modeCalorie'),
      icon: Calculator,
      color: colors.primary,
      description: 'Besin değeri',
    },
    'receipt-scanner': {
      title: t('camera.modeReceipt'),
      icon: Receipt,
      color: colors.secondary,
      description: 'Akıllı kiler',
    },
  };

  // Hide tutorial after 4 seconds
  useEffect(() => {
    if (showTutorial) {
      const timer = setTimeout(() => {
        Animated.timing(tutorialOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setShowTutorial(false));
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [showTutorial, tutorialOpacity]);

  // Handle Item Action
  const handleItemAction = (
    itemId: string,
    action: 'confirm' | 'reject' | 'edit',
    newName?: string,
  ) => {
    console.log('Item action:', action, 'for item:', itemId);

    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const feedback: UserFeedback = {
            item_id: itemId,
            action,
            original_name: item.name,
            corrected_name: newName,
            is_food:
              action === 'confirm'
                ? true
                : action === 'reject'
                  ? false
                  : item.is_food,
            confidence: item.confidence,
          };

          setUserFeedback((prev) => [...prev, feedback]);

          return {
            ...item,
            user_action:
              action === 'confirm'
                ? 'confirmed'
                : action === 'reject'
                  ? 'rejected'
                  : 'edited',

            name: newName || item.name,
          };
        }
        return item;
      }),
    );

    // Haptic feedback
    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const addToInventory = async (items: EnhancedParsedItem[]) => {
    try {
      console.log('Adding items to inventory:', items);

      const confirmedFoodItems = items.filter(
        (item) => item.user_action === 'confirmed' && item.is_food,
      );

      if (confirmedFoodItems.length === 0) {
        Alert.alert(t('camera.noItemsTitle'), t('camera.noItemsMessage'));
        return;
      }

      // Add to pantry
      const success =
        await ReceiptLearningService.addItemsToPantry(confirmedFoodItems);

      if (!success) {
        throw new Error('Failed to add items to pantry');
      }

      if (lastScanImageUri) {
        const confirmedItems = items.filter(
          (item) => item.user_action === 'confirmed',
        );
        const rejectedItems = items
          .filter((item) => item.user_action === 'rejected')
          .map((item) => item.name);
        const accuracy =
          confirmedItems.length > 0
            ? (confirmedItems.length / items.length) * 100
            : 0;

        const learningData: ReceiptLearning = {
          original_text: originalReceiptText,
          store_name: 'AI Detected Store',
          store_format: 'unknown',
          parsed_items: items,
          confirmed_items: confirmedItems,
          rejected_items: rejectedItems,
          accuracy_score: accuracy,
          processing_time: Math.round((Date.now() - learningStartTime) / 1000),
          items_count: items.length,
          parsing_method: 'pure_ai',
        };

        // Save learning data
        const receiptLearningId =
          await ReceiptLearningService.saveReceiptLearning(learningData);

        if (receiptLearningId && userFeedback.length > 0) {
          const sessionStats = {
            duration: Math.round((Date.now() - learningStartTime) / 1000),
            confirmed: items.filter((item) => item.user_action === 'confirmed')
              .length,
            rejected: items.filter((item) => item.user_action === 'rejected')
              .length,
            edited: items.filter((item) => item.user_action === 'edited')
              .length,
            added: 0,
            completed: true,
          };

          await ReceiptLearningService.saveFeedbackSession(
            receiptLearningId,
            userFeedback,
            sessionStats,
          );
        }
      }

      if (Haptics.notificationAsync) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }

      Alert.alert(
        t('camera.addedTitle'),
        t('camera.addedMessage', { count: confirmedFoodItems.length }),
        [{ text: t('camera.addedGreat'), style: 'default' }],
      );
    } catch (error) {
      console.error('Error adding to inventory:', error);
      Alert.alert(t('camera.addErrorTitle'), t('camera.addErrorMessage'));
    }
  };

  // THE scan pipeline. Single path for all four modes; the mode only changes
  // the prompt (server-side) and how the result is presented.
  const runScan = async (uris: string[]) => {
    if (uris.length === 0) return;
    setPendingUris(uris); // kept for "retry" without retaking the photo
    setScanResult(null);
    setScanError(null);

    try {
      // 1) Optimize: resize+compress+base64 in one call (no FileSystem read).
      setScanPhase('optimizing');
      const images: string[] = [];
      for (const uri of uris) {
        images.push(await shrinkToBase64(uri));
      }
      setLastScanImageUri(uris[0]);

      // 2) Analyze via the vision-analyze edge fn, explicit timeout per image.
      setScanPhase('analyzing');
      setScanProgress({ done: 0, total: images.length });
      const results: OpenAIVisionResult[] = [];
      for (const base64 of images) {
        console.log(
          `vision-analyze call ${results.length + 1}/${images.length} (${scanMode}, ${base64.length} chars)`,
        );
        const analysis = await withTimeout(
          OpenAIVisionService.analyzeImage(base64, scanMode),
          VISION_TIMEOUT_MS,
        );
        results.push(analysis);
        setScanProgress({ done: results.length, total: images.length });
      }

      // 3) Mode-specific result assembly.
      if (scanMode === 'multiple-images') {
        const combinedItems = results.flatMap((r) => r.detectedItems ?? []);
        const hasItems = combinedItems.length > 0;

        setScanResult({
          type: scanMode,
          data: {
            name: hasItems
              ? `${uris.length} ${t('camera.imagesAnalyzed')}`
              : t('camera.noItemsDetected'),
            // Guard against empty -> avoids NaN confidence (blank-looking card).
            confidence: hasItems
              ? Math.round(
                  combinedItems.reduce(
                    (acc, item) => acc + (item.confidence ?? 0),
                    0,
                  ) / combinedItems.length,
                )
              : 0,
            items: combinedItems,
            suggestions: hasItems
              ? [
                  `${t('camera.found')} ${combinedItems.length} ${t('camera.items')}`,
                  t('camera.addAllToPantry'),
                ]
              : [t('camera.tryClearerPhotos')],
            imageType: 'ai-multiple-analysis',
          },
        });
      } else {
        const analysisResult = results[0];

        if (
          scanMode === 'receipt-scanner' &&
          analysisResult.detectedItems &&
          analysisResult.detectedItems.length > 0
        ) {
          // Receipt: go straight to the confirm-items flow (learning preserved).
          setLearningStartTime(Date.now());
          setOriginalReceiptText(analysisResult.text || 'AI Receipt Analysis');

          const aiItems: EnhancedParsedItem[] =
            analysisResult.detectedItems.map((item: any, index: number) => ({
              id: `ai_${Date.now()}_${index}`,
              name: item.name || item.item || 'Unknown Item',
              price: item.price || 0,
              quantity: item.quantity || 1,
              category: 'food',
              confidence: item.confidence || 70,
              is_food: true,
              user_action: 'pending',
            }));

          setParsedItems(aiItems);
          setShowAddToInventoryModal(true);
        } else {
          setScanResult({
            type: scanMode,
            data: {
              name: analysisResult.mainItem || 'Analysis Complete',
              confidence: analysisResult.confidence,
              items: analysisResult.detectedItems,
              suggestions: analysisResult.suggestions,
              imageType: `ai-${scanMode}`,
              text: analysisResult.text,
              calories: analysisResult.calories,
              nutrition: analysisResult.nutrition,
            },
          });
        }
      }

      if (Haptics.notificationAsync) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Scan pipeline failed:', error);
      // Never silent: ScanSurface shows the real message with a retry button.
      setScanError(errMsg);

      if (Haptics.notificationAsync) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setScanPhase('idle');
    }
  };

  // Take photo with camera
  const takePicture = async () => {
    if (!cameraRef.current || scanPhase !== 'idle') return;

    try {
      setScanPhase('capturing');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) throw new Error('Camera returned no photo');
      console.log('Picture taken:', photo.uri);

      if (scanMode === 'multiple-images') {
        setScanPhase('idle');
        setMultipleImages((prev) => [...prev, photo.uri]);
        if (Haptics.impactAsync) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } else {
        await runScan([photo.uri]);
      }
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to take picture';
      console.error('Error taking picture:', error);
      setScanPhase('idle');
      setScanError(errMsg);
    }
  };

  // Pick images from gallery
  const pickImages = async () => {
    try {
      if (scanMode === 'multiple-images') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
          selectionLimit: 5,
        });

        if (!result.canceled && result.assets.length > 0) {
          const imageUris = result.assets.map((asset) => asset.uri);
          console.log('Multiple images picked:', imageUris.length);
          await runScan(imageUris);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const imageUri = result.assets[0].uri;
          console.log('Image picked from gallery:', imageUri);
          await runScan([imageUri]);
        }
      }
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to pick image';
      console.error('Error picking image:', error);
      setScanError(errMsg);
    }
  };

  // Process accumulated MULTI-mode photos
  const processMultipleImages = async () => {
    if (multipleImages.length === 0) {
      Alert.alert(t('camera.noPhotosTitle'), t('camera.noPhotosMessage'));
      return;
    }

    const uris = multipleImages;
    setMultipleImages([]);
    await runScan(uris);
  };

  const clearResults = () => {
    setScanResult(null);
    setScanError(null);
    setPendingUris([]);
    setScanProgress({ done: 0, total: 0 });
    setMultipleImages([]);
    setParsedItems([]);
    setUserFeedback([]);
    setCurrentReceiptLearningId(null);
    setOriginalReceiptText('');
    setLastScanImageUri(null);
  };

  // "Add all" from the result surface (FOOD / MULTI / RECEIPT-fallback)
  const handleAddAll = () => {
    const detected = scanResult?.data.items;
    if (!detected || detected.length === 0) return;

    confirmDestructive({
      title: t('camera.addAll'),
      message: t('camera.addAllConfirmMessage', { count: detected.length }),
      confirmText: t('camera.addAll'),
      cancelText: t('camera.addAllCancel'),
      destructive: false,
      onConfirm: () => {
        const items: EnhancedParsedItem[] = detected.map(
          (item: any, index: number) => ({
            id: `scan_${Date.now()}_${index}`,
            name: item.name || item.item || 'Unknown Item',
            price: item.price || 0,
            quantity: item.quantity || 1,
            category: 'food',
            confidence: item.confidence || 70,
            is_food: true,
            user_action: 'confirmed',
          }),
        );

        addToInventory(items);
        clearResults();
      },
    });
  };

  // Hide tutorial manually
  const hideTutorial = () => {
    Animated.timing(tutorialOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowTutorial(false));
  };

  const AddToInventoryModal = () => {
    const confirmedCount = parsedItems.filter(
      (item) => item.user_action === 'confirmed',
    ).length;

    return (
      <Modal
        visible={showAddToInventoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddToInventoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <View>
                <Eyebrow>{t('camera.inventoryEyebrow')}</Eyebrow>
                <Display size="md" color={colors.textPrimary}>
                  {t('camera.inventoryTitle')}
                </Display>
              </View>
              <TouchableOpacity
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setShowAddToInventoryModal(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              {t('camera.inventoryReview', { count: parsedItems.length })}
            </Text>

            <ScrollView
              style={styles.itemsList}
              showsVerticalScrollIndicator={false}
            >
              {parsedItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.modalItem,
                    item.user_action === 'confirmed' &&
                      styles.modalItemConfirmed,
                    item.user_action === 'rejected' && styles.modalItemRejected,
                  ]}
                >
                  <View style={styles.modalItemInfo}>
                    <Text
                      style={[
                        styles.modalItemName,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.price && item.price > 0 && (
                      <Text
                        style={[
                          styles.modalItemPrice,
                          { color: colors.primary },
                        ]}
                      >
                        ${item.price.toFixed(2)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.modalItemActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.confirmButton,
                        item.user_action === 'confirmed' &&
                          styles.actionButtonActive,
                      ]}
                      onPress={() => handleItemAction(item.id, 'confirm')}
                      activeOpacity={0.7}
                    >
                      <Check
                        size={14}
                        color={
                          item.user_action === 'confirmed'
                            ? '#FFFFFF'
                            : colors.secondary
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.rejectButton,
                        item.user_action === 'rejected' &&
                          styles.actionButtonActive,
                      ]}
                      onPress={() => handleItemAction(item.id, 'reject')}
                      activeOpacity={0.7}
                    >
                      <X
                        size={14}
                        color={
                          item.user_action === 'rejected'
                            ? '#FFFFFF'
                            : colors.error
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        showPrompt(
                          t('camera.editItemTitle'),
                          t('camera.editItemCurrent', { name: item.name }),
                          (newName) => {
                            if (newName && newName.trim()) {
                              handleItemAction(
                                item.id,
                                'edit',
                                newName.trim().toUpperCase(),
                              );
                            }
                          },
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View
              style={[
                styles.modalStats,
                { borderTopColor: colors.borderLight },
              ]}
            >
              <Text
                style={[styles.modalStatsText, { color: colors.textSecondary }]}
              >
                {t('camera.inventoryStats', {
                  confirmed: parsedItems.filter(
                    (item) => item.user_action === 'confirmed',
                  ).length,
                  rejected: parsedItems.filter(
                    (item) => item.user_action === 'rejected',
                  ).length,
                  edited: parsedItems.filter(
                    (item) => item.user_action === 'edited',
                  ).length,
                })}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => setShowAddToInventoryModal(false)}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t('camera.inventoryNotNow')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  { backgroundColor: colors.primary },
                  confirmedCount === 0 && styles.modalButtonDisabled,
                ]}
                onPress={async () => {
                  if (confirmedCount > 0) {
                    await addToInventory(parsedItems);
                    setShowAddToInventoryModal(false);
                    setParsedItems([]);
                    setUserFeedback([]);
                  }
                }}
                disabled={confirmedCount === 0}
              >
                <Plus size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.modalConfirmText}>
                  {t('camera.inventoryAddItems', { count: confirmedCount })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <Text
                style={[
                  styles.modalFooterText,
                  { color: colors.textSecondary },
                ]}
              >
                {t('camera.inventoryFooter')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!permission) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[styles.permissionIcon, { backgroundColor: colors.primary }]}
        >
          <ChefHat size={36} color="#fff" />
        </View>
        <Eyebrow>{t('camera.permissionEyebrow')}</Eyebrow>
        <Display
          size="lg"
          color={colors.textPrimary}
          style={styles.permissionTitle}
        >
          {t('camera.permissionTitle')}
        </Display>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          {t('camera.permissionText')}
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>
            {t('camera.permissionGrant')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Visible step label while the pipeline runs (optimizing/analyzing).
  const phaseLabel =
    scanPhase === 'optimizing'
      ? t('camera.stepOptimizing')
      : scanPhase === 'analyzing'
        ? scanProgress.total > 1
          ? t('camera.analyzingCount', {
              done: Math.min(scanProgress.done + 1, scanProgress.total),
              total: scanProgress.total,
            })
          : t(ANALYZE_LABEL_KEY[scanMode])
        : null;

  // While a scan runs / a result or error is up / the inventory modal owns the
  // screen, the live camera is unmounted and ScanSurface takes over (no Modal
  // is ever rendered above an active CameraView).
  const showSurface =
    scanPhase === 'optimizing' ||
    scanPhase === 'analyzing' ||
    scanResult !== null ||
    scanError !== null ||
    showAddToInventoryModal;

  return (
    <View style={styles.container}>
      {showSurface ? (
        <ScanSurface
          phaseLabel={phaseLabel}
          result={
            scanResult && !showAddToInventoryModal ? scanResult.data : null
          }
          error={scanError}
          showAddAll={
            !!scanResult?.data.items?.length && scanMode !== 'calorie-counter'
          }
          showReceiptText={scanMode === 'receipt-scanner'}
          onRetry={() => runScan(pendingUris)}
          onClose={clearResults}
          onAddAll={handleAddAll}
        />
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            {/* Tutorial Overlay */}
            {showTutorial && (
              <Animated.View
                style={[styles.tutorialOverlay, { opacity: tutorialOpacity }]}
              >
                <View
                  style={[
                    styles.tutorialContent,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.tutorialClose,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={hideTutorial}
                  >
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Eyebrow>{t('camera.tutorialEyebrow')}</Eyebrow>
                  <Display
                    size="md"
                    color={colors.textPrimary}
                    style={styles.tutorialTitle}
                  >
                    {t('camera.tutorialTitle')}
                  </Display>
                  <Text
                    style={[
                      styles.tutorialText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tutorialHighlight,
                        { color: colors.primary },
                      ]}
                    >
                      {t('camera.modeFoodRecognition')}:
                    </Text>{' '}
                    {t('camera.tutorialFood')}
                    {'\n'}
                    <Text
                      style={[
                        styles.tutorialHighlight,
                        { color: colors.primary },
                      ]}
                    >
                      {t('camera.modeCalorie')}:
                    </Text>{' '}
                    {t('camera.tutorialCalorie')}
                    {'\n'}
                    <Text
                      style={[
                        styles.tutorialHighlight,
                        { color: colors.primary },
                      ]}
                    >
                      {t('camera.modeMultiple')}:
                    </Text>{' '}
                    {t('camera.tutorialMultiple')}
                    {'\n'}
                    <Text
                      style={[
                        styles.tutorialHighlight,
                        { color: colors.primary },
                      ]}
                    >
                      {t('camera.modeReceipt')}:
                    </Text>{' '}
                    {t('camera.tutorialReceipt')}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Capturing flash (View overlay is fine — only <Modal> breaks) */}
            {scanPhase === 'capturing' && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>
                    {t('camera.stepCapturing')}
                  </Text>
                </View>
              </View>
            )}

            {/* Apple-style Mode Selector - RESPONSIVE FIXED */}
            <View style={styles.appleModeContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.appleModeScroll}
                style={styles.appleModeSelector}
              >
                {Object.entries(CAMERA_MODES).map(([key, mode]) => {
                  const isActive = scanMode === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.appleModeButton,
                        isActive && [
                          styles.appleModeButtonActive,
                          { backgroundColor: mode.color },
                        ],
                      ]}
                      onPress={() => {
                        setScanMode(key as ScanMode);
                        clearResults();
                        setShowTutorial(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.appleModeText,
                          isActive && styles.appleModeTextActive,
                        ]}
                      >
                        {mode.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Multiple Images Counter */}
            {scanMode === 'multiple-images' && multipleImages.length > 0 && (
              <View
                style={[
                  styles.multipleCounter,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.multipleCounterText}>
                  {`${multipleImages.length} ${t('camera.photosCount')}`}
                </Text>
                <TouchableOpacity
                  style={styles.processButton}
                  onPress={processMultipleImages}
                >
                  <Text style={styles.processButtonText}>
                    {t('camera.analyze')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Apple-style Controls - RESPONSIVE FIXED */}
            <View style={styles.appleControls}>
              {/* Gallery Button */}
              <TouchableOpacity
                style={styles.appleGalleryButton}
                onPress={pickImages}
              >
                {scanMode === 'multiple-images' ? (
                  <Images size={22} color="#FFFFFF" />
                ) : (
                  <Image size={22} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              {/* Capture Button */}
              <TouchableOpacity
                style={styles.appleCaptureButton}
                onPress={takePicture}
                disabled={scanPhase !== 'idle'}
              >
                <View
                  style={[
                    styles.appleCaptureInner,
                    { borderColor: colors.primary },
                    scanPhase !== 'idle' && styles.captureButtonDisabled,
                  ]}
                />
              </TouchableOpacity>

              {/* Flip Button */}
              <TouchableOpacity
                style={styles.appleFlipButton}
                onPress={() =>
                  setFacing((current) =>
                    current === 'back' ? 'front' : 'back',
                  )
                }
              >
                <FlipHorizontal size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}

      {/* Add to Inventory Modal (camera is unmounted whenever this is visible) */}
      <AddToInventoryModal />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    cameraContainer: {
      flex: 1,
    },
    camera: {
      flex: 1,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: spacing.xl,
    },
    permissionIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    permissionTitle: {
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    permissionText: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    permissionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    permissionButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: 'Inter-Bold',
    },

    // Tutorial Styles
    tutorialOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    tutorialContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      margin: 20,
      maxWidth: 320,
    },
    tutorialClose: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 6,
      backgroundColor: colors.background,
      borderRadius: 15,
    },
    tutorialTitle: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    tutorialText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 24,
    },
    tutorialHighlight: {
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },

    // Capturing overlay
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    loadingContent: {
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      padding: 30,
      minWidth: 200,
    },
    loadingText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
      marginTop: 15,
      textAlign: 'center',
    },

    // Apple-style Mode Selector
    appleModeContainer: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      zIndex: 100,
      paddingHorizontal: 15,
    },
    appleModeSelector: {
      flexGrow: 0,
    },
    appleModeScroll: {
      paddingHorizontal: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appleModeButton: {
      paddingHorizontal: 15,
      paddingVertical: 7,
      marginHorizontal: 4,
      borderRadius: radius.full,
    },
    appleModeButtonActive: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    appleModeText: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: 12.5,
      fontFamily: 'Inter-SemiBold',
      letterSpacing: 0.8,
      textAlign: 'center',
    },
    appleModeTextActive: {
      color: '#FFFFFF',
      fontFamily: 'Inter-Bold',
    },

    // Multiple Images Counter
    multipleCounter: {
      position: 'absolute',
      top: 120,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(255, 105, 180, 0.9)',
      borderRadius: 15,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    multipleCounterText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    processButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    processButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },

    // Apple-style Controls
    appleControls: {
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    appleGalleryButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    appleCaptureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    appleCaptureInner: {
      width: 65,
      height: 65,
      borderRadius: 32.5,
      backgroundColor: '#FFFFFF',
      borderWidth: 3,
      borderColor: '#000000',
    },
    captureButtonDisabled: {
      opacity: 0.5,
    },
    appleFlipButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderRadius: radius.xl,
      padding: 0,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
      shadowColor: '#241710',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 25,
      paddingTop: 25,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
    },
    modalMessage: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 25,
      paddingVertical: 15,
      lineHeight: 22,
    },

    // Items List
    itemsList: {
      maxHeight: 300,
      paddingHorizontal: 20,
    },
    modalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 15,
      marginBottom: 10,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    modalItemConfirmed: {
      borderColor: colors.secondary,
    },
    modalItemRejected: {
      borderColor: colors.error,
    },
    modalItemInfo: {
      flex: 1,
      marginRight: 15,
    },
    modalItemName: {
      fontSize: 15,
      fontFamily: 'Inter-SemiBold',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    modalItemPrice: {
      fontSize: 13,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    modalItemActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      borderWidth: 2,
    },
    confirmButton: {
      backgroundColor: colors.surface,
      borderColor: colors.secondary,
    },
    rejectButton: {
      backgroundColor: colors.surface,
      borderColor: colors.error,
    },
    editButton: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    actionButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    // Modal Stats
    modalStats: {
      paddingHorizontal: 25,
      paddingVertical: 15,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    modalStatsText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Modal Buttons
    modalButtons: {
      flexDirection: 'row',
      paddingHorizontal: 25,
      paddingVertical: 20,
      gap: 15,
    },
    modalButton: {
      flex: 1,
      height: 52,
      borderRadius: 18,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
    },
    modalConfirmButton: {
      backgroundColor: colors.primary,
    },
    modalButtonDisabled: {
      opacity: 0.4,
    },
    modalCancelText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontFamily: 'Inter-SemiBold',
    },
    modalConfirmText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: 'Inter-Bold',
    },

    // Modal Footer
    modalFooter: {
      paddingHorizontal: 25,
      paddingBottom: 25,
    },
    modalFooterText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
