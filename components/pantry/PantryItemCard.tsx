// components/pantry/PantryItemCard.tsx — Stovd pantry item card (Warm Kitchen).
// White surface + hairline border + soft warm shadow + serif title (Display).
// Co-located restyle of the row that lived inline in app/(tabs)/pantry.tsx.
// Behavior is identical: the parent owns all data + handlers and passes them in.
import React, { useMemo } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import {
  MapPin,
  Calendar,
  Trash2,
  CreditCard as Edit3,
  ShoppingCart,
  MoveVertical as MoreVertical,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts, radius, spacing } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import { t } from '@/lib/i18n';

export interface PantryItemCardData {
  id: string;
  name: string;
  brand?: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  location?: string;
}

interface PantryItemCardProps {
  item: PantryItemCardData;
  imageSource: ImageSourcePropType;
  daysUntilExpiry: number | null;
  expiryColor: string;
  expiryLabel?: string;
  showMenu: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onAddToShoppingList: () => void;
  onDelete: () => void;
  style?: any;
  twoUp?: boolean;
}

export function PantryItemCard({
  item,
  imageSource,
  daysUntilExpiry,
  expiryColor,
  expiryLabel,
  showMenu,
  onToggleMenu,
  onEdit,
  onAddToShoppingList,
  onDelete,
  style,
  twoUp,
}: PantryItemCardProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const showExpiryRail =
    daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0;

  return (
    <View
      style={[
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        style,
      ]}
    >
      <Pressable
        style={s.menuButton}
        onPress={onToggleMenu}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MoreVertical size={18} color={colors.textSecondary} />
      </Pressable>

      {showMenu && (
        <View
          style={[
            s.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Pressable style={s.actionItem} onPress={onEdit}>
            <Edit3 size={16} color={colors.secondary} />
            <Eyebrow color={colors.secondary} style={s.actionText}>
              {t('common.edit')}
            </Eyebrow>
          </Pressable>

          <View
            style={[s.actionDivider, { backgroundColor: colors.borderLight }]}
          />

          <Pressable style={s.actionItem} onPress={onAddToShoppingList}>
            <ShoppingCart size={16} color={colors.accent} />
            <Eyebrow color={colors.accent} style={s.actionText}>
              {t('common.addToList')}
            </Eyebrow>
          </Pressable>

          <View
            style={[s.actionDivider, { backgroundColor: colors.borderLight }]}
          />

          <Pressable style={s.actionItem} onPress={onDelete}>
            <Trash2 size={16} color={colors.error} />
            <Eyebrow color={colors.error} style={s.actionText}>
              {t('common.delete')}
            </Eyebrow>
          </Pressable>
        </View>
      )}

      <View style={s.header}>
        <Image source={imageSource} style={s.image} />
        <View style={s.info}>
          <Display
            size="sm"
            color={colors.textPrimary}
            numberOfLines={twoUp ? 2 : 1}
          >
            {item.name}
          </Display>
          {item.brand ? (
            <Eyebrow
              color={colors.textSecondary}
              style={s.brand}
              numberOfLines={1}
            >
              {item.brand}
            </Eyebrow>
          ) : null}
        </View>
        <View style={[s.quantity, { backgroundColor: colors.surfaceVariant }]}>
          <Display size="sm" color={colors.textPrimary} style={s.quantityText}>
            {`${item.quantity}`}
          </Display>
          <Eyebrow color={colors.textSecondary} style={s.quantityUnit}>
            {item.unit}
          </Eyebrow>
        </View>
      </View>

      <View style={s.details}>
        <View style={s.meta}>
          <MapPin size={12} color={colors.textSecondary} />
          <Eyebrow
            color={colors.textSecondary}
            style={s.metaText}
            numberOfLines={1}
          >
            {item.location}
          </Eyebrow>
        </View>

        {item.expiry_date ? (
          <View style={[s.meta, s.expiryMeta]}>
            <Calendar size={12} color={expiryColor} />
            <Eyebrow color={expiryColor} style={s.metaText} numberOfLines={1}>
              {expiryLabel}
            </Eyebrow>
          </View>
        ) : null}
      </View>

      {showExpiryRail ? (
        <View style={[s.expiryRail, { backgroundColor: expiryColor }]} />
      ) : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm + 4,
      borderWidth: 1,
      position: 'relative',
      overflow: 'visible',
      minHeight: 120,
      shadowColor: '#3C2814',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    menuButton: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 10,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdown: {
      position: 'absolute',
      top: 36,
      right: spacing.sm,
      borderRadius: radius.md,
      paddingVertical: spacing.xs,
      minWidth: 160,
      borderWidth: 1,
      shadowColor: '#3C2814',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
      elevation: 999,
      zIndex: 99999,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
    },
    actionText: {
      fontFamily: fonts.bodySemibold,
      fontSize: 13,
      letterSpacing: 0,
      textTransform: 'none',
    },
    actionDivider: {
      height: 1,
      marginHorizontal: spacing.md - 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm + 4,
    },
    image: {
      width: 64,
      height: 64,
      borderRadius: radius.md + 2,
      marginRight: spacing.sm + 4,
      resizeMode: 'cover',
      backgroundColor: colors.surfaceVariant,
    },
    info: {
      flex: 1,
      marginRight: spacing.sm,
      gap: 3,
    },
    brand: {
      fontSize: 9.5,
      letterSpacing: 1,
    },
    quantity: {
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.md,
      flexDirection: 'row',
      alignItems: 'baseline',
      marginRight: spacing.lg,
      gap: 4,
    },
    quantityText: {
      fontSize: 15,
    },
    quantityUnit: {
      fontSize: 9.5,
      letterSpacing: 0.5,
    },
    details: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    expiryMeta: {
      marginLeft: spacing.md,
      flex: 1,
    },
    metaText: {
      fontSize: 10.5,
      letterSpacing: 0.4,
      textTransform: 'none',
      fontFamily: fonts.bodyMedium,
    },
    expiryRail: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 4,
      height: '100%',
      borderTopRightRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
  });
}
