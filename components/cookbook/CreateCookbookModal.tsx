// components/cookbook/CreateCookbookModal.tsx (React Native version)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { COOKBOOK_COLORS, COOKBOOK_EMOJIS } from '../../types/cookbook';
import { colors, spacing, typography } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreateCookbookModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCookbookModal({ visible, onClose, onSuccess }: CreateCookbookModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('#F97316');
  const [loading, setLoading] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setSelectedEmoji('📚');
    setSelectedColor('#F97316');
  }, []);

  const handleSubmit = async () => {
    console.log('=== CREATE COOKBOOK DEBUG ===');
    console.log('1. Button clicked!');
    console.log('2. Name:', name);
    console.log('3. Name trimmed:', name.trim());
    console.log('4. Loading state:', loading);
    
    // Trim and validate name
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      console.log('5. Name is empty - showing alert');
      Alert.alert('Required Field', 'Please enter a cookbook name');
      return;
    }

    console.log('6. Starting cookbook creation...');

    // Check name length
    if (trimmedName.length > 50) {
      Alert.alert('Name Too Long', 'Cookbook name must be 50 characters or less');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      console.log('7. Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('8. User:', user?.id);
      
      if (!user) {
        console.log('9. No user found - showing alert');
        Alert.alert('Authentication Required', 'Please log in to create cookbooks');
        onClose();
        return;
      }

      // Check if cookbook name already exists for this user
      console.log('10. Checking for duplicate cookbook names...');
      const { data: existingCookbooks, error: checkError } = await supabase
        .from('cookbooks')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', trimmedName)
        .limit(1);

      if (checkError) {
        console.error('11. Error checking duplicates:', checkError);
        throw checkError;
      }

      console.log('12. Existing cookbooks with same name:', existingCookbooks);

      if (existingCookbooks && existingCookbooks.length > 0) {
        console.log('13. Duplicate name found - showing alert');
        Alert.alert('Duplicate Name', 'You already have a cookbook with this name');
        setLoading(false);
        return;
      }

      // Create cookbook
      console.log('14. Creating cookbook with data:', {
        user_id: user.id,
        name: trimmedName,
        description: description.trim() || null,
        emoji: selectedEmoji,
        color: selectedColor,
        is_default: false,
        recipe_count: 0
      });

      const { error } = await supabase
        .from('cookbooks')
        .insert({
          user_id: user.id,
          name: trimmedName,
          description: description.trim() || null,
          emoji: selectedEmoji,
          color: selectedColor,
          is_default: false,
          recipe_count: 0 // Initialize with 0 recipes
        });

      if (error) {
        console.error('15. Error creating cookbook:', error);
        throw error;
      }

      console.log('16. Cookbook created successfully!');

      Alert.alert(
        'Success!', 
        'Cookbook created successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('17. Success alert OK pressed');
              resetForm();
              onSuccess();
              onClose();
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('18. Error in handleSubmit:', err);
      
      let errorMessage = 'Failed to create cookbook. Please try again.';
      if (err.message?.includes('duplicate')) {
        errorMessage = 'A cookbook with this name already exists.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      console.log('19. Setting loading to false');
      setLoading(false);
    }
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
            onPress: () => {
              resetForm();
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>Create New Cookbook</Text>
          <TouchableOpacity 
            onPress={() => {
              console.log('Create button pressed - calling handleSubmit');
              handleSubmit();
            }} 
            disabled={loading || !name.trim()}
            style={styles.saveButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          keyboardShouldPersistTaps="handled"
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
              returnKeyType="next"
            />
            <Text style={styles.charCount}>
              {name.length}/50
            </Text>
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
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {description.length}/200
            </Text>
          </View>

          {/* Emoji Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Choose an Emoji</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.emojiContainer}
              contentContainerStyle={styles.emojiContent}
            >
              {COOKBOOK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setSelectedEmoji(emoji)}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.emojiButtonSelected
                  ]}
                  activeOpacity={0.7}
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
                  activeOpacity={0.7}
                />
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={[styles.section, styles.lastSection]}>
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
                <Text style={styles.previewRecipeCount}>0 recipes</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
    marginBottom: spacing.xl,
  },
  lastSection: {
    marginBottom: spacing.xl * 2,
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
    minHeight: 80,
    maxHeight: 120,
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
    marginHorizontal: -spacing.xs,
  },
  emojiContent: {
    paddingHorizontal: spacing.xs,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.xs / 2,
  },
  emojiButtonSelected: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  emojiText: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginHorizontal: -spacing.xs / 2,
  },
  colorButton: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 7) / 8,
    aspectRatio: 1,
    borderRadius: 24,
    margin: spacing.xs / 2,
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: colors.neutral[800],
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.sm,
  },
  previewEmoji: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  previewDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],.
    marginBottom: spacing.xs,
  },
  previewRecipeCount: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    fontWeight: '500',
  },
});
