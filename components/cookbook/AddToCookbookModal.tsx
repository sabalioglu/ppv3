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

  // Memoized load function
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

      // Load user's cookbooks - Simplified query
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

      // Get recipe counts separately for better compatibility
      const cookbooksWithCounts = await Promise.all(
        (cookbooksData || []).map(async (cookbook) => {
          const { count } = await supabase
            .from('recipe_cookbooks')
            .select('*', { count: 'exact', head: true })
            .eq('cookbook_id', cookbook.id);
          
          return {
            ...cookbook,
            recipe_count: count || 0
          };
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
        throw assocError;
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
      loadCookbooksAndRecipeAssociations();
    }
    
    // Reset state when modal closes
    if (!visible) {
      setSelectedCookbooks([]);
      setInitialCookbooks([]);
      setCookbooks([]);
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

      // Remove associations
      if (toRemove.length > 0) {
        for (const cookbookId of toRemove) {
          const { error } = await supabase
            .from('recipe_cookbooks')
            .delete()
            .eq('recipe_id', recipeId)
            .eq('cookbook_id', cookbookId);
          
          if (error) {
            console.error('Error removing association:', error);
            throw error;
          }
        }
      }

      // Add new associations
      if (toAdd.length > 0) {
        for (const cookbookId of toAdd) {
          const { error } = await supabase
            .from('recipe_cookbooks')
            .insert({
              recipe_id: recipeId,
              cookbook_id: cookbookId,
            });
          
          if (error) {
            // Handle duplicate key error
            if (error.code === '23505') {
              console.log('Association already exists, skipping');
              continue;
            }
            console.error('Error adding association:', error);
            throw error;
          }
        }
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
        message = `Updated ${addedCount + removedCount} cookbook${addedCount + removedCount > 1 ? 's' : ''}`;
      }

      console.log('Success:', message);
      Alert.alert('Success!', message, [
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
    // Small delay to ensure smooth transition
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
