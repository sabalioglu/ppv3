// components/cookbook/BulkAddToCookbookModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, Check, Plus } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cookbook } from '../../types/cookbook';
import { colors, spacing, typography } from '../../lib/theme';

interface BulkAddToCookbookModalProps {
  visible: boolean;
  onClose: () => void;
  recipeIds: string[];
  recipeCount: number;
  cookbooks: Cookbook[]; // Parent'tan gelen cookbooks
  onCreateNewCookbook?: () => void;
}

export function BulkAddToCookbookModal({
  visible,
  onClose,
  recipeIds,
  recipeCount,
  cookbooks,
  onCreateNewCookbook
}: BulkAddToCookbookModalProps) {
  const [selectedCookbook, setSelectedCookbook] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset selection when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedCookbook(null);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!selectedCookbook) {
      Alert.alert('Select Cookbook', 'Please select a cookbook');
      return;
    }

    try {
      setSaving(true);
      console.log('Bulk adding recipes to cookbook:', selectedCookbook);
      console.log('Recipe IDs:', recipeIds);

      // Check for existing associations first
      const { data: existingAssociations } = await supabase
        .from('recipe_cookbooks')
        .select('recipe_id')
        .eq('cookbook_id', selectedCookbook)
        .in('recipe_id', recipeIds);

      // Filter out recipes that are already in the cookbook
      const existingRecipeIds = existingAssociations?.map(a => a.recipe_id) || [];
      const newRecipeIds = recipeIds.filter(id => !existingRecipeIds.includes(id));

      console.log('Existing recipes in cookbook:', existingRecipeIds);
      console.log('New recipes to add:', newRecipeIds);

      if (newRecipeIds.length === 0) {
        Alert.alert('Already Added', 'All selected recipes are already in this cookbook');
        setSaving(false);
        return;
      }

      // Add only new recipes to the selected cookbook
      const associations = newRecipeIds.map(recipeId => ({
        recipe_id: recipeId,
        cookbook_id: selectedCookbook,
      }));

      const { error } = await supabase
        .from('recipe_cookbooks')
        .insert(associations);

      if (error) {
        console.error('Error inserting associations:', error);
        throw error;
      }

      // Save last used cookbook
      await AsyncStorage.setItem('lastUsedCookbook', selectedCookbook);

      const addedCount = newRecipeIds.length;
      const skippedCount = recipeIds.length - newRecipeIds.length;

      let message = `Added ${addedCount} recipe${addedCount > 1 ? 's' : ''} to cookbook`;
      if (skippedCount > 0) {
        message += `\n(${skippedCount} already in cookbook)`;
      }

      console.log('Success:', message);
      Alert.alert('Success!', message, [{ text: 'OK', onPress: onClose }]);
    } catch (error) {
      console.error('Error adding recipes to cookbook:', error);
      Alert.alert('Error', 'Failed to add recipes to cookbook');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Add {recipeCount} Recipe{recipeCount > 1 ? 's' : ''} to Cookbook
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.createNewButton}
            onPress={() => {
              onClose();
              if (onCreateNewCookbook) onCreateNewCookbook();
            }}
          >
            <Plus size={20} color={colors.primary[500]} />
            <Text style={styles.createNewText}>Create New Cookbook</Text>
          </TouchableOpacity>

          <ScrollView style={styles.cookbooksList} showsVerticalScrollIndicator={false}>
            {cookbooks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No cookbooks found. Create your first cookbook!
                </Text>
              </View>
            ) : (
              cookbooks.map((cookbook) => (
                <TouchableOpacity
                  key={cookbook.id}
                  style={[
                    styles.cookbookItem,
                    selectedCookbook === cookbook.id && styles.cookbookItemSelected
                  ]}
                  onPress={() => setSelectedCookbook(cookbook.id)}
                >
                  <Text style={styles.cookbookEmoji}>{cookbook.emoji}</Text>
                  <View style={styles.cookbookInfo}>
                    <Text style={styles.cookbookName}>{cookbook.name}</Text>
                    <Text style={styles.cookbookDescription}>
                      {cookbook.recipe_count || 0} recipes
                    </Text>
                  </View>
                  {selectedCookbook === cookbook.id && (
                    <Check size={20} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton, 
                (saving || !selectedCookbook) && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={saving || !selectedCookbook}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Text style={styles.saveButtonText}>Add to Cookbook</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[800],
    flex: 1,
    marginRight: spacing.md,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    margin: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: spacing.sm,
  },
  createNewText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary[600],
  },
  cookbooksList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  cookbookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cookbookItemSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  cookbookEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  cookbookInfo: {
    flex: 1,
  },
  cookbookName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  cookbookDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  saveButton: {
    flex: 2,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[0],
  },
});
