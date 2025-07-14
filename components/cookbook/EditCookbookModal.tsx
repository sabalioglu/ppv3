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
import { X, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { COOKBOOK_COLORS, COOKBOOK_EMOJIS } from '../../types/cookbook';
import { colors, spacing, typography } from '../../lib/theme';
import type { Cookbook } from '../../types/cookbook';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EditCookbookModalProps {
  visible: boolean;
  cookbook: Cookbook | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
}

export function EditCookbookModal({ 
  visible, 
  cookbook, 
  onClose, 
  onSuccess, 
  onDelete 
}: EditCookbookModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('#F97316');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load cookbook data when modal opens
  useEffect(() => {
    if (visible && cookbook) {
      setName(cookbook.name);
      setDescription(cookbook.description || '');
      setSelectedEmoji(cookbook.emoji);
      setSelectedColor(cookbook.color);
    }
  }, [visible, cookbook]);

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
    if (!cookbook) return;

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
        Alert.alert('Authentication Required', 'Please log in to edit cookbooks');
        onClose();
        return;
      }

      // Check if name already exists (excluding current cookbook)
      const { data: existingCookbooks, error: checkError } = await supabase
        .from('cookbooks')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', trimmedName)
        .neq('id', cookbook.id)
        .limit(1);

      if (checkError) throw checkError;

      if (existingCookbooks && existingCookbooks.length > 0) {
        Alert.alert('Duplicate Name', 'You already have a cookbook with this name');
        setLoading(false);
        return;
      }

      // Update cookbook
      const { error } = await supabase
        .from('cookbooks')
        .update({
          name: trimmedName,
          description: description.trim() || null,
          emoji: selectedEmoji,
          color: selectedColor,
          updated_at: new Date().toISOString()
        })
        .eq('id', cookbook.id)
        .eq('user_id', user.id); // Extra safety check

      if (error) throw error;

      resetForm();
      await onSuccess();
      onClose();
      
      Alert.alert('Success!', 'Cookbook updated successfully');
      
    } catch (err: any) {
      console.error('Error updating cookbook:', err);
      
      let errorMessage = 'Failed to update cookbook. Please try again.';
      if (err.message?.includes('duplicate')) {
        errorMessage = 'A cookbook with this name already exists.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!cookbook) return;

    // Don't allow deletion of default cookbook
    if (cookbook.is_default) {
      Alert.alert('Cannot Delete', 'The default cookbook cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Cookbook',
      `Are you sure you want to delete "${cookbook.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              
              if (!user) {
                Alert.alert('Authentication Required', 'Please log in to delete cookbooks');
                return;
              }

              // Check if cookbook has recipes
              const { data: recipes, error: recipeError } = await supabase
                .from('cookbook_recipes')
                .select('id')
                .eq('cookbook_id', cookbook.id)
                .limit(1);

              if (recipeError) throw recipeError;

              if (recipes && recipes.length > 0) {
                Alert.alert(
                  'Cookbook Not Empty',
                  'Please remove all recipes from this cookbook before deleting it.',
                  [{ text: 'OK' }]
                );
                return;
              }

              // Delete cookbook
              const { error } = await supabase
                .from('cookbooks')
                .delete()
                .eq('id', cookbook.id)
                .eq('user_id', user.id); // Extra safety check

              if (error) throw error;

              await onDelete();
              onClose();
              
            } catch (err) {
              console.error('Error deleting cookbook:', err);
              Alert.alert('Error', 'Failed to delete cookbook. Please try again.');
            } finally {
              setDeleteLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClose = () => {
    const hasChanges = cookbook && (
      name.trim() !== cookbook.name ||
      (description.trim() || null) !== (cookbook.description || null) ||
      selectedEmoji !== cookbook.emoji ||
      selectedColor !== cookbook.color
    );

    if (hasChanges) {
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

  if (!cookbook) return null;

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
          <Text style={styles.title}>Edit Cookbook</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
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
                Save
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
              placeholder="A collection of my favorite recipes"
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
          <View style={styles.section}>
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
                <Text style={styles.previewRecipeCount}>{cookbook.recipe_count} recipes</Text>
              </View>
            </View>
          </View>

          {/* Delete Button */}
          {!cookbook.is_default && (
            <View style={[styles.section, styles.lastSection]}>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleteLoading}
                style={styles.deleteButton}
              >
                {deleteLoading ? (
                  <ActivityIndicator size="small" color={colors.error[500]} />
                ) : (
                  <>
                    <Trash2 size={20} color={colors.error[500]} />
                    <Text style={styles.deleteButtonText}>Delete Cookbook</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  previewRecipeCount: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[50],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  deleteButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.error[500],
  },
});