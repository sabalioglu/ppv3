// components/cookbook/CreateCookbookBottomSheet.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { COOKBOOK_COLORS, COOKBOOK_EMOJIS } from '../../types/cookbook';
import { colors, spacing, typography } from '../../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CreateCookbookBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCookbookBottomSheet({ visible, onClose, onSuccess }: CreateCookbookBottomSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('#F97316');
  const [loading, setLoading] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset form after animation
      setTimeout(() => {
        resetForm();
      }, 300);
    }
  }, [visible]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedEmoji('📚');
    setSelectedColor('#F97316');
  };

  const handleClose = () => {
    if (name.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to close? Your changes will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: onClose
          }
        ]
      );
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      Alert.alert('Required Field', 'Please enter a cookbook name');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Name Too Long', 'Cookbook name must be 50 characters or less');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to create cookbooks');
        onClose();
        return;
      }

      // Check for duplicate names
      const { data: existingCookbooks, error: checkError } = await supabase
        .from('cookbooks')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', trimmedName)
        .limit(1);

      if (checkError) throw checkError;

      if (existingCookbooks && existingCookbooks.length > 0) {
        Alert.alert('Duplicate Name', 'You already have a cookbook with this name');
        setLoading(false);
        return;
      }

      // Create cookbook
      const { error } = await supabase
        .from('cookbooks')
        .insert({
          user_id: user.id,
          name: trimmedName,
          description: description.trim() || null,
          emoji: selectedEmoji,
          color: selectedColor,
          is_default: false
        });

      if (error) throw error;

      // Success!
      onSuccess();
      onClose();
      
      // Show success message after sheet closes
      setTimeout(() => {
        Alert.alert('Success!', 'Cookbook created successfully');
      }, 400);

    } catch (err: any) {
      console.error('Error creating cookbook:', err);
      Alert.alert('Error', 'Failed to create cookbook. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.title}>Create New Cookbook</Text>
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={loading || !name.trim()}
              style={styles.saveButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <Text style={[
                  styles.saveButtonText,
                  (!name.trim()) && styles.saveButtonTextDisabled
                ]}>
                  Create
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Name Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Italian Favorites"
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.neutral[400]}
                maxLength={50}
                autoCapitalize="words"
              />
              <Text style={styles.charCount}>{name.length}/50</Text>
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="A collection of my favorite Italian recipes"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={2}
                maxLength={200}
              />
              <Text style={styles.charCount}>{description.length}/200</Text>
            </View>

            {/* Emoji Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Choose an Emoji</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.emojiContainer}
              >
                {COOKBOOK_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => setSelectedEmoji(emoji)}
                    style={[
                      styles.emojiButton,
                      selectedEmoji === emoji && styles.emojiButtonSelected
                    ]}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Color Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Choose a Color</Text>
              <View style={styles.colorGrid}>
                {COOKBOOK_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonSelected
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={[styles.section, { marginBottom: spacing.xl * 2 }]}>
              <Text style={styles.label}>Preview</Text>
              <View 
                style={[
                  styles.previewContainer,
                  { backgroundColor: selectedColor + '20' }
                ]}
              >
                <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
                <View style={styles.previewContent}>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {name || 'Cookbook Name'}
                  </Text>
                  {description ? (
                    <Text style={styles.previewDescription} numberOfLines={2}>
                      {description}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    zIndex: 1001,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  keyboardAvoid: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[800],
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  saveButton: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary[500],
  },
  saveButtonTextDisabled: {
    color: colors.neutral[400],
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  emojiContainer: {
    marginTop: spacing.sm,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  emojiButtonSelected: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  emojiText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: colors.neutral[800],
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  previewEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  previewDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    marginTop: 2,
  },
});
