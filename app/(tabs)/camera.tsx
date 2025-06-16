Copyimport React, { useState, useRef, useEffect } from 'react';
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
import { Camera, Brain, Receipt, Image, FlipHorizontal, TriangleAlert as AlertTriangle, Images, Calculator, X, Scan, Check, Plus, Edit } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { OpenAIVisionService } from '../../lib/openaiVisionService';
import { convertImageToBase64, validateImageSize } from '../../lib/imageUtils';
import { ReceiptLearningService } from '../../lib/learningService';
import { ReceiptLearning, UserFeedback, ParsedItem } from '../../types/learning';
import { RapidApiOCRService, OCRParseResult } from '../../lib/rapidApiOCRService';

type ScanMode = 'food-recognition' | 'receipt-scanner' | 'single-photo' | 'multiple-images' | 'calorie-counter' | 'barcode-scanner';

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
  const [currentReceiptLearningId, setCurrentReceiptLearningId] = useState<string | null>(null);
  const [originalReceiptText, setOriginalReceiptText] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  
  // OCR STATES
  const [lastScanImageUri, setLastScanImageUri] = useState<string | null>(null);
  const [lastOcrResult, setLastOcrResult] = useState<OCRParseResult | null>(null);
  
  const cameraRef = useRef<CameraView>(null);
  const tutorialOpacity = useRef(new Animated.Value(1)).current;

  const CAMERA_MODES = {
    'single-photo': {
      title: 'SINGLE',
      icon: Camera,
      color: '#FFD700',
      description: 'Quick food analysis'
    },
    'food-recognition': {
      title: 'AI FOOD', 
      icon: Brain,
      color: '#32CD32',
      description: 'Identify ingredients'
    },
    'barcode-scanner': {
      title: 'BARCODE',
      icon: Scan,
      color: '#9C27B0',
      description: 'Scan product codes'
    },
    'multiple-images': {
      title: 'MULTIPLE',
      icon: Images,
      color: '#FF69B4',
      description: 'Batch analysis'
    },
    'calorie-counter': {
      title: 'CALORIES',
      icon: Calculator,
      color: '#FF4500',
      description: 'Nutrition info'
    },
    'receipt-scanner': {
      title: 'RECEIPT',
      icon: Receipt,
      color: '#1E90FF',
      description: 'Smart inventory'
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
  const handleItemAction = (itemId: string, action: 'confirm' | 'reject' | 'edit', newName?: string) => {
    console.log('🔘 Item action:', action, 'for item:', itemId);
    
    setParsedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const feedback: UserFeedback = {
          item_id: itemId,
          action,
          original_name: item.name,
          corrected_name: newName,
          is_food: action === 'confirm' ? true : action === 'reject' ? false : item.is_food,
          confidence: item.confidence
        };
        
        setUserFeedback(prev => [...prev, feedback]);
        
        return {
          ...item,
          user_action: action,
          name: newName || item.name
        };
      }
      return item;
    }));
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Add Items to Inventory Function
  const addToInventory = async (items: EnhancedParsedItem[]) => {
    try {
      console.log('🏪 Adding items to inventory:', items);
      
      const confirmedFoodItems = items.filter(item => 
        item.user_action === 'confirmed' && item.is_food
      );

      if (confirmedFoodItems.length === 0) {
        Alert.alert('No Items Selected', 'Please confirm some food items first');
        return;
      }

      // Add to pantry
      const success = await ReceiptLearningService.addItemsToPantry(confirmedFoodItems);
      
      if (!success) {
        throw new Error('Failed to add items to pantry');
      }

      // Prepare learning data if we have OCR results
      if (lastOcrResult && lastScanImageUri) {
        const confirmedItems = items.filter(item => item.user_action === 'confirmed');
        const rejectedItems = items.filter(item => item.user_action === 'rejected').map(item => item.name);
        const accuracy = confirmedItems.length > 0 ? (confirmedItems.length / items.length) * 100 : 0;

        const learningData: ReceiptLearning = {
          original_text: originalReceiptText,
          store_name: lastOcrResult.store_name,
          store_format: lastOcrResult.store_name || 'unknown',
          parsed_items: items,
          confirmed_items: confirmedItems,
          rejected_items: rejectedItems,
          accuracy_score: accuracy,
          processing_time: lastOcrResult.processing_time,
          items_count: items.length,
          parsing_method: 'rapidapi_ocr'
        };

        // Save learning data
        const receiptLearningId = await ReceiptLearningService.saveReceiptLearning(learningData);
        
        if (receiptLearningId && userFeedback.length > 0) {
          const sessionStats = {
            duration: Math.round((Date.now() - learningStartTime) / 1000),
            confirmed: items.filter(item => item.user_action === 'confirmed').length,
            rejected: items.filter(item => item.user_action === 'rejected').length,
            edited: items.filter(item => item.user_action === 'edited').length,
            added: 0,
            completed: true
          };
          
          await ReceiptLearningService.saveFeedbackSession(
            receiptLearningId,
            userFeedback,
            sessionStats
          );
        }
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const accuracy = lastOcrResult?.confidence || 0;
      Alert.alert(
        'Success! 🎉',
        `Added ${confirmedFoodItems.length} food items to your pantry!\n\nOCR Accuracy: ${Math.round(accuracy)}%\nThanks for helping improve the AI! 🤖`,
        [{ text: 'Great!', style: 'default' }]
      );
      
    } catch (error) {
      console.error('❌ Error adding to inventory:', error);
      Alert.alert('Error', 'Failed to add items to inventory. Please try again.');
    }
  };

  // Process image with OpenAI Vision
  const processImageWithVision = async (imageUri: string | string[]) => {
    try {
      setIsLoading(true);
      setScanResult(null);
      
      console.log('🚀 Starting AI Vision processing...');
      
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
          
          const analysisResult = await OpenAIVisionService.analyzeImage(base64, scanMode);
          allResults.push(analysisResult);
        }
        
        const combinedItems = allResults.flatMap(r => r.detectedItems);
        
        result = {
          type: scanMode,
          data: {
            name: `${imageUri.length} Images Analyzed`,
            confidence: Math.round(combinedItems.reduce((acc, item) => acc + item.confidence, 0) / combinedItems.length),
            items: combinedItems,
            suggestions: [`Found ${combinedItems.length} items`, 'Add all to pantry', 'Create meal plan'],
            imageType: 'ai-multiple-analysis',
          }
        };
      } else {
        // Single image processing
        const base64 = await convertImageToBase64(Array.isArray(imageUri) ? imageUri[0] : imageUri);
        
        if (!validateImageSize(base64, 15000)) {
          throw new Error('Image too large. Please use a smaller image.');
        }
        
        const analysisResult = await OpenAIVisionService.analyzeImage(base64, scanMode);
        
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
          }
        };
        
        // Receipt Scanner with RapidAPI OCR
        if (scanMode === 'receipt-scanner' && analysisResult.text) {
          setLearningStartTime(Date.now());
          setOriginalReceiptText(analysisResult.text);
          
          try {
            console.log('🚀 Using RapidAPI OCR directly...');
            const ocrResult = await RapidApiOCRService.parseReceipt(base64);
            setLastOcrResult(ocrResult);
            
            if (ocrResult.success && ocrResult.items.length > 0) {
              console.log(`✅ OCR parsing successful: ${ocrResult.items.length} items found`);
              setParsedItems(ocrResult.items);
              
              setTimeout(() => {
                setShowAddToInventoryModal(true);
              }, 1000);
              return; // Exit early on OCR success
            } else {
              console.warn('⚠️ OCR returned no items');
              Alert.alert('OCR Result', 'No items detected. Please try again with better lighting.');
            }
          } catch (error) {
            console.error('❌ OCR API failed:', error);
            Alert.alert('OCR Error', 'Receipt processing failed. Please try again.');
          }
        }
      }
      
      console.log('✅ AI Vision processing successful:', result);
      setScanResult(result);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('❌ AI Vision processing failed:', error);
      
      setScanResult({
        type: scanMode,
        data: {
          name: 'Processing Failed',
          confidence: 0,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Take photo with camera
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      console.log('📸 Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        console.log('✅ Picture taken:', photo.uri);
        
        if (scanMode === 'multiple-images') {
          setMultipleImages(prev => [...prev, photo.uri]);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          await processImageWithVision(photo.uri);
        }
      }
    } catch (error) {
      console.error('❌ Error taking picture:', error);
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
          const imageUris = result.assets.map(asset => asset.uri);
          console.log('📂 Multiple images picked:', imageUris.length);
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
          console.log('📂 Image picked from gallery:', imageUri);
          await processImageWithVision(imageUri);
        }
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
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

  // Clear results
  const clearResults = () => {
    setScanResult(null);
    setMultipleImages([]);
    setParsedItems([]);
    setUserFeedback([]);
    setCurrentReceiptLearningId(null);
    setOriginalReceiptText('');
    setLastScanImageUri(null);
    setLastOcrResult(null);
  };

  // Hide tutorial manually
  const hideTutorial = () => {
    Animated.timing(tutorialOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowTutorial(false));
  };

  // Add to Inventory Modal
  const AddToInventoryModal = () => {
    const confirmedCount = parsedItems.filter(item => item.user_action === 'confirmed').length;
    
    return (
      <Modal
        visible={showAddToInventoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddToInventoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🤖 Smart Receipt Review</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAddToInventoryModal(false)}
              >
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalMessage}>
              {lastOcrResult?.method === 'rapidapi' ? 'OCR API' : 'AI'} found {parsedItems.length} items. Please review and confirm food items:
            </Text>
            
            {/* OCR Confidence Display */}
            {lastOcrResult && (
              <View style={styles.ocrStatsContainer}>
                <Text style={styles.ocrStatsText}>
                  📊 OCR Confidence: {lastOcrResult.confidence}% | Store: {lastOcrResult.store_name || 'Unknown'} | Processing: {lastOcrResult.processing_time}ms
                </Text>
              </View>
            )}
            
            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
              {parsedItems.map((item) => (
                <View key={item.id} style={[
                  styles.modalItem,
                  item.user_action === 'confirmed' && styles.modalItemConfirmed,
                  item.user_action === 'rejected' && styles.modalItemRejected
                ]}>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <View style={styles.modalItemMeta}>
                      {item.price && (
                        <Text style={styles.modalItemPrice}>${item.price.toFixed(2)}</Text>
                      )}
                      <Text style={styles.modalItemConfidence}>
                        {item.confidence}% confidence
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalItemActions}>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.confirmButton,
                        item.user_action === 'confirmed' && styles.actionButtonActive
                      ]}
                      onPress={() => handleItemAction(item.id, 'confirm')}
                      activeOpacity={0.7}
                    >
                      <Check size={14} color={item.user_action === 'confirmed' ? '#FFFFFF' : theme.colors.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.rejectButton,
                        item.user_action === 'rejected' && styles.actionButtonActive
                      ]}
                      onPress={() => handleItemAction(item.id, 'reject')}
                      activeOpacity={0.7}
                    >
                      <X size={14} color={item.user_action === 'rejected' ? '#FFFFFF' : theme.colors.error} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        Alert.prompt(
                          'Edit Item Name',
                          `Current: ${item.name}`,
                          (newName) => {
                            if (newName && newName.trim()) {
                              handleItemAction(item.id, 'edit', newName.trim().toUpperCase());
                            }
                          },
                          'plain-text',
                          item.name
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit size={14} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.modalStats}>
              <Text style={styles.modalStatsText}>
                ✅ {parsedItems.filter(item => item.user_action === 'confirmed').length} confirmed  
                ❌ {parsedItems.filter(item => item.user_action === 'rejected').length} rejected  
                ✏️ {parsedItems.filter(item => item.user_action === 'edited').length} edited
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAddToInventoryModal(false)}
              >
                <Text style={styles.modalCancelText}>Not Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.modalConfirmButton,
                  confirmedCount === 0 && styles.modalButtonDisabled
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
                  Add {confirmedCount} Items
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                🧠 Your feedback helps improve AI accuracy
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need camera permission to continue</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Full Screen */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          {/* Tutorial Overlay */}
          {showTutorial && (
            <Animated.View style={[styles.tutorialOverlay, { opacity: tutorialOpacity }]}>
              <View style={styles.tutorialContent}>
                <TouchableOpacity style={styles.tutorialClose} onPress={hideTutorial}>
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.tutorialTitle}>AI Camera Modes 🤖</Text>
                <Text style={styles.tutorialText}>
                  <Text style={styles.tutorialHighlight}>AI FOOD:</Text> Smart ingredient recognition{'\n'}
                  <Text style={styles.tutorialHighlight}>CALORIES:</Text> Accurate nutrition analysis{'\n'}
                  <Text style={styles.tutorialHighlight}>BARCODE:</Text> Product code scanning{'\n'}
                  <Text style={styles.tutorialHighlight}>MULTIPLE:</Text> Batch processing{'\n'}
                  <Text style={styles.tutorialHighlight}>RECEIPT:</Text> Smart OCR parsing
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>
                  {scanMode === 'receipt-scanner' ? 'Reading receipt with OCR...' : 
                   scanMode === 'food-recognition' ? 'Analyzing food...' :
                   scanMode === 'calorie-counter' ? 'Calculating nutrition...' :
                   scanMode === 'multiple-images' ? 'Processing images...' :
                   scanMode === 'barcode-scanner' ? 'Scanning barcode...' : 
                   'AI processing...'}
                </Text>
              </View>
            </View>
          )}

          {/* Apple-style Mode Selector */}
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
                    style={styles.appleModeButton}
                    onPress={() => {
                      setScanMode(key as ScanMode);
                      clearResults();
                      setShowTutorial(false);
                    }}
                  >
                    <Text style={[
                      styles.appleModeText,
                      isActive && { color: mode.color, fontWeight: '700' }
                    ]}>
                      {mode.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Multiple Images Counter */}
          {scanMode === 'multiple-images' && multipleImages.length > 0 && (
            <View style={styles.multipleCounter}>
              <Text style={styles.multipleCounterText}>
                📸 {multipleImages.length} photos
              </Text>
              <TouchableOpacity 
                style={styles.processButton}
                onPress={processMultipleImages}
              >
                <Text style={styles.processButtonText}>Process with AI</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Apple-style Controls */}
          <View style={styles.appleControls}>
            {/* Gallery Button */}
            <TouchableOpacity style={styles.appleGalleryButton} onPress={pickImages}>
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
              <View style={[
                styles.appleCaptureInner,
                isLoading && styles.captureButtonDisabled
              ]} />
            </TouchableOpacity>
            
            {/* Flip Button */}
            <TouchableOpacity 
              style={styles.appleFlipButton} 
              onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
            >
              <FlipHorizontal size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>

      {/* Results Display - Overlay */}
      {scanResult && !showAddToInventoryModal && (
        <View style={styles.resultsOverlay}>
          <View style={styles.resultsDragHandle} />
          <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{scanResult.data.name}</Text>
            </View>

            {/* Calorie & Nutrition Info */}
            {scanResult.data.calories && (
              <View style={styles.calorieContainer}>
                <Text style={styles.calorieTitle}>🔥 Nutrition Analysis</Text>
                <View style={styles.calorieGrid}>
                  <View style={styles.calorieItem}>
                    <Text style={styles.calorieNumber}>{scanResult.data.calories}</Text>
                    <Text style={styles.calorieLabel}>Calories</Text>
                  </View>
                  {scanResult.data.nutrition && (
                    <>
                      <View style={styles.calorieItem}>
                        <Text style={styles.calorieNumber}>{scanResult.data.nutrition.protein}g</Text>
                        <Text style={styles.calorieLabel}>Protein</Text>
                      </View>
                      <View style={styles.calorieItem}>
                        <Text style={styles.calorieNumber}>{scanResult.data.nutrition.carbs}g</Text>
                        <Text style={styles.calorieLabel}>Carbs</Text>
                      </View>
                      <View style={styles.calorieItem}>
                        <Text style={styles.calorieNumber}>{scanResult.data.nutrition.fat}g</Text>
                        <Text style={styles.calorieLabel}>Fat</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {scanResult.data.error ? (
              <View style={styles.errorContainer}>
                <AlertTriangle size={24} color={theme.colors.error} />
                <Text style={styles.errorText}>{scanResult.data.error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={clearResults}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Confidence Score */}
                <View style={styles.confidenceContainer}>
                  <Text
Copy
Save to Notion
  {/* Confidence Score */}
                <View style={styles.confidenceContainer}>
                  <Text
confidence score istemiyorduk?  neden böyle yazıon
🤔 HAKLISINN! CONFIDENCE SCORE İSTEMİYORDUK!

🔧 CONFIDENCE SCORE KISMINI KALDIRALIM:
Bu kısmı tamamen sil:

Copy// ❌ BU KISMI SİL:
{/* Confidence Score */}
<View style={styles.confidenceContainer}>
  <Text style={styles.confidenceLabel}>AI Confidence</Text>
  <View style={styles.confidenceBar}>
    <View 
      style={[
        styles.confidenceFill, 
        { width: `${scanResult.data.confidence}%` }
      ]} 
    />
  </View>
  <Text style={styles.confidenceText}>{scanResult.data.confidence}%</Text>
</View>
✅ DÜZELTİLMİŞ VERSİYON:
Copy{scanResult.data.error ? (
  <View style={styles.errorContainer}>
    <AlertTriangle size={24} color={theme.colors.error} />
    <Text style={styles.errorText}>{scanResult.data.error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={clearResults}>
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
) : (
  <>
    {/* Detected Items */}
    {scanResult.data.items && scanResult.data.items.length > 0 && (
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>🔍 Detected Items</Text>
        {scanResult.data.items.map((item: any, index: number) => (
          <View key={index} style={styles.detectedItem}>
            <Text style={styles.itemName}>{item.name || item.item}</Text>
            <Text style={styles.itemConfidence}>{item.confidence}%</Text>
          </View>
        ))}
      </View>
    )}
    
    {/* Suggestions */}
    {scanResult.data.suggestions && scanResult.data.suggestions.length > 0 && (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>💡 Suggestions</Text>
        {scanResult.data.suggestions.map((suggestion: string, index: number) => (
          <Text key={index} style={styles.suggestionText}>• {suggestion}</Text>
        ))}
      </View>
    )}

    {/* Raw Text (for receipt scanner) */}
    {scanResult.data.text && scanMode === 'receipt-scanner' && (
      <View style={styles.textContainer}>
        <Text style={styles.textTitle}>📄 Extracted Text</Text>
        <ScrollView style={styles.textScroll} nestedScrollEnabled={true}>
          <Text style={styles.extractedText}>{scanResult.data.text}</Text>
        </ScrollView>
      </View>
    )}
  </>
)}
Confidence Score'u tamamen kaldır, direkt Detected Items'tan başlasın! 🗑️

Bu düzeltmeyi yap! ✅

Copy
Save to Notion
tekrar baştan yaz html olarak tek seferde ver tüm kodu
🔧 CAMERA.TSX - COMPLETE CLEAN VERSION:

Copyimport React, { useState, useRef, useEffect } from 'react';
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
import { Camera, Brain, Receipt, Image, FlipHorizontal, TriangleAlert as AlertTriangle, Images, Calculator, X, Scan, Check, Plus, Edit } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { OpenAIVisionService } from '../../lib/openaiVisionService';
import { convertImageToBase64, validateImageSize } from '../../lib/imageUtils';
import { ReceiptLearningService } from '../../lib/learningService';
import { ReceiptLearning, UserFeedback, ParsedItem } from '../../types/learning';
import { RapidApiOCRService, OCRParseResult } from '../../lib/rapidApiOCRService';

type ScanMode = 'food-recognition' | 'receipt-scanner' | 'single-photo' | 'multiple-images' | 'calorie-counter' | 'barcode-scanner';

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
  const [currentReceiptLearningId, setCurrentReceiptLearningId] = useState<string | null>(null);
  const [originalReceiptText, setOriginalReceiptText] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  
  // OCR STATES
  const [lastScanImageUri, setLastScanImageUri] = useState<string | null>(null);
  const [lastOcrResult, setLastOcrResult] = useState<OCRParseResult | null>(null);
  
  const cameraRef = useRef<CameraView>(null);
  const tutorialOpacity = useRef(new Animated.Value(1)).current;

  const CAMERA_MODES = {
    'single-photo': {
      title: 'SINGLE',
      icon: Camera,
      color: '#FFD700',
      description: 'Quick food analysis'
    },
    'food-recognition': {
      title: 'AI FOOD', 
      icon: Brain,
      color: '#32CD32',
      description: 'Identify ingredients'
    },
    'barcode-scanner': {
      title: 'BARCODE',
      icon: Scan,
      color: '#9C27B0',
      description: 'Scan product codes'
    },
    'multiple-images': {
      title: 'MULTIPLE',
      icon: Images,
      color: '#FF69B4',
      description: 'Batch analysis'
    },
    'calorie-counter': {
      title: 'CALORIES',
      icon: Calculator,
      color: '#FF4500',
      description: 'Nutrition info'
    },
    'receipt-scanner': {
      title: 'RECEIPT',
      icon: Receipt,
      color: '#1E90FF',
      description: 'Smart inventory'
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
  const handleItemAction = (itemId: string, action: 'confirm' | 'reject' | 'edit', newName?: string) => {
    console.log('🔘 Item action:', action, 'for item:', itemId);
    
    setParsedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const feedback: UserFeedback = {
          item_id: itemId,
          action,
          original_name: item.name,
          corrected_name: newName,
          is_food: action === 'confirm' ? true : action === 'reject' ? false : item.is_food,
          confidence: item.confidence
        };
        
        setUserFeedback(prev => [...prev, feedback]);
        
        return {
          ...item,
          user_action: action,
          name: newName || item.name
        };
      }
      return item;
    }));
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Add Items to Inventory Function
  const addToInventory = async (items: EnhancedParsedItem[]) => {
    try {
      console.log('🏪 Adding items to inventory:', items);
      
      const confirmedFoodItems = items.filter(item => 
        item.user_action === 'confirmed' && item.is_food
      );

      if (confirmedFoodItems.length === 0) {
        Alert.alert('No Items Selected', 'Please confirm some food items first');
        return;
      }

      // Add to pantry
      const success = await ReceiptLearningService.addItemsToPantry(confirmedFoodItems);
      
      if (!success) {
        throw new Error('Failed to add items to pantry');
      }

      // Prepare learning data if we have OCR results
      if (lastOcrResult && lastScanImageUri) {
        const confirmedItems = items.filter(item => item.user_action === 'confirmed');
        const rejectedItems = items.filter(item => item.user_action === 'rejected').map(item => item.name);
        const accuracy = confirmedItems.length > 0 ? (confirmedItems.length / items.length) * 100 : 0;

        const learningData: ReceiptLearning = {
          original_text: originalReceiptText,
          store_name: lastOcrResult.store_name,
          store_format: lastOcrResult.store_name || 'unknown',
          parsed_items: items,
          confirmed_items: confirmedItems,
          rejected_items: rejectedItems,
          accuracy_score: accuracy,
          processing_time: lastOcrResult.processing_time,
          items_count: items.length,
          parsing_method: 'rapidapi_ocr'
        };

        // Save learning data
        const receiptLearningId = await ReceiptLearningService.saveReceiptLearning(learningData);
        
        if (receiptLearningId && userFeedback.length > 0) {
          const sessionStats = {
            duration: Math.round((Date.now() - learningStartTime) / 1000),
            confirmed: items.filter(item => item.user_action === 'confirmed').length,
            rejected: items.filter(item => item.user_action === 'rejected').length,
            edited: items.filter(item => item.user_action === 'edited').length,
            added: 0,
            completed: true
          };
          
          await ReceiptLearningService.saveFeedbackSession(
            receiptLearningId,
            userFeedback,
            sessionStats
          );
        }
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const accuracy = lastOcrResult?.confidence || 0;
      Alert.alert(
        'Success! 🎉',
        `Added ${confirmedFoodItems.length} food items to your pantry!\n\nOCR Accuracy: ${Math.round(accuracy)}%\nThanks for helping improve the AI! 🤖`,
        [{ text: 'Great!', style: 'default' }]
      );
      
    } catch (error) {
      console.error('❌ Error adding to inventory:', error);
      Alert.alert('Error', 'Failed to add items to inventory. Please try again.');
    }
  };

  // Process image with OpenAI Vision
  const processImageWithVision = async (imageUri: string | string[]) => {
    try {
      setIsLoading(true);
      setScanResult(null);
      
      console.log('🚀 Starting AI Vision processing...');
      
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
          
          const analysisResult = await OpenAIVisionService.analyzeImage(base64, scanMode);
          allResults.push(analysisResult);
        }
        
        const combinedItems = allResults.flatMap(r => r.detectedItems);
        
        result = {
          type: scanMode,
          data: {
            name: `${imageUri.length} Images Analyzed`,
            confidence: Math.round(combinedItems.reduce((acc, item) => acc + item.confidence, 0) / combinedItems.length),
            items: combinedItems,
            suggestions: [`Found ${combinedItems.length} items`, 'Add all to pantry', 'Create meal plan'],
            imageType: 'ai-multiple-analysis',
          }
        };
      } else {
        // Single image processing
        const base64 = await convertImageToBase64(Array.isArray(imageUri) ? imageUri[0] : imageUri);
        
        if (!validateImageSize(base64, 15000)) {
          throw new Error('Image too large. Please use a smaller image.');
        }
        
        const analysisResult = await OpenAIVisionService.analyzeImage(base64, scanMode);
        
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
          }
        };
        
        // Receipt Scanner with RapidAPI OCR
        if (scanMode === 'receipt-scanner' && analysisResult.text) {
          setLearningStartTime(Date.now());
          setOriginalReceiptText(analysisResult.text);
          
          try {
            console.log('🚀 Using RapidAPI OCR directly...');
            const ocrResult = await RapidApiOCRService.parseReceipt(base64);
            setLastOcrResult(ocrResult);
            
            if (ocrResult.success && ocrResult.items.length > 0) {
              console.log(`✅ OCR parsing successful: ${ocrResult.items.length} items found`);
              setParsedItems(ocrResult.items);
              
              setTimeout(() => {
                setShowAddToInventoryModal(true);
              }, 1000);
              return; // Exit early on OCR success
            } else {
              console.warn('⚠️ OCR returned no items');
              Alert.alert('OCR Result', 'No items detected. Please try again with better lighting.');
            }
          } catch (error) {
            console.error('❌ OCR API failed:', error);
            Alert.alert('OCR Error', 'Receipt processing failed. Please try again.');
          }
        }
      }
      
      console.log('✅ AI Vision processing successful:', result);
      setScanResult(result);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('❌ AI Vision processing failed:', error);
      
      setScanResult({
        type: scanMode,
        data: {
          name: 'Processing Failed',
          confidence: 0,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Take photo with camera
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      console.log('📸 Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        console.log('✅ Picture taken:', photo.uri);
        
        if (scanMode === 'multiple-images') {
          setMultipleImages(prev => [...prev, photo.uri]);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          await processImageWithVision(photo.uri);
        }
      }
    } catch (error) {
      console.error('❌ Error taking picture:', error);
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
          const imageUris = result.assets.map(asset => asset.uri);
          console.log('📂 Multiple images picked:', imageUris.length);
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
          console.log('📂 Image picked from gallery:', imageUri);
          await processImageWithVision(imageUri);
        }
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
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

  // Clear results
  const clearResults = () => {
    setScanResult(null);
    setMultipleImages([]);
    setParsedItems([]);
    setUserFeedback([]);
    setCurrentReceiptLearningId(null);
    setOriginalReceiptText('');
    setLastScanImageUri(null);
    setLastOcrResult(null);
  };

  // Hide tutorial manually
  const hideTutorial = () => {
    Animated.timing(tutorialOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowTutorial(false));
  };

  // Add to Inventory Modal
  const AddToInventoryModal = () => {
    const confirmedCount = parsedItems.filter(item => item.user_action === 'confirmed').length;
    
    return (
      <Modal
        visible={showAddToInventoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddToInventoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🤖 Smart Receipt Review</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAddToInventoryModal(false)}
              >
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalMessage}>
              {lastOcrResult?.method === 'rapidapi' ? 'OCR API' : 'AI'} found {parsedItems.length} items. Please review and confirm food items:
            </Text>
            
            {/* OCR Confidence Display */}
            {lastOcrResult && (
              <View style={styles.ocrStatsContainer}>
                <Text style={styles.ocrStatsText}>
                  📊 OCR Confidence: {lastOcrResult.confidence}% | Store: {lastOcrResult.store_name || 'Unknown'} | Processing: {lastOcrResult.processing_time}ms
                </Text>
              </View>
            )}
            
            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
              {parsedItems.map((item) => (
                <View key={item.id} style={[
                  styles.modalItem,
                  item.user_action === 'confirmed' && styles.modalItemConfirmed,
                  item.user_action === 'rejected' && styles.modalItemRejected
                ]}>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <View style={styles.modalItemMeta}>
                      {item.price && (
                        <Text style={styles.modalItemPrice}>${item.price.toFixed(2)}</Text>
                      )}
                      <Text style={styles.modalItemConfidence}>
                        {item.confidence}% confidence
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalItemActions}>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.confirmButton,
                        item.user_action === 'confirmed' && styles.actionButtonActive
                      ]}
                      onPress={() => handleItemAction(item.id, 'confirm')}
                      activeOpacity={0.7}
                    >
                      <Check size={14} color={item.user_action === 'confirmed' ? '#FFFFFF' : theme.colors.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        styles.rejectButton,
                        item.user_action === 'rejected' && styles.actionButtonActive
                      ]}
                      onPress={() => handleItemAction(item.id, 'reject')}
                      activeOpacity={0.7}
                    >
                      <X size={14} color={item.user_action === 'rejected' ? '#FFFFFF' : theme.colors.error} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        Alert.prompt(
                          'Edit Item Name',
                          `Current: ${item.name}`,
                          (newName) => {
                            if (newName && newName.trim()) {
                              handleItemAction(item.id, 'edit', newName.trim().toUpperCase());
                            }
                          },
                          'plain-text',
                          item.name
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit size={14} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.modalStats}>
              <Text style={styles.modalStatsText}>
                ✅ {parsedItems.filter(item => item.user_action === 'confirmed').length} confirmed  
                ❌ {parsedItems.filter(item => item.user_action === 'rejected').length} rejected  
                ✏️ {parsedItems.filter(item => item.user_action === 'edited').length} edited
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAddToInventoryModal(false)}
              >
                <Text style={styles.modalCancelText}>Not Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.modalConfirmButton,
                  confirmedCount === 0 && styles.modalButtonDisabled
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
                  Add {confirmedCount} Items
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                🧠 Your feedback helps improve AI accuracy
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need camera permission to continue</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Full Screen */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          {/* Tutorial Overlay */}
          {showTutorial && (
            <Animated.View style={[styles.tutorialOverlay, { opacity: tutorialOpacity }]}>
              <View style={styles.tutorialContent}>
                <TouchableOpacity style={styles.tutorialClose} onPress={hideTutorial}>
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.tutorialTitle}>AI Camera Modes 🤖</Text>
                <Text style={styles.tutorialText}>
                  <Text style={styles.tutorialHighlight}>AI FOOD:</Text> Smart ingredient recognition{'\n'}
                  <Text style={styles.tutorialHighlight}>CALORIES:</Text> Accurate nutrition analysis{'\n'}
                  <Text style={styles.tutorialHighlight}>BARCODE:</Text> Product code scanning{'\n'}
                  <Text style={styles.tutorialHighlight}>MULTIPLE:</Text> Batch processing{'\n'}
                  <Text style={styles.tutorialHighlight}>RECEIPT:</Text> Smart OCR parsing
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>
                  {scanMode === 'receipt-scanner' ? 'Reading receipt with OCR...' : 
                   scanMode === 'food-recognition' ? 'Analyzing food...' :
                   scanMode === 'calorie-counter' ? 'Calculating nutrition...' :
                   scanMode === 'multiple-images' ? 'Processing images...' :
                   scanMode === 'barcode-scanner' ? 'Scanning barcode...' : 
                   'AI processing...'}
                </Text>
              </View>
            </View>
          )}

          {/* Apple-style Mode Selector */}
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
                    style={styles.appleModeButton}
                    onPress={() => {
                      setScanMode(key as ScanMode);
                      clearResults();
                      setShowTutorial(false);
                    }}
                  >
                    <Text style={[
                      styles.appleModeText,
                      isActive && { color: mode.color, fontWeight: '700' }
                    ]}>
                      {mode.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Multiple Images Counter */}
          {scanMode === 'multiple-images' && multipleImages.length > 0 && (
            <View style={styles.multipleCounter}>
              <Text style={styles.multipleCounterText}>
                📸 {multipleImages.length} photos
              </Text>
              <TouchableOpacity 
                style={styles.processButton}
                onPress={processMultipleImages}
              >
                <Text style={styles.processButtonText}>Process with AI</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Apple-style Controls */}
          <View style={styles.appleControls}>
            {/* Gallery Button */}
            <TouchableOpacity style={styles.appleGalleryButton} onPress={pickImages}>
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
              <View style={[
                styles.appleCaptureInner,
                isLoading && styles.captureButtonDisabled
              ]} />
            </TouchableOpacity>
            
            {/* Flip Button */}
            <TouchableOpacity 
              style={styles.appleFlipButton} 
              onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
            >
              <FlipHorizontal size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>

      {/* Results Display - Overlay */}
      {scanResult && !showAddToInventoryModal && (
        <View style={styles.resultsOverlay}>
          <View style={styles.resultsDragHandle} />
          <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{scanResult.data.name}</Text>
            </View>

            {/* Calorie & Nutrition Info */}
            {scanResult.data.calories && (
              <View style={styles.calorieContainer}>
                <Text style={styles.calorieTitle}>🔥 Nutrition Analysis</Text>
                <View style={styles.calorieGrid}>
                  <View style={styles.calorieItem}>
                    <Text style={styles.calorieNumber}>{scanResult.data.calories}</Text>
                    <Text style={styles.calorieLabel}>Calories</Text>
                  </View>
                  {scanResult.data.nutrition && (
                    <>
                      <View style={styles.calorieItem}>
                        <Text style={styles.calorieNumber}>{scanResult.data.nutrition.protein}g</Text>
                        <Text style={styles.calorieLabel}>Protein</Text>
                      </View>
                      <View style={styles.calorieItem}>
                        <Text style={styles.calorieNumber}>{scanResult.data.nutrition.carbs}g</Text>
                        <Text style={styles.calorieLabel}>Carbs</Text>
                      </View>
                      <View style={styles.calorieItem}>
                        <Text style={styles.calorieNumber}>{scanResult.data.nutrition.fat}g</Text>
                        <Text style={styles.calorieLabel}>Fat</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {scanResult.data.error ? (
              <View style={styles.errorContainer}>
                <AlertTriangle size={24} color={theme.colors.error} />
                <Text style={styles.errorText}>{scanResult.data.error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={clearResults}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                                {/* Detected Items */}
                {scanResult.data.items && scanResult.data.items.length > 0 && (
                  <View style={styles.itemsContainer}>
                    <Text style={styles.itemsTitle}>🔍 Detected Items</Text>
                    {scanResult.data.items.map((item: any, index: number) => (
                      <View key={index} style={styles.detectedItem}>
                        <Text style={styles.itemName}>{item.name || item.item}</Text>
                        <Text style={styles.itemConfidence}>{item.confidence}%</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Suggestions */}
                {scanResult.data.suggestions && scanResult.data.suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>💡 Suggestions</Text>
                    {scanResult.data.suggestions.map((suggestion: string, index: number) => (
                      <Text key={index} style={styles.suggestionText}>• {suggestion}</Text>
                    ))}
                  </View>
                )}

                {/* Raw Text (for receipt scanner) */}
                {scanResult.data.text && scanMode === 'receipt-scanner' && (
                  <View style={styles.textContainer}>
                    <Text style={styles.textTitle}>📄 Extracted Text</Text>
                    <ScrollView style={styles.textScroll} nestedScrollEnabled={true}>
                      <Text style={styles.extractedText}>{scanResult.data.text}</Text>
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
                <X size={18} color={theme.colors.text} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              
              {scanResult.data.items && scanResult.data.items.length > 0 && (
                <TouchableOpacity 
                  style={styles.addAllButton}
                  onPress={() => {
                    // Add all detected items to pantry
                    Alert.alert(
                      'Add All Items',
                      `Add ${scanResult.data.items.length} items to your pantry?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Add All', 
                          onPress: () => {
                            // Convert to EnhancedParsedItem format
                            const items: EnhancedParsedItem[] = scanResult.data.items.map((item: any, index: number) => ({
                              id: `scan_${Date.now()}_${index}`,
                              name: item.name || item.item || 'Unknown Item',
                              price: item.price,
                              quantity: item.quantity || 1,
                              category: 'food',
                              confidence: item.confidence || 70,
                              is_food: true,
                              user_action: 'confirmed'
                            }));
                            
                            addToInventory(items);
                            clearResults();
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Plus size={18} color="#FFFFFF" />
                  <Text style={styles.addAllButtonText}>Add All</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Add to Inventory Modal */}
      <AddToInventoryModal />
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    maxWidth: 320,
  },
  tutorialClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 15,
  },
  tutorialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 15,
  },
  tutorialText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  tutorialHighlight: {
    fontWeight: '700',
    color: theme.colors.primary,
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

  // Apple-style Mode Selector - MOBILE RESPONSIVE
  appleModeContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 10, // ✅ MOBILE RESPONSIVE
  },
  appleModeSelector: {
    flexGrow: 0,
  },
  appleModeScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  appleModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  appleModeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
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

  // Apple-style Controls - MOBILE RESPONSIVE
  appleControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30, // ✅ MOBILE RESPONSIVE (40 → 30)
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

  // Results Overlay
  resultsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '60%',
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
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },

  // Error Styles
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: 15,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Calorie Styles
  calorieContainer: {
    backgroundColor: 'rgba(255, 69, 0, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  calorieTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4500',
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
  },
  calorieNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF4500',
  },
  calorieLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Items Styles
  itemsContainer: {
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  detectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    borderRadius: 10,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  itemConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#32CD32',
  },

  // Suggestions Styles
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },

  // Text Container (for receipts)
  textContainer: {
    marginBottom: 20,
  },
  textTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  textScroll: {
    maxHeight: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    padding: 15,
  },
  extractedText: {
    fontSize: 13,
    color: theme.colors.text,
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
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  clearButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: theme.colors.background,
    borderRadius: 25,
    padding: 0,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
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
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    lineHeight: 22,
  },

  // OCR Stats
  ocrStatsContainer: {
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
  },
  ocrStatsText: {
    fontSize: 12,
    color: '#1E90FF',
    textAlign: 'center',
    fontWeight: '500',
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
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalItemConfirmed: {
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    borderColor: '#32CD32',
  },
  modalItemRejected: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: '#FF0000',
  },
  modalItemInfo: {
    flex: 1,
    marginRight: 15,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  modalItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 10,
  },
  modalItemConfidence: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    borderColor: '#32CD32',
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: '#FF0000',
  },
  editButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  // Modal Stats
  modalStats: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalStatsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    opacity: 0.5,
  },
  modalCancelText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Footer
  modalFooter: {
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  modalFooterText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})

