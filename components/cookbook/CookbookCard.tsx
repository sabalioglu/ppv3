// components/cookbook/CookbookCard.tsx (React Native version)
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Book, MoreVertical, Edit3, Trash2, X } from 'lucide-react-native';
import { Cookbook } from '../../types/cookbook'; // Relative path
import { colors, spacing, typography, shadows } from '../../lib/theme'; // Relative path

const { width } = Dimensions.get('window');

interface CookbookCardProps {
  cookbook: Cookbook;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CookbookCard({ cookbook, onClick, onEdit, onDelete }: CookbookCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuPress = (e: any) => {
    e.stopPropagation();
    setShowMenu(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) onEdit();
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (onDelete) {
      Alert.alert(
        'Delete Cookbook',
        `Are you sure you want to delete "${cookbook.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: onDelete
          }
        ]
      );
    }
  };

  return (
    <>
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

          {/* Edit button - sadece default olmayan cookbook'larda göster */}
          {!cookbook.is_default && (onEdit || onDelete) && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleMenuPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertical size={16} color={colors.neutral[600]} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{cookbook.name}</Text>
          {cookbook.description && (
            <Text style={styles.description} numberOfLines={1}>
              {cookbook.description}
            </Text>
          )}
          {cookbook.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle} numberOfLines={1}>{cookbook.name}</Text>
              <TouchableOpacity
                onPress={() => setShowMenu(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {onEdit && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEdit}
              >
                <Edit3 size={18} color={colors.neutral[700]} />
                <Text style={styles.menuItemText}>Edit Cookbook</Text>
              </TouchableOpacity>
            )}

            {onDelete && !cookbook.is_default && (
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemDanger]}
                onPress={handleDelete}
              >
                <Trash2 size={18} color={colors.error[500]} />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                  Delete Cookbook
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
    marginBottom: spacing.xs,
  },
  defaultBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  defaultText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    fontWeight: '600',
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
    ...shadows.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    width: '80%',
    maxWidth: 300,
    ...shadows.lg,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  menuTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    flex: 1,
    marginRight: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  menuItemText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: colors.error[500],
  },
});