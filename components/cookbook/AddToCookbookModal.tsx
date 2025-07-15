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
import { X, Check, Plus } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Cookbook } from '../../types/cookbook';
import { colors, spacing, typography } from '../../lib/theme';

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCookbooks = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get cookbooks
      const { data: cookbooksData, error } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get recipe counts
      const cookbooksWithCounts = await Promise.all(
        (cookbooksData || []).map(async (cookbook) => {
          const { count } = await supabase
            .from('recipe_cookbooks')
            .select('*', { count: 'exact', head: true })
            .eq('cookbook_id', cookbook.id);
          
          return { ...cookbook, recipe_count: count || 0 };
        })
      );

      setCookbooks(cookbooksWithCounts);

      // Get current associations
      const { data: associations } = await supabase
        .from('recipe_cookbooks')
        .select('cookbook_id')
        .eq('recipe_id', recipeId);

      setSelectedCookbooks(associations?.map(a => a.cookbook_id) || []);

    } catch (error) {
      console.error('Error loading cookbooks:', error);
      Alert.alert('Error', 'Failed to load cookbooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCookbooks();
    }
  }, [visible]);

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

      // Remove all existing associations
      await supabase
        .from('recipe_cookbooks')
        .delete()
        .eq('recipe_id', recipeId);

      // Add new associations
      if (selectedCookbooks.length > 0) {
        const associations = selectedCookbooks.map(cookbookId => ({
          recipe_id: recipeId,
          cookbook_id: cookbookId,
        }));

        const { error } = await supabase
          .from('recipe_cookbooks')
          .insert(associations);

        if (error) throw error;
      }

      Alert.alert('Success!', 'Recipe updated successfully!');
      onClose();

    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to update cookbooks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Cookbook</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{recipeTitle}</Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              onClose();
              setTimeout(() => onCreateNewCookbook?.(), 300);
            }}
          >
            <Plus size={20} color={colors.primary[500]} />
            <Text style={styles.createButtonText}>Create New Cookbook</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
          ) : (
            <ScrollView style={styles.list}>
              {cookbooks.map((cookbook) => (
                <TouchableOpacity
                  key={cookbook.id}
                  style={[
                    styles.item,
                    selectedCookbooks.includes(cookbook.id) && styles.itemSelected
                  ]}
                  onPress={() => toggleCookbook(cookbook.id)}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.emoji}>{cookbook.emoji}</Text>
                    <View>
                      <Text style={styles.name}>{cookbook.name}</Text>
                      <Text style={styles.count}>
                        {cookbook.recipe_count || 0} recipes
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
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
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
