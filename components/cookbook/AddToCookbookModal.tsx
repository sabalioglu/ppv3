// components/cookbook/AddToCookbookModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { X, Check, Plus, Book } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Cookbook } from '../../types/cookbook';
import { colors, spacing, typography } from '../../lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddToCookbookModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  onCreateNewCookbook?: () => void;
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

  // Load cookbooks and recipe associations
  const loadCookbooksAndRecipeAssociations = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading cookbooks for recipe:', recipeId);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        Alert.alert('Authentication Required', 'Please log in to manage cookbooks');
        onClose();
        return;
      }

      console.log('User ID:', user.id);

      // Load cookbooks
      const { data: cookbooksData, error: cookbooksError } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cookbooksError) {
        console.error('Error loading cookbooks:', cookbooksError);
        throw cookbooksError;
      }

      console.log('Loaded cookbooks:', cookbooksData);

      // Get recipe counts for each cookbook
      const cookbooksWithCounts = await Promise.all(
        (cookbooksData || []).map(async (cookbook) => {
          try {
            const { count, error: countError } = await supabase
              .from('recipe_cookbooks')
              .select('*', { count: 'exact', head: true })
              .eq('cookbook_id', cookbook.id);
            
            if (countError) {
              console.warn('Error getting count for cookbook:', cookbook.id, countError);
            }
            
            return {
              ...cookbook,
              recipe_count: count || 0
            };
          } catch (error) {
            console.warn('Error processing cookbook:', cookbook.id, error);
            return {
              ...cookbook,
              recipe_count: 0
            };
          }
        })
      );

      console.log('Cookbooks with counts:', cookbooksWithCounts);
      setCookbooks(cookbooksWithCounts);

      // Load existing associations for this recipe
      const { data: associations, error: assocError } = await supabase
        .from('recipe_cookbooks')
        .select('cookbook_id')
        .eq('recipe_id', recipeId);

      if (assocError) {
        console.error('Error loading associations:', assocError);
        console.warn('Continuing with empty associations');
      }

      console.log('Recipe associations:', associations);

      const associatedCookbookIds = associations?.map(a => a.cookbook_id) || [];
      setSelectedCookbooks(associatedCookbookIds);
      setInitialCookbooks(associatedCookbookIds);

    } catch (error) {
      console.error('Error in loadCookbooksAndRecipeAssociations:', error);
      Alert.alert('Error', 'Failed to load cookbooks. Please try again.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [recipeId, onClose]);

  useEffect(() => {
    if (visible && recipeId) {
      const timer = setTimeout(() => {
        loadCookbooksAndRecipeAssociations();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    // Reset state when modal closes
    if (!visible) {
      setSelectedCookbooks([]);
      setInitialCookbooks([]);
      setCookbooks([]);
      setLoading(true);
    }
  }, [visible, recipeId, loadCookbooksAndRecipeAssociations]);

  const toggleCookbook = useCallback((cookbookId: string) => {
    console.log('Toggling cookbook:', cookbookId);
    setSelectedCookbooks(prev => {
      if (prev.includes(cookbookId)) {
        return prev.filter(id => id !== cookbookId);
      }
      return [...prev, cookbookId];
    });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('Saving cookbook associations...');
      console.log('Selected:', selectedCookbooks);
      console.log('Initial:', initialCookbooks);

      // Check if any changes were made
      const hasChanges = 
        selectedCookbooks.length !== initialCookbooks.length ||
        selectedCookbooks.some(id => !initialCookbooks.includes(id)) ||
        initialCookbooks.some(id => !selectedCookbooks.includes(id));

      if (!hasChanges) {
        console.log('No changes detected');
        onClose();
        return;
      }

      // Determine which to add and remove
      const toAdd = selectedCookbooks.filter(id => !initialCookbooks.includes(id));
      const toRemove = initialCookbooks.filter(id => !selectedCookbooks.includes(id));

      console.log('To add:', toAdd);
      console.log('To remove:', toRemove);

      // Batch operations
      const operations = [];

      if (toRemove.length > 0) {
        operations.push(
          supabase
            .from('recipe_cookbooks')
            .delete()
            .eq('recipe_id', recipeId)
            .in('cookbook_id', toRemove)
        );
      }

      if (toAdd.length > 0) {
        const newAssociations = toAdd.map(cookbookId => ({
          recipe_id: recipeId,
          cookbook_id: cookbookId,
        }));

        operations.push(
          supabase
            .from('recipe_cookbooks')
            .insert(newAssociations)
        );
      }

      const results = await Promise.all(operations);
      const hasError = results.some(result => result.error);

      if (hasError) {
        const errors = results.filter(result => result.error);
        console.error('Batch operation errors:', errors);
        throw new Error('Failed to update some cookbooks');
      }

      console.log('Success: Cookbook associations updated');
      Alert.alert('Success!', 'Recipe updated successfully!', [
        { text: 'OK', onPress: onClose }
      ]);

    } catch (error) {
      console.error('Error saving cookbook associations:', error);
      Alert.alert('Error', 'Failed to update cookbooks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewCookbook = () => {
    onClose();
    setTimeout(() => {
      if (onCreateNewCookbook) {
        onCreateNewCookbook();
      }
    }, 300);
  };

  // Loading state
  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Loading cookbooks...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>Add to Cookbook</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {recipeTitle}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
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
              contentContainerStyle={styles.cookbooksListContent}
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
                      activeOpacity={0.7}
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
                              {cookbook.recipe_count || 0} {cookbook.recipe_count === 1 ? 'recipe' : 'recipes'}
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
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    margin: 20,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.md,
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
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    margin: spacing.lg,
    marginBottom: spacing.md,
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
  cookbooksListContent: {
    paddingBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
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
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.neutral[50],
    marginBottom: spacing.sm,
  },
  cookbookItemSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  cookbookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cookbookEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  cookbookText: {
    flex: 1,
  },
  cookbookName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs / 2,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  cancelButtonText: {
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
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[0],
  },
});
