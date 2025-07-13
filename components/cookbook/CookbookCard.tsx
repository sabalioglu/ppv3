// components/cookbook/CookbookCard.tsx (React Native version)
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Book, MoreVertical } from 'lucide-react-native';
import { Cookbook } from '@/types/cookbook';
import { colors, spacing, typography, shadows } from '@/lib/theme';

const { width } = Dimensions.get('window');

interface CookbookCardProps {
  cookbook: Cookbook;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CookbookCard({ cookbook, onClick, onEdit, onDelete }: CookbookCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onClick}
      activeOpacity={0.7}
    >
      <View 
        style={[styles.coverContainer, { backgroundColor: cookbook.color || colors.primary[500] }]}
      >
        {cookbook.cover_image ? (
          <Image
            source={{ uri: cookbook.cover_image }}
            style={styles.coverImage}
          />
        ) : (
          <Text style={styles.emoji}>{cookbook.emoji || '📚'}</Text>
        )}
        
        <View style={styles.recipeBadge}>
          <Text style={styles.recipeCount}>{cookbook.recipe_count || 0} recipes</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{cookbook.name}</Text>
        {cookbook.description && (
          <Text style={styles.description} numberOfLines={1}>
            {cookbook.description}
          </Text>
        )}
      </View>

      {!cookbook.is_default && (onEdit || onDelete) && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={(e) => {
            e.stopPropagation();
            // Menu açma logic'i eklenecek
          }}
        >
          <MoreVertical size={16} color={colors.neutral[600]} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  coverContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 48,
  },
  recipeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  recipeCount: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[0],
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  menuButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
