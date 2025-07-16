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
  Alert,
  Platform,
} from 'react-native';
import { X, Check, Plus, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, typography } from '../../lib/theme';
import { useCookbookManager } from '../../hooks/useCookbookManager';

interface AddToCookbookModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  onCreateNewCookbook?: () => void;
  onSuccess?: () => void;
}

export function AddToCookbookModal({ 
  visible, 
  onClose, 
  recipeId,
  recipeTitle,
  onCreateNewCookbook,
  onSuccess
}: AddToCookbookModalProps) {
  // Use the hook instead of local state
  const {
    cookbooks,
    loading: cookbooksLoading,
    error: cookbooksError,
    getRecipeCookbooks,
    replaceRecipeCookbooks
  } = useCookbookManager();

  const [selectedCookbooks, setSelectedCookbooks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Load initial data when modal opens
  useEffect(() => {
    if (visible && recipeId) {
      initializeModal();
    }
  }, [visible, recipeId]);

  const initializeModal = async () => {
    try {
      setInitializing(true);
      
      // Get current associations for this recipe
      const currentAssociations = await getRecipeCookbooks(recipeId);
      setSelectedCookbooks(currentAssociations);
    } catch (error) {
      console.error('❌ Error initializing modal:', error);
      Alert.alert('Error', 'Failed to load cookbook data');
    } finally {
      setInitializing(false);
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

      const result = await replaceRecipeCookbooks(recipeId, selectedCookbooks);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update cookbooks');
      }

      Alert.alert(
        'Success!', 
        `Recipe ${selectedCookbooks.length > 0 
          ? `added to ${selectedCookbooks.length} cookbook(s)` 
          : 'removed from all cookbooks'
        }`
      );

      onSuccess?.();
      onClose();

    } catch (error: any) {
      console.error('❌ Error saving cookbook associations:', error);
      Alert.alert('Error', error.message || 'Failed to update cookbooks');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    onClose();
    setTimeout(() => onCreateNewCookbook?.(), 300);
  };

  const handleClose = () => {
    setSelectedCookbooks([]);
    onClose();
  };

  // Error state
  if (cookbooksError) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.errorContainer}>
              <AlertTriangle size={48} color={colors.error[500]} />
              <Text style={styles.errorTitle}>Error Loading Cookbooks</Text>
              <Text style={styles.errorMessage}>{cookbooksError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={initializeModal}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Cookbook</Text>
            <TouchableOpacity onPress={handleClose} disabled={saving}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle} numberOfLines={2}>{recipeTitle}</Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNew}
            disabled={saving}
          >
            <Plus size={20} color={colors.primary[500]} />
            <Text style={styles.createButtonText}>Create New Cookbook</Text>
          </TouchableOpacity>

          {(cookbooksLoading || initializing) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Loading cookbooks...</Text>
            </View>
          ) : cookbooks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No cookbooks yet</Text>
              <Text style={styles.emptySubtext}>Create your first cookbook to organize recipes</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {cookbooks.map((cookbook) => (
                <TouchableOpacity
                  key={cookbook.id}
                  style={[
                    styles.item,
                    selectedCookbooks.includes(cookbook.id) && styles.itemSelected
                  ]}
                  onPress={() => toggleCookbook(cookbook.id)}
                  disabled={saving}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.emoji}>{cookbook.emoji}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.name} numberOfLines={1}>
                        {cookbook.name}
                      </Text>
                      <Text style={styles.count}>
                        {cookbook.recipe_count || 0} recipe{cookbook.recipe_count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    selectedCookbooks.includes(cookbook.id) && styles.checkboxSelected
                  ]}>
                    {selectedCookbooks.includes(cookbook.id) && (
                      <Check size={16} color={colors.neutral[0]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton, 
                saving && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={saving || cookbooksLoading || initializing}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Text style={styles.saveText}>
                  Save ({selectedCookbooks.length})
                </Text>
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
    maxHeight: '80%',
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
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    margin: spacing.lg,
    gap: spacing.sm,
  },
  createButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary[600],
  },
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.error[600],
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  retryText: {
    color: colors.neutral[0],
    fontWeight: '600',
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  // List styles
  list: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    marginBottom: spacing.sm,
  },
  itemSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemInfo: {
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  count: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
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
  // Action buttons
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
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  saveText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[0],
  },
});
