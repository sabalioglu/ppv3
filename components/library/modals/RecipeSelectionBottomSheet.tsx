// components/library/modals/RecipeSelectionBottomSheet.tsx
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { X, Check, Search, ChefHat } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, colors as palette, type Colors } from '@/lib/theme/index';
import { supabase } from '../../../lib/supabase';

interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: string;
}

interface RecipeSelectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  cookbookId: string;
  cookbookName: string;
  onRecipesAdded: () => void;
}

export const RecipeSelectionBottomSheet: React.FC<
  RecipeSelectionBottomSheetProps
> = ({ visible, onClose, cookbookId, cookbookName, onRecipesAdded }) => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user's recipes
  const loadRecipes = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get recipes that are NOT already in this cookbook
      const { data: existingRecipes } = await supabase
        .from('recipe_cookbooks')
        .select('recipe_id')
        .eq('cookbook_id', cookbookId);

      const existingRecipeIds = existingRecipes?.map((r) => r.recipe_id) || [];

      const { data: allRecipes, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out recipes already in cookbook
      const availableRecipes =
        allRecipes?.filter(
          (recipe) => !existingRecipeIds.includes(recipe.id),
        ) || [];

      setRecipes(availableRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadRecipes();
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
      setSelectedRecipes([]);
      setSearchQuery('');
    }
  }, [visible, cookbookId]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const handleRecipeToggle = (recipeId: string) => {
    setSelectedRecipes((prev) => {
      if (prev.includes(recipeId)) {
        return prev.filter((id) => id !== recipeId);
      }
      return [...prev, recipeId];
    });
  };

  const handleSave = async () => {
    if (selectedRecipes.length === 0) return;

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Add recipes to cookbook
      const insertData = selectedRecipes.map((recipeId) => ({
        cookbook_id: cookbookId,
        recipe_id: recipeId,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('recipe_cookbooks')
        .insert(insertData);

      if (error) throw error;

      onRecipesAdded();
      onClose();
    } catch (error) {
      console.error('Error adding recipes to cookbook:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
            <Text style={styles.title}>Add to {cookbookName}</Text>
            <Text style={styles.subtitle}>
              Select recipes to add to this cookbook
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={palette.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={palette.neutral[400]}
          />
        </View>

        {/* Recipe List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading recipes...</Text>
          </View>
        ) : filteredRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {recipes.length === 0
                ? 'No recipes available to add'
                : 'No recipes match your search'}
            </Text>
          </View>
        ) : (
          <BottomSheetScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {filteredRecipes.map((recipe) => {
              const isSelected = selectedRecipes.includes(recipe.id);
              return (
                <TouchableOpacity
                  key={recipe.id}
                  style={[
                    styles.recipeItem,
                    isSelected && styles.recipeItemSelected,
                  ]}
                  onPress={() => handleRecipeToggle(recipe.id)}
                >
                  <View style={styles.recipeImageContainer}>
                    {recipe.image_url ? (
                      <Image
                        source={{ uri: recipe.image_url }}
                        style={styles.recipeImage}
                      />
                    ) : (
                      <View style={styles.recipeImagePlaceholder}>
                        <ChefHat size={20} color={palette.neutral[400]} />
                      </View>
                    )}
                  </View>

                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle} numberOfLines={1}>
                      {recipe.title}
                    </Text>
                    <Text style={styles.recipeDescription} numberOfLines={2}>
                      {recipe.description}
                    </Text>
                    <Text style={styles.recipeMeta}>
                      {recipe.prep_time + recipe.cook_time}m • {recipe.servings}{' '}
                      servings • {recipe.difficulty}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Check size={16} color={colors.textOnPrimary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 20 }} />
          </BottomSheetScrollView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              selectedRecipes.length === 0 && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={selectedRecipes.length === 0 || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>
                Add {selectedRecipes.length} Recipe
                {selectedRecipes.length !== 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    handleIndicator: {
      backgroundColor: colors.border,
    },
    bottomSheetBackground: {
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    titleContainer: {
      flex: 1,
      marginRight: spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    closeButton: {
      padding: spacing.xs,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      height: 48,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      fontSize: 16,
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    recipeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    recipeItemSelected: {
      backgroundColor: palette.primary[50],
      marginHorizontal: -spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
    },
    recipeImageContainer: {
      width: 60,
      height: 60,
      borderRadius: 8,
      overflow: 'hidden',
      marginRight: spacing.md,
    },
    recipeImage: {
      width: '100%',
      height: '100%',
    },
    recipeImagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recipeInfo: {
      flex: 1,
    },
    recipeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    recipeDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    recipeMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: spacing.sm,
    },
    footer: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: colors.border,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textOnPrimary,
    },
  });
