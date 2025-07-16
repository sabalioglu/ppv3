// components/library/modals/CookbookSelectionModal.tsx
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
  TextInput,
} from 'react-native';
import { X, Plus, Check } from 'lucide-react-native';
import { colors, spacing, typography } from '../../../lib/theme';
import { useCookbookManager } from '../../../hooks/useCookbookManager';

interface CookbookSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
}

export function CookbookSelectionModal({ 
  visible, 
  onClose, 
  recipeId,
  recipeTitle
}: CookbookSelectionModalProps) {
  const {
    cookbooks,
    loading: cookbooksLoading,
    manageRecipeCookbooks,
    getRecipeCookbooks,
    createCookbook,
    loadCookbooks
  } = useCookbookManager();

  const [selectedCookbooks, setSelectedCookbooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCookbookName, setNewCookbookName] = useState('');

  // Load cookbooks when modal opens
  useEffect(() => {
    if (visible) {
      console.log('🔄 Modal opened, loading cookbooks...');
      loadCookbooks();
    }
  }, [visible, loadCookbooks]);

  // Debug cookbooks
  useEffect(() => {
    console.log('📚 Modal - Cookbooks updated:', cookbooks.length);
    console.log('📚 Modal - Cookbooks data:', cookbooks.map(c => ({ id: c.id, name: c.name })));
  }, [cookbooks]);

  // Load current associations when modal opens
  useEffect(() => {
    if (visible && recipeId) {
      loadCurrentAssociations();
    }
  }, [visible, recipeId]);

  const loadCurrentAssociations = async () => {
    try {
      const associations = await getRecipeCookbooks(recipeId);
      setSelectedCookbooks(associations);
    } catch (error) {
      console.error('Error loading associations:', error);
    }
  };

  const handleCookbookToggle = (cookbookId: string) => {
    setSelectedCookbooks(prev => {
      if (prev.includes(cookbookId)) {
        return prev.filter(id => id !== cookbookId);
      }
      return [...prev, cookbookId];
    });
  };

  const handleCreateNewCookbook = async () => {
    if (!newCookbookName.trim()) {
      Alert.alert('Error', 'Please enter a cookbook name');
      return;
    }

    try {
      setLoading(true);
      const newCookbook = await createCookbook({
        name: newCookbookName.trim(),
        emoji: '📚',
        color: '#F97316'
      });

      if (newCookbook) {
        // Add to selection
        setSelectedCookbooks(prev => [...prev, newCookbook.id]);
        setShowCreateForm(false);
        setNewCookbookName('');
        Alert.alert('Success!', 'Cookbook created successfully!');
      }
    } catch (error) {
      console.error('Error creating cookbook:', error);
      Alert.alert('Error', 'Failed to create cookbook');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // ✅ Doğru method'u kullan
      await manageRecipeCookbooks(recipeId, selectedCookbooks, 'replace');
      
      Alert.alert(
        'Success!',
        selectedCookbooks.length > 0 
          ? `Recipe added to ${selectedCookbooks.length} cookbook(s)`
          : 'Recipe removed from all cookbooks'
      );
      
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to update cookbooks');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCookbooks([]);
    setShowCreateForm(false);
    setNewCookbookName('');
    onClose();
  };

  if (showCreateForm) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Create New Cookbook</Text>
              <TouchableOpacity onPress={() => setShowCreateForm(false)}>
                <X size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.createForm}>
              <Text style={styles.label}>Cookbook Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter cookbook name..."
                value={newCookbookName}
                onChangeText={setNewCookbookName}
                placeholderTextColor={colors.neutral[400]}
                autoFocus
              />
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleCreateNewCookbook}
                disabled={loading || !newCookbookName.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.neutral[0]} />
                ) : (
                  <Text style={styles.createText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Cookbook</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle} numberOfLines={2}>{recipeTitle}</Text>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Debug Info */}
            <Text style={{ padding: 10, fontSize: 12, color: 'red' }}>
              Debug: {cookbooks.length} cookbooks, loading: {cookbooksLoading ? 'true' : 'false'}
            </Text>
            
            {/* Create New Cookbook Option */}
            <TouchableOpacity 
              style={styles.option}
              onPress={() => setShowCreateForm(true)}
              disabled={loading}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary[50] }]}>
                <Plus size={24} color={colors.primary[500]} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Create New Cookbook</Text>
                <Text style={styles.optionDescription}>Start a new collection</Text>
              </View>
            </TouchableOpacity>
            
            {/* Existing Cookbooks */}
            {cookbooksLoading ? (
              <Text style={{ padding: 20, textAlign: 'center' }}>Loading cookbooks...</Text>
            ) : cookbooks.length === 0 ? (
              <Text style={{ padding: 20, textAlign: 'center' }}>No cookbooks found</Text>
            ) : (
              cookbooks.map((cookbook) => (
                <TouchableOpacity
                  key={cookbook.id}
                  style={[
                    styles.option,
                    selectedCookbooks.includes(cookbook.id) && styles.optionSelected
                  ]}
                  onPress={() => handleCookbookToggle(cookbook.id)}
                  disabled={loading}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${cookbook.color}15` }]}>
                    <Text style={styles.emoji}>{cookbook.emoji}</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{cookbook.name}</Text>
                    <Text style={styles.optionDescription}>
                      {cookbook.recipe_count || 0} recipe{(cookbook.recipe_count || 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {selectedCookbooks.includes(cookbook.id) && (
                    <View style={styles.checkIcon}>
                      <Check size={20} color={colors.primary[500]} />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
    paddingBottom: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  optionSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },
  createForm: {
    padding: spacing.lg,
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
  createButton: {
    flex: 2,
    backgroundColor: colors.primary[500],
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