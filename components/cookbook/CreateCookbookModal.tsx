// components/cookbook/CreateCookbookModal.tsx (React Native version)
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
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { COOKBOOK_COLORS, COOKBOOK_EMOJIS } from '@/types/cookbook';
import { colors, spacing, typography } from '@/lib/theme';

interface CreateCookbookModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCookbookModal({ visible, onClose, onSuccess }: CreateCookbookModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('#F97316');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !name.trim()) {
      Alert.alert('Error', 'Please enter a cookbook name');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('cookbooks')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          emoji: selectedEmoji,
          color: selectedColor,
          is_default: false
        });

      if (error) throw error;

      Alert.alert('Success!', 'Cookbook created successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating cookbook:', err);
      Alert.alert('Error', 'Failed to create cookbook. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedEmoji('📚');
    setSelectedColor('#F97316');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Italian Favorites"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.neutral[400]}
            />
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
            />
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
                <Text style={styles.previewName}>
                  {name || 'Cookbook Name'}
                </Text>
                {description && (
                  <Text style={styles.previewDescription}>
                    {description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
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
    paddingTop: 60,
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
    textAlignVertical: 'top',
  },
  emojiContainer: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  emojiButton: {
    width: 56,
    height: 56,
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
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
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
  },
});
