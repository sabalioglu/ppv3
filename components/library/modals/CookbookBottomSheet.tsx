// components/library/modals/CookbookBottomSheet.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { 
  BottomSheetView, 
  BottomSheetScrollView,
  BottomSheetBackdrop 
} from '@gorhom/bottom-sheet';
import { X, Plus, Check } from 'lucide-react-native';
import { colors, spacing, typography } from '../../../lib/theme';
import { useCookbookManager } from '../../../hooks/useCookbookManager';

interface CookbookBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
}

export const CookbookBottomSheet: React.FC<CookbookBottomSheetProps> = ({
  visible,
  onClose,
  recipeId,
  recipeTitle,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '85%'], []);
  
  const { cookbooks, createCookbook, manageRecipeCookbooks } = useCookbookManager();
  const [selectedCookbooks, setSelectedCookbooks] = useState<string[]>([]);

  // Backdrop component - tap to close
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleCookbookToggle = (cookbookId: string) => {
    setSelectedCookbooks(prev => {
      if (prev.includes(cookbookId)) {
        return prev.filter(id => id !== cookbookId);
      }
      return [...prev, cookbookId];
    });
  };

  const handleSave = async () => {
    try {
      await manageRecipeCookbooks(recipeId, selectedCookbooks, 'replace');
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  // Show/hide bottom sheet based on visible prop
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      onClose={onClose}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.bottomSheetBackground}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add to Cookbook</Text>
            <Text style={styles.subtitle} numberOfLines={2}>{recipeTitle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <BottomSheetScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Create New Cookbook */}
          <TouchableOpacity 
  style={styles.createOption}
  onPress={() => {
    onClose();
    router.push('/library/create-cookbook');
  }}
>
  <View style={styles.createIconContainer}>
    <Plus size={24} color={colors.primary[500]} />
  </View>
  <View style={styles.optionContent}>
    <Text style={styles.optionTitle}>Create New Cookbook</Text>
    <Text style={styles.optionDescription}>Start a new collection</Text>
  </View>
</TouchableOpacity>

          {/* Existing Cookbooks */}
          {cookbooks.map((cookbook) => (
            <TouchableOpacity
              key={cookbook.id}
              style={[
                styles.cookbookOption,
                selectedCookbooks.includes(cookbook.id) && styles.selectedOption
              ]}
              onPress={() => handleCookbookToggle(cookbook.id)}
            >
              <View style={[styles.emojiContainer, { backgroundColor: `${cookbook.color}15` }]}>
                <Text style={styles.emoji}>{cookbook.emoji}</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{cookbook.name}</Text>
                <Text style={styles.optionDescription}>
                  {cookbook.recipe_count || 0} recipe{cookbook.recipe_count !== 1 ? 's' : ''}
                </Text>
              </View>
              {selectedCookbooks.includes(cookbook.id) && (
                <Check size={20} color={colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}
        </BottomSheetScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              Save ({selectedCookbooks.length})
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  handleIndicator: {
    backgroundColor: colors.neutral[300],
  },
  bottomSheetBackground: {
    backgroundColor: colors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  titleContainer: {
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
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  createIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cookbookOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  selectedOption: {
    backgroundColor: colors.primary[50],
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  emojiContainer: {
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
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  saveButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[0],
  },
});
