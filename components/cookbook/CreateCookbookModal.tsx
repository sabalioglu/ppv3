// components/cookbook/CreateCookbookModal.tsx
import React, { useState } from 'react';
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
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { colors, spacing, typography } from '../../lib/theme';

interface CreateCookbookModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMOJI_OPTIONS = [
  '📚', '📖', '🍳', '👨‍🍳', '👩‍🍳', '🥘', '🍽️', '🍴',
  '🥗', '🍕', '🍔', '🍰', '🧁', '🍪', '🥐', '🍞',
  '🥖', '🥯', '🥞', '🧇', '🍳', '🥓', '🥚', '🧀',
  '🥩', '🍗', '🍖', '🌭', '🥪', '🌮', '🌯', '🥙',
  '🍱', '🍜', '🍲', '🥟', '🍤', '🍣', '🍱', '🍛',
  '🍚', '🍙', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧',
  '🍨', '🍦', '🥧', '🍰', '🎂', '🧁', '🍮', '🍭',
  '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯'
];

const COLOR_OPTIONS = [
  '#F97316', // Orange
  '#EF4444', // Red
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export function CreateCookbookModal({ 
  visible, 
  onClose, 
  onSuccess 
}: CreateCookbookModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('#F97316');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedEmoji('📚');
    setSelectedColor('#F97316');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a cookbook name');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to create cookbooks');
        return;
      }

      const { error } = await supabase
        .from('cookbooks')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          emoji: selectedEmoji,
          color: selectedColor,
        });

      if (error) throw error;

      Alert.alert('Success!', 'Cookbook created successfully!');
      resetForm();
      onSuccess();

    } catch (error) {
      console.error('Error creating cookbook:', error);
      Alert.alert('Error', 'Failed to create cookbook');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create New Cookbook</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Name Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter cookbook name..."
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.neutral[400]}
                maxLength={50}
              />
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description (optional)..."
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* Emoji Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Choose an Emoji</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.emojiScroll}
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      selectedEmoji === emoji && styles.emojiOptionSelected
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
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
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Check size={16} color={colors.neutral[0]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.section}>
              <Text style={styles.label}>Preview</Text>
              <View style={[styles.preview, { borderColor: selectedColor }]}>
                <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
                <View style={styles.previewText}>
                  <Text style={styles.previewName}>{name || 'Cookbook Name'}</Text>
                  {description && (
                    <Text style={styles.previewDescription}>{description}</Text>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: selectedColor },
                loading && styles.createButtonDisabled
              ]}
              onPress={handleCreate}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Text style={styles.createText}>Create Cookbook</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
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
    height: 80,
    textAlignVertical: 'top',
  },
  emojiScroll: {
    marginTop: spacing.sm,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  emojiText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.neutral[800],
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    marginTop: spacing.sm,
  },
  previewEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  previewDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  createButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  createText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[0],
  },
});