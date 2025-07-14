// components/cookbook/AddToCookbookModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,,
} from 'react-native';
import { X, Check, Plus, Book } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Cookbook } from '../../types/cookbook';
import { colors, spacing, typography } from '../../lib/theme';

interface AddToCookbookModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  onCreateNewCookbook?: () => void; // New prop
}

export function AddToCookbookModal({ 
  visible, 
  onClose, 
  recipeId,
  recipeTitle,
  onCreateNewCookbook 
}: AddToCookbookModalProps) {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [selectedCookbooks, setSelectedCookbooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialCookbooks, setInitialCookbooks] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadCookbooksAndRecipeAssociations();
    }
  }, [visible, recipeId]);

  const loadCookbooksAndRecipeAssociations = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's cookbooks with recipe count
      const { data: cookbooksData, error: cookbooksError } = await supabase
        .from('cookbooks')
        .select(`
          *,
          recipe_cookbooks(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cookbooksError) throw cookbooksError;

      // Process cookbook data to include recipe count
      const processedCookbooks = cookbooksData?.map(cookbook => ({
        ...cookbook,
        recipe_count: cookbook.recipe_cookbooks?.[0]?.count || 0
      })) || [];

      setCookbooks(processedCookbooks);

      // Load existing associations for this recipe
      const { data: associations, error: assocError } = await supabase
        .from('recipe_cookbooks')
        .select('cookbook_id')
        .eq('recipe_id', recipeId);

      if (assocError) throw assocError;

      const associatedCookbookIds = associations?.map(a => a.cookbook_id) || [];
      setSelectedCookbooks(associatedCookbookIds);
      setInitialCookbooks(associatedCookbookIds); // Store initial state

    } catch (error) {
      console.error('Error loading cookbooks:', error);
      Alert.alert('Error', 'Failed to load cookbooks');
    } finally {
      setLoading(false);
    }
  };

  const toggleCookbook = (cookbookId: string) => {
    setSelectedCookbooks(prev => {
      if (prev.includes(cookbookId)) {
        return prev.filter(id => id !== cookbookId);
      }
      return [...prev, cookbookId];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Check if any changes were made
      const hasChanges = 
        selectedCookbooks.length !== initialCookbooks.length ||
        selectedCookbooks.some(id => !initialCookbooks.includes(id)) ||
        initialCookbooks.some(id => !selectedCookbooks.includes(id));

      if (!hasChanges) {
        onClose();
        return;
      }

      // Get current associations
      const { data: currentAssociations, error: fetchError } = await supabase
        .from('recipe_cookbooks')
        .select('cookbook_id')
        .eq('recipe_id', recipeId);

      if (fetchError) throw fetchError;

      const currentCookbookIds = currentAssociations?.map(a => a.cookbook_id) || [];

      // Determine which to add and remove
      const toAdd = selectedCookbooks.filter(id => !currentCookbookIds.includes(id));
      const toRemove = currentCookbookIds.filter(id => !selectedCookbooks.includes(id));

      // Remove associations
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('recipe_cookbooks')
          .delete()
          .eq('recipe_id', recipeId)
          .in('cookbook_id', toRemove);

        if (removeError) throw removeError;
      }

      // Add new associations
      if (toAdd.length > 0) {
        const newAssociations = toAdd.map(cookbookId => ({
          recipe_id: recipeId,
          cookbook_id: cookbookId,
        }));

        const { error: addError } = await supabase
          .from('recipe_cookbooks')
          .insert(newAssociations);

        if (addError) throw addError;
      }

      // Show success message with details
      const addedCount = toAdd.length;
      const removedCount = toRemove.length;
      let message = 'Recipe updated successfully!';
      
      if (addedCount > 0 && removedCount === 0) {
        message = `Added to ${addedCount} cookbook${addedCount > 1 ? 's' : ''}`;
      } else if (removedCount > 0 && addedCount === 0) {
        message = `Removed from ${removedCount} cookbook${removedCount > 1 ? 's' : ''}`;
      } else if (addedCount > 0 && removedCount > 0) {
        message = `Added to ${addedCount} and removed from ${removedCount} cookbook${addedCount + removedCount > 1 ? 's' : ''}`;
      }

      Alert.alert('Success!', message);
      onClose();

    } catch (error) {
      console.error('Error saving cookbook associations:', error);
      Alert.alert('Error', 'Failed to update cookbooks');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewCookbook = () => {
    onClose();
    if (onCreateNewCookbook) {
      onCreateNewCookbook();
    }
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Add to Cookbook</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {recipeTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {/* Create New Cookbook Button */}
          <TouchableOpacity
            style={styles.createNewButton}
            onPress={handleCreateNewCookbook}
          >
            <View style={styles.createNewIcon}>
              <Plus size={20} color={colors.primary[500]} />
            </View>
            <Text style={styles.createNewText}>Create New Cookbook</Text>
          </TouchableOpacity>

          {/* Cookbooks List */}
          <ScrollView 
            style={styles.cookbooksList}
            showsVerticalScrollIndicator={false}
          >
            {cookbooks.length === 0 ? (
              <View style={styles.emptyState}>
                <Book size={48} color={colors.neutral[300]} />
                <Text style={styles.emptyStateText}>
                  No cookbooks yet. Create your first cookbook!
                </Text>
              </View>
            ) : (
              cookbooks.map((cookbook) => {
                const isSelected = selectedCookbooks.includes(cookbook.id);
                return (
                  <TouchableOpacity
                    key={cookbook.id}
                    style={[
                      styles.cookbookItem,
                      isSelected && styles.cookbookItemSelected
                    ]}
                    onPress={() => toggleCookbook(cookbook.id)}
                  >
                    <View style={styles.cookbookInfo}>
                      <Text style={styles.cookbookEmoji}>{cookbook.emoji || '📚'}</Text>
                      <View style={styles.cookbookText}>
                        <Text style={styles.cookbookName}>{cookbook.name}</Text>
                        <View style={styles.cookbookMeta}>
                          {cookbook.description && (
                            <Text style={styles.cookbookDescription} numberOfLines={1}>
                              {cookbook.description}
                            </Text>
                          )}
                          <Text style={styles.recipeCount}>
                            {cookbook.recipe_count || 0} recipes
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && (
                        <Check size={16} color={colors.neutral[0]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingBottom: 34, // Safe area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  createNewIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
    paddingVertical: spacing.xl * 3,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.md,
  },
  cookbookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
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
  cookbookInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cookbookEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  cookbookText: {
    flex: 1,
  },
  cookbookName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  cookbookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cookbookDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    flex: 1,
  },
  recipeCount: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  actions: {
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
