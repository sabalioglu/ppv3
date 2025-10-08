import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, shadows } from '@/lib/theme/index';
import { typography, colors } from '@/lib/theme';
import { Recipe } from '@/types/recipe';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 3) / 2;

interface RecipeGridProps {
  recipes: Recipe[];
  viewMode?: 'grid' | 'list';
  onRecipePress?: (recipe: Recipe) => void;
  onFavoritePress?: (recipeId: string) => void;
  onMorePress?: (recipe: Recipe) => void;
  isEditMode?: boolean;
  selectedRecipes?: string[];
  onRecipeSelect?: (recipeId: string) => void;
}

export function RecipeGrid({
  recipes,
  viewMode = 'grid',
  onRecipePress,
  onFavoritePress,
  onMorePress,
  isEditMode = false,
  selectedRecipes = [],
  onRecipeSelect,
}: RecipeGridProps) {
  const handleFavorite = (recipeId: string) => {
    if (onFavoritePress) {
      onFavoritePress(recipeId);
    }
  };

  const handleMore = (recipe: Recipe) => {
    if (onMorePress) {
      onMorePress(recipe);
    }
  };

  const RecipeCard = ({
    recipe,
    viewMode,
    onPress,
    isEditMode,
    isSelected,
    onSelect,
  }) => {
    const handlePress = () => {
      if (isEditMode && onSelect) {
        onSelect(recipe.id);
      } else if (!isEditMode && onPress) {
        onPress(recipe);
      }
    };

    // List view
    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.listCard,
            isEditMode && isSelected && styles.selectedCard,
          ]}
        >
          <View style={styles.listCardContent}>
            {isEditMode && (
              <View style={styles.listCheckbox}>
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </View>
            )}

            <Image
              source={{ uri: recipe.image_url }}
              style={styles.listCardImage}
            />

            <View style={styles.listCardInfo}>
              <Text style={styles.listCardTitle} numberOfLines={1}>
                {recipe.title}
              </Text>
              <Text style={styles.listCardDescription} numberOfLines={2}>
                Data sources:{' '}
                {recipe.source_url
                  ? 'video visuals + metadata text'
                  : 'manual entry'}
                . Nutrition is an estimate.
              </Text>

              <View style={styles.listCardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.metaText}>
                    {recipe.prep_time + recipe.cook_time}m
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color="#666" />
                  <Text style={styles.metaText}>{recipe.servings}</Text>
                </View>
                <View
                  style={[
                    styles.difficultyBadge,
                    styles[`difficulty${recipe.difficulty}`],
                  ]}
                >
                  <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
                </View>
                {recipe.is_ai_generated && (
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.listCardActions}>
              <TouchableOpacity onPress={() => handleFavorite(recipe.id)}>
                <Ionicons
                  name={recipe.is_favorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={recipe.is_favorite ? '#FF5252' : '#666'}
                />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="bookmark-outline" size={20} color="#666" />
              </TouchableOpacity>
              {!isEditMode && (
                <TouchableOpacity onPress={() => handleMore(recipe)}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Grid view
    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          isEditMode && isSelected && styles.selectedCard,
        ]}
        onPress={handlePress}
      >
        {isEditMode && (
          <View style={styles.gridCheckbox}>
            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>
        )}

        <View style={styles.gridImageContainer}>
          <Image
            source={{ uri: recipe.image_url }}
            style={styles.gridImage}
            onError={(error) => console.log('Recipe image load error:', error)}
          />
          {recipe.is_ai_generated && (
            <View style={styles.gridAiBadge}>
              <Text style={styles.gridAiBadgeText}>AI</Text>
            </View>
          )}
        </View>

        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle} numberOfLines={2}>
            {recipe.title}
          </Text>

          <View style={styles.gridCardMeta}>
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.neutral[500]}
              />
              <Text style={styles.metaText}>
                {recipe.prep_time + recipe.cook_time}m
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name="people-outline"
                size={12}
                color={colors.neutral[500]}
              />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          </View>

          <View
            style={[
              styles.difficultyBadge,
              styles[`difficulty${recipe.difficulty}`],
            ]}
          >
            <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
          </View>
        </View>

        {!isEditMode && (
          <View style={styles.gridCardActions}>
            <TouchableOpacity onPress={() => handleFavorite(recipe.id)}>
              <Ionicons
                name={recipe.is_favorite ? 'heart' : 'heart-outline'}
                size={18}
                color={recipe.is_favorite ? '#FF5252' : colors.neutral[400]}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMore(recipe)}>
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={colors.neutral[400]}
              />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (viewMode === 'list') {
    return (
      <View style={styles.listContainer}>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            viewMode={viewMode}
            onPress={onRecipePress}
            isEditMode={isEditMode}
            isSelected={selectedRecipes.includes(recipe.id)}
            onSelect={onRecipeSelect}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          viewMode={viewMode}
          onPress={onRecipePress}
          isEditMode={isEditMode}
          isSelected={selectedRecipes.includes(recipe.id)}
          onSelect={onRecipeSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Grid styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  gridCheckbox: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 1,
  },
  gridImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridAiBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridAiBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[0],
  },
  gridCardContent: {
    padding: spacing.md,
  },
  gridCardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  gridCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gridCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  // List styles
  listContainer: {
    paddingTop: spacing.sm,
  },
  listCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  listCardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  listCheckbox: {
    marginRight: 12,
  },
  listCardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  listCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  listCardDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  listCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listCardActions: {
    flexDirection: 'column',
    gap: 16,
    marginLeft: 12,
  },

  // Common styles
  selectedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyEasy: {
    backgroundColor: '#E8F5E8',
  },
  difficultyMedium: {
    backgroundColor: '#FFF3E0',
  },
  difficultyHard: {
    backgroundColor: '#FFEBEE',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F57C00',
  },
  aiBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976D2',
  },
});
