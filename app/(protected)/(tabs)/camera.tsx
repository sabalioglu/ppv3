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
  TriangleAlert as AlertTriangle,
  Images,
  Calculator,
  X,
  Check,
  Plus,
  CreditCard as Edit,
  ChefHat,
  Sparkles,
  Lightbulb,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, type Colors } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import { OpenAIVisionService } from '@/lib/openaiVisionService';
import { convertImageToBase64, validateImageSize } from '@/lib/imageUtils';
import { ReceiptLearningService } from '@/lib/learningService';
import { ReceiptLearning, UserFeedback, ParsedItem } from '@/types/learning';
import { showPrompt } from '@/lib/crossPlatformUtils';
import { t, i18n } from '@/lib/i18n';

// Locale is fixed at startup (device-driven). "%96 tamam" (tr) vs "96% done" (en).
const progressLabel = (pct: number) =>
  i18n.locale === 'tr'
    ? `%${pct} ${t('camera.progressDoneWord')}`
    : `${pct}% ${t('camera.progressDoneWord')}`;

type ScanMode =
  | 'food-recognition'
  | 'receipt-scanner'
  | 'multiple-images'
  | 'calorie-counter';

interface ScanResult {
  type: ScanMode;
  data: {
    name: string;
    confidence: number;
    items?: any[];
    text?: string;
    suggestions?: string[];
    imageType?: string;
    error?: string;
    calories?: number;
    nutrition?: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  };
}

interface EnhancedParsedItem extends ParsedItem {
  id: string;
  confidence: number;
  is_food: boolean;
  pattern_matched?: string;
  user_action?: 'pending' | 'confirmed' | 'rejected' | 'edited';
}

export default function CameraScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanMode, setScanMode] = useState<ScanMode>('food-recognition');
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
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

  // ✅ STATES CLEANED - NO OCR
  const [lastScanImageUri, setLastScanImageUri] = useState<string | null>(null);

  // ✅ NEW SMART LOADING STATES
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

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

  // ✅ SMART LOADING MESSAGES
  const LOADING_STEPS = [
    { message: t('camera.loadingReceipt1'), duration: 1000 },
    { message: t('camera.loadingReceipt2'), duration: 2000 },
    { message: t('camera.loadingReceipt3'), duration: 1500 },
    { message: t('camera.loadingReceipt4'), duration: 1000 },
  ];

  // ✅ SMART LOADING ANIMATION
  useEffect(() => {
    if (isLoading && scanMode === 'receipt-scanner') {
      setLoadingStep(0);
      setLoadingMessage(LOADING_STEPS[0].message);

      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          const nextStep = prev + 1;
          if (nextStep < LOADING_STEPS.length) {
            setLoadingMessage(LOADING_STEPS[nextStep].message);
            return nextStep;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isLoading, scanMode]);

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

  // ✅ CLEANED - NO OCR REFERENCES
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

      // ✅ SIMPLIFIED LEARNING DATA - NO OCR
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

  // ✅ PURE AI PROCESSING - NO OCR
  const processImageWithVision = async (imageUri: string | string[]) => {
    try {
      setIsLoading(true);
      setScanResult(null);

      console.log('Starting AI Vision processing...');

      // Set scan image URI at the beginning
      setLastScanImageUri(Array.isArray(imageUri) ? imageUri[0] : imageUri);

      let result;

      if (scanMode === 'multiple-images' && Array.isArray(imageUri)) {
        // Multiple images processing
        const allResults = [];

        for (const uri of imageUri) {
          const base64 = await convertImageToBase64(uri);
          if (!validateImageSize(base64, 15000)) {
            throw new Error('One or more images are too large.');
          }

          const analysisResult = await OpenAIVisionService.analyzeImage(
            base64,
            scanMode,
          );
          allResults.push(analysisResult);
        }

        const combinedItems = allResults.flatMap((r) => r.detectedItems ?? []);
        const hasItems = combinedItems.length > 0;

        result = {
          type: scanMode,
          data: {
            name: hasItems
              ? `${imageUri.length} ${t('camera.imagesAnalyzed')}`
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
        };
      } else {
        // Single image processing
        const base64 = await convertImageToBase64(
          Array.isArray(imageUri) ? imageUri[0] : imageUri,
        );

        if (!validateImageSize(base64, 15000)) {
          throw new Error('Image too large. Please use a smaller image.');
        }

        const analysisResult = await OpenAIVisionService.analyzeImage(
          base64,
          scanMode,
        );

        result = {
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
        };

        // ✅ PURE AI RECEIPT SCANNER - NO OCR
        if (
          scanMode === 'receipt-scanner' &&
          analysisResult.detectedItems &&
          analysisResult.detectedItems.length > 0
        ) {
          setLearningStartTime(Date.now());
          setOriginalReceiptText(analysisResult.text || 'AI Receipt Analysis');

          // Convert AI results to EnhancedParsedItem format
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

          setTimeout(() => {
            setShowAddToInventoryModal(true);
          }, 1000);
          return; // ✅ Go directly to AddToInventoryModal
        }
      }

      console.log('AI Vision processing successful:', result);
      setScanResult(result);

      if (Haptics.notificationAsync) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (error) {
      console.error('AI Vision processing failed:', error);

      setScanResult({
        type: scanMode,
        data: {
          name: 'Processing Failed',
          confidence: 0,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      });

      if (Haptics.notificationAsync) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
      setLoadingMessage('');
    }
  };

  // Take photo with camera
  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        console.log('Picture taken:', photo.uri);

        if (scanMode === 'multiple-images') {
          setMultipleImages((prev) => [...prev, photo.uri]);
          if (Haptics.impactAsync) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        } else {
          await processImageWithVision(photo.uri);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
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
          await processImageWithVision(imageUris);
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
          await processImageWithVision(imageUri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Process multiple images
  const processMultipleImages = async () => {
    if (multipleImages.length === 0) {
      Alert.alert('No Images', 'Please take some photos first');
      return;
    }

    await processImageWithVision(multipleImages);
    setMultipleImages([]);
  };

  // ✅ CLEANED - NO OCR REFERENCES
  const clearResults = () => {
    setScanResult(null);
    setMultipleImages([]);
    setParsedItems([]);
    setUserFeedback([]);
    setCurrentReceiptLearningId(null);
    setOriginalReceiptText('');
    setLastScanImageUri(null);
    setLoadingStep(0);
    setLoadingMessage('');
  };

  // Hide tutorial manually
  const hideTutorial = () => {
    Animated.timing(tutorialOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowTutorial(false));
  };

  // ✅ ENHANCED PROGRESS INDICATOR
  const renderProgressIndicator = () => {
    const progress = ((loadingStep + 1) / LOADING_STEPS.length) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progressLabel(Math.round(progress))}
        </Text>
      </View>
    );
  };

  // ✅ CLEANED ADD TO INVENTORY MODAL - NO OCR REFERENCES
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

  return (
    <View style={styles.container}>
      {/* Camera Full Screen */}
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
                  style={[styles.tutorialText, { color: colors.textSecondary }]}
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

          {/* ✅ ENHANCED LOADING OVERLAY WITH SMART MESSAGES */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>
                  {scanMode === 'receipt-scanner'
                    ? loadingMessage
                    : scanMode === 'food-recognition'
                      ? t('camera.loadingFood')
                      : scanMode === 'calorie-counter'
                        ? t('camera.loadingCalorie')
                        : scanMode === 'multiple-images'
                          ? t('camera.loadingMultiple')
                          : t('camera.loadingDefault')}
                </Text>

                {/* ✅ PROGRESS INDICATOR FOR RECEIPT SCANNING */}
                {scanMode === 'receipt-scanner' && renderProgressIndicator()}
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
              disabled={isLoading}
            >
              <View
                style={[
                  styles.appleCaptureInner,
                  { borderColor: colors.primary },
                  isLoading && styles.captureButtonDisabled,
                ]}
              />
            </TouchableOpacity>

            {/* Flip Button */}
            <TouchableOpacity
              style={styles.appleFlipButton}
              onPress={() =>
                setFacing((current) => (current === 'back' ? 'front' : 'back'))
              }
            >
              <FlipHorizontal size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>

      {/* ✅ RESULTS DISPLAY - NOW AS MODAL WITH NO CONFIDENCE SCORES */}
      {scanResult && !showAddToInventoryModal && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={clearResults}
        >
          <View style={styles.resultsModalOverlay}>
            <TouchableOpacity
              style={styles.resultsModalBackground}
              onPress={clearResults}
              activeOpacity={1}
            />
            <View
              style={[
                styles.resultsModalContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.resultsDragHandle,
                  { backgroundColor: colors.border },
                ]}
              />
              <ScrollView
                style={styles.resultsScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.resultHeader}>
                  <Eyebrow style={styles.resultEyebrow}>
                    {t('camera.resultEyebrow')}
                  </Eyebrow>
                  <Display
                    size="lg"
                    color={colors.textPrimary}
                    style={styles.resultTitle}
                  >
                    {scanResult.data.name}
                  </Display>
                </View>

                {/* Calorie & Nutrition Info */}
                {scanResult.data.calories && (
                  <View
                    style={[
                      styles.calorieContainer,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderLight,
                      },
                    ]}
                  >
                    <Eyebrow style={styles.calorieTitle}>
                      {t('camera.nutritionTitle')}
                    </Eyebrow>
                    <View style={styles.calorieGrid}>
                      <View style={styles.calorieItem}>
                        <Display size="md" color={colors.primary}>
                          {scanResult.data.calories}
                        </Display>
                        <Text
                          style={[
                            styles.calorieLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t('camera.calories')}
                        </Text>
                      </View>
                      {scanResult.data.nutrition && (
                        <>
                          <View style={styles.calorieItem}>
                            <Display size="md" color={colors.secondary}>
                              {scanResult.data.nutrition.protein}g
                            </Display>
                            <Text
                              style={[
                                styles.calorieLabel,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {t('camera.protein')}
                            </Text>
                          </View>
                          <View style={styles.calorieItem}>
                            <Display size="md" color={colors.accent}>
                              {scanResult.data.nutrition.carbs}g
                            </Display>
                            <Text
                              style={[
                                styles.calorieLabel,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {t('camera.carbs')}
                            </Text>
                          </View>
                          <View style={styles.calorieItem}>
                            <Display size="md" color={colors.error}>
                              {scanResult.data.nutrition.fat}g
                            </Display>
                            <Text
                              style={[
                                styles.calorieLabel,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {t('camera.fat')}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                )}

                {scanResult.data.error ? (
                  <View style={styles.errorContainer}>
                    <AlertTriangle size={24} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {scanResult.data.error}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.retryButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={clearResults}
                    >
                      <Text style={styles.retryButtonText}>
                        {t('common.retry')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {/* ✅ DETECTED ITEMS - NO CONFIDENCE SCORES */}
                    {scanResult.data.items &&
                      scanResult.data.items.length > 0 && (
                        <View style={styles.itemsContainer}>
                          <View style={styles.resultSectionTitle}>
                            <Sparkles size={16} color={colors.secondary} />
                            <Display size="sm" color={colors.textPrimary}>
                              {t('camera.foundItems')}
                            </Display>
                          </View>
                          {scanResult.data.items.map(
                            (item: any, index: number) => (
                              <View
                                key={index}
                                style={[
                                  styles.detectedItem,
                                  {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.borderLight,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.itemName,
                                    { color: colors.textPrimary },
                                  ]}
                                >
                                  {item.name || item.item}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      )}

                    {/* Suggestions */}
                    {scanResult.data.suggestions &&
                      scanResult.data.suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                          <View style={styles.resultSectionTitle}>
                            <Lightbulb size={16} color={colors.accent} />
                            <Display size="sm" color={colors.textPrimary}>
                              {t('camera.suggestions')}
                            </Display>
                          </View>
                          {scanResult.data.suggestions.map(
                            (suggestion: string, index: number) => (
                              <Text
                                key={index}
                                style={[
                                  styles.suggestionText,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                • {suggestion}
                              </Text>
                            ),
                          )}
                        </View>
                      )}

                    {/* Raw Text (for receipt scanner) */}
                    {scanResult.data.text && scanMode === 'receipt-scanner' && (
                      <View style={styles.textContainer}>
                        <View style={styles.resultSectionTitle}>
                          <FileText size={16} color={colors.textSecondary} />
                          <Display size="sm" color={colors.textPrimary}>
                            {t('camera.extractedText')}
                          </Display>
                        </View>
                        <ScrollView
                          style={[
                            styles.textScroll,
                            { backgroundColor: colors.surface },
                          ]}
                          nestedScrollEnabled={true}
                        >
                          <Text
                            style={[
                              styles.extractedText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {scanResult.data.text}
                          </Text>
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.clearButton, { borderColor: colors.border }]}
                    onPress={clearResults}
                  >
                    <X size={18} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.clearButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t('common.close')}
                    </Text>
                  </TouchableOpacity>

                  {scanResult.data.items &&
                    scanResult.data.items.length > 0 &&
                    scanMode !== 'calorie-counter' && (
                      <TouchableOpacity
                        style={[
                          styles.addAllButton,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          // Add all detected items to pantry
                          const detected = scanResult.data.items;
                          if (!detected) return;
                          Alert.alert(
                            t('camera.addAll'),
                            t('camera.addAllConfirmMessage', {
                              count: detected.length,
                            }),
                            [
                              {
                                text: t('camera.addAllCancel'),
                                style: 'cancel',
                              },
                              {
                                text: t('camera.addAll'),
                                onPress: () => {
                                  // Convert to EnhancedParsedItem format
                                  const items: EnhancedParsedItem[] =
                                    detected.map(
                                      (item: any, index: number) => ({
                                        id: `scan_${Date.now()}_${index}`,
                                        name:
                                          item.name ||
                                          item.item ||
                                          'Unknown Item',
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
                              },
                            ],
                          );
                        }}
                      >
                        <Plus size={18} color="#FFFFFF" />
                        <Text style={styles.addAllButtonText}>
                          {t('camera.addAll')}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Add to Inventory Modal */}
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

    // Loading Styles
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

    // ✅ PROGRESS INDICATOR STYLES
    progressContainer: {
      marginTop: 20,
      width: '100%',
      alignItems: 'center',
    },
    progressBar: {
      width: '80%',
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 3,
    },
    progressText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
      marginTop: 8,
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

    // Results Modal Styles
    resultsModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    resultsModalBackground: {
      flex: 1,
    },
    resultsModalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 10,
    },
    resultsDragHandle: {
      width: 40,
      height: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 15,
    },
    resultsScroll: {
      flex: 1,
      paddingHorizontal: 20,
    },
    resultHeader: {
      marginBottom: 20,
    },
    resultEyebrow: {
      marginBottom: 6,
    },
    resultTitle: {
      // serif Display; layout only
    },
    resultSectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 12,
    },

    // Error Styles
    errorContainer: {
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 15,
      fontFamily: 'Inter-Medium',
      color: colors.error,
      textAlign: 'center',
      marginVertical: 15,
      lineHeight: 22,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      height: 48,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-Bold',
    },

    // Calorie Styles
    calorieContainer: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: 20,
      shadowColor: '#3C2814',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    calorieTitle: {
      textAlign: 'center',
      marginBottom: 15,
    },
    calorieGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
    },
    calorieItem: {
      alignItems: 'center',
      minWidth: 60,
      gap: 2,
    },
    calorieLabel: {
      fontSize: 11,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Items Styles
    itemsContainer: {
      marginBottom: 20,
    },
    detectedItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 15,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      marginBottom: 8,
    },
    itemName: {
      fontSize: 15,
      fontFamily: 'Inter-Medium',
      color: colors.textPrimary,
      flex: 1,
    },

    // Suggestions Styles
    suggestionsContainer: {
      marginBottom: 20,
    },
    suggestionText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 6,
      lineHeight: 20,
    },

    // Text Container
    textContainer: {
      marginBottom: 20,
    },
    textScroll: {
      maxHeight: 150,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 15,
    },
    extractedText: {
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 18,
      fontFamily: 'monospace',
    },

    // Action Buttons
    actionButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 20,
      paddingBottom: 30,
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 20,
      height: 48,
      borderRadius: 18,
    },
    clearButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 8,
    },
    addAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 22,
      height: 48,
      borderRadius: 18,
    },
    addAllButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      marginLeft: 8,
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
