// components/shopping/ShoppingRow.tsx — Stovd shopping list row (Warm Kitchen).
// Clean white surface row: round herb-green check toggle (mirrors the tick in
// components/UI/RecipeCard), Eyebrow kicker, serif item name, meta + delete.
// Visual restyle only — behavior comes entirely from props/handlers.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { colors as palette, fonts, radius, spacing } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import { t } from '@/lib/i18n';

export interface ShoppingRowItem {
  id: string;
  item_name: string;
  brand?: string;
  category?: string;
  quantity: number;
  unit: string;
  estimated_cost?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  is_completed: boolean;
}

const PRIORITY_KEYS: Record<string, string> = {
  low: 'shopping.prioLow',
  medium: 'shopping.prioMedium',
  high: 'shopping.prioHigh',
  urgent: 'shopping.prioUrgent',
};

function priorityColor(priority?: string) {
  switch (priority) {
    case 'urgent':
      return palette.error[600];
    case 'high':
      return palette.error[500];
    case 'medium':
      return palette.accent[600];
    default:
      return palette.secondary[500];
  }
}

interface ShoppingRowProps {
  item: ShoppingRowItem;
  kicker?: string;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export function ShoppingRow({
  item,
  kicker,
  onPress,
  onToggle,
  onDelete,
}: ShoppingRowProps) {
  const { colors } = useTheme();
  const done = item.is_completed;
  const pColor = priorityColor(item.priority);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      {/* round herb-green check toggle (mirrors RecipeCard tick) */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[
          styles.check,
          done
            ? {
                backgroundColor: colors.secondary,
                borderColor: colors.secondary,
              }
            : { backgroundColor: 'transparent', borderColor: colors.border },
        ]}
      >
        {done ? <Check size={15} color="#fff" strokeWidth={3} /> : null}
      </Pressable>

      <View style={styles.body}>
        {kicker ? (
          <Eyebrow color={colors.textSecondary} style={styles.kicker}>
            {kicker}
          </Eyebrow>
        ) : null}
        <Display
          size="sm"
          color={done ? colors.textSecondary : colors.textPrimary}
          numberOfLines={1}
          style={done ? styles.struck : undefined}
        >
          {item.item_name}
        </Display>

        <View style={styles.meta}>
          <Eyebrow color={colors.textSecondary} style={styles.metaText}>
            {`${item.quantity} ${item.unit}`}
          </Eyebrow>
          {item.brand ? (
            <Eyebrow color={colors.textSecondary} style={styles.metaText}>
              {item.brand}
            </Eyebrow>
          ) : null}
          {typeof item.estimated_cost === 'number' &&
          item.estimated_cost > 0 ? (
            <Eyebrow color={colors.secondary} style={styles.metaText}>
              {`₺${item.estimated_cost.toFixed(2)}`}
            </Eyebrow>
          ) : null}
          {item.priority ? (
            <View style={[styles.pBadge, { backgroundColor: pColor + '1A' }]}>
              <View style={[styles.pDot, { backgroundColor: pColor }]} />
              <Eyebrow color={pColor} style={styles.pText}>
                {PRIORITY_KEYS[item.priority]
                  ? t(PRIORITY_KEYS[item.priority])
                  : item.priority}
              </Eyebrow>
            </View>
          ) : null}
        </View>

        {item.notes ? (
          <Eyebrow color={colors.textSecondary} style={styles.notes}>
            {item.notes}
          </Eyebrow>
        ) : null}
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.delete}
      >
        <Trash2 size={17} color={colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 11,
    ...{
      shadowColor: '#3C2814',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: 4 },
  kicker: { fontSize: 9, letterSpacing: 1 },
  struck: { textDecorationLine: 'line-through' },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 1,
  },
  metaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0,
    textTransform: 'none',
  },
  pBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  pDot: { width: 5, height: 5, borderRadius: 3 },
  pText: { fontSize: 9.5, letterSpacing: 0.4, textTransform: 'none' },
  notes: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    letterSpacing: 0,
    textTransform: 'none',
    fontStyle: 'italic',
    marginTop: 1,
  },
  delete: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

void spacing;
