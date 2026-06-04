// components/UI/RecipeCard.tsx — Stovd premium recipe cards (Warm Kitchen).
//   FeatureCard      = full-bleed hero with scrim + match badge (home "pick").
//   RecipeListCard   = image-left list row with kicker + serif title + meta.
//   MatchBadge       = "% match" pill (on-image frosted / plain herb).
// Photos are optional: when imageUrl is missing we render a branded warm
// gradient + ChefHat mark (intentional placeholder, not an emoji block).
import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Clock, ChevronRight, ChefHat } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { colors as palette, fonts, radius, spacing } from '@/lib/theme/index';
import { Display, Eyebrow } from './Display';
import { i18n } from '@/lib/i18n';

const FALLBACK = ['#D56A4F', '#C8472B'] as const;

// Locale is fixed at startup (device-driven), so compute label formats once.
const TR = i18n.locale === 'tr';
const matchLabel = (pct: number) => (TR ? `%${pct} eşleşme` : `${pct}% match`);
const minLabel = (m: number) => (TR ? `${m} dk` : `${m} min`);
const missingLabel = (n: number) => (TR ? `${n} eksik` : `${n} missing`);
const FROM_PANTRY = TR ? 'Dolabından' : 'From your pantry';

function Photo({
  uri,
  height,
  radius: r,
}: {
  uri?: string | null;
  height: number;
  radius: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: '100%', height, borderRadius: r }}
        resizeMode="cover"
      />
    );
  }
  return (
    <LinearGradient
      colors={FALLBACK}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: '100%',
        height,
        borderRadius: r,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ChefHat size={height > 120 ? 44 : 28} color="rgba(255,255,255,0.55)" />
    </LinearGradient>
  );
}

export function MatchBadge({
  pct,
  variant = 'plain',
}: {
  pct: number;
  variant?: 'plain' | 'onImage';
}) {
  if (variant === 'onImage') {
    return (
      <View style={styles.matchOnImage}>
        <View style={styles.matchDot} />
        <Display
          // small label, but using Inter for legibility on image
          size="sm"
          style={styles.matchOnImageText}
        >
          {matchLabel(pct)}
        </Display>
      </View>
    );
  }
  return (
    <View style={styles.matchPlain}>
      <View
        style={[styles.matchDot, { backgroundColor: palette.secondary[500] }]}
      />
      <View>
        <Display
          size="sm"
          color={palette.secondary[600]}
          style={styles.matchPlainText}
        >
          {matchLabel(pct)}
        </Display>
      </View>
    </View>
  );
}

interface FeatureCardProps {
  title: string;
  kicker?: string;
  chip?: string;
  imageUrl?: string | null;
  matchPct?: number;
  timeMin?: number;
  missingCount?: number;
  saved?: boolean;
  onPress?: () => void;
  onToggleSave?: () => void;
}

export function FeatureCard({
  title,
  kicker,
  chip = FROM_PANTRY,
  imageUrl,
  matchPct,
  timeMin,
  missingCount,
  saved,
  onPress,
  onToggleSave,
}: FeatureCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.feature}>
      <Photo uri={imageUrl} height={210} radius={radius.xl} />
      <LinearGradient
        colors={['rgba(18,11,7,0)', 'rgba(18,11,7,0.30)', 'rgba(18,11,7,0.86)']}
        locations={[0.28, 0.56, 1]}
        style={styles.featureScrim}
      />
      {chip ? (
        <View style={styles.chip}>
          <Eyebrow color={palette.primary[700]} style={styles.chipText}>
            {chip}
          </Eyebrow>
        </View>
      ) : null}
      <Pressable onPress={onToggleSave} hitSlop={10} style={styles.bookmark}>
        <Bookmark
          size={17}
          color="#fff"
          fill={saved ? '#fff' : 'transparent'}
        />
      </Pressable>
      <View style={styles.featureOverlay}>
        {kicker ? (
          <Eyebrow color="#EBC8BC" style={styles.featureKicker}>
            {kicker}
          </Eyebrow>
        ) : null}
        <Display size="lg" color="#fff" style={styles.featureTitle}>
          {title}
        </Display>
        <View style={styles.frow}>
          {typeof matchPct === 'number' ? (
            <MatchBadge pct={matchPct} variant="onImage" />
          ) : null}
          {typeof timeMin === 'number' ? (
            <View style={styles.frowItem}>
              <Clock size={13} color="#EFE3DA" />
              <DisplayMeta>{minLabel(timeMin)}</DisplayMeta>
            </View>
          ) : null}
          {typeof missingCount === 'number' ? (
            <DisplayMeta>{missingLabel(missingCount)}</DisplayMeta>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

interface RecipeListCardProps {
  title: string;
  kicker?: string;
  imageUrl?: string | null;
  matchPct?: number;
  timeMin?: number;
  onPress?: () => void;
}

export function RecipeListCard({
  title,
  kicker,
  imageUrl,
  matchPct,
  timeMin,
  onPress,
}: RecipeListCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.listCard,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <View style={styles.listImg}>
        <Photo uri={imageUrl} height={74} radius={14} />
      </View>
      <View style={styles.listBody}>
        {kicker ? (
          <Eyebrow color={colors.textSecondary} style={styles.listKicker}>
            {kicker}
          </Eyebrow>
        ) : null}
        <Display size="sm" color={colors.textPrimary} numberOfLines={2}>
          {title}
        </Display>
        <View style={styles.listMeta}>
          {typeof timeMin === 'number' ? (
            <View style={styles.frowItem}>
              <Clock size={12} color={colors.textSecondary} />
              <MetaText color={colors.textSecondary}>
                {minLabel(timeMin)}
              </MetaText>
            </View>
          ) : null}
          {typeof matchPct === 'number' ? (
            <MetaText color={palette.secondary[600]} bold>
              {matchLabel(matchPct)}
            </MetaText>
          ) : null}
        </View>
      </View>
      <ChevronRight size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

// small inline meta helpers (Inter, not serif)
function DisplayMeta({ children }: { children: React.ReactNode }) {
  return <MetaText color="#EFE3DA">{children}</MetaText>;
}
function MetaText({
  children,
  color,
  bold,
}: {
  children: React.ReactNode;
  color: string;
  bold?: boolean;
}) {
  return (
    <View>
      <Eyebrow
        color={color}
        style={[styles.metaText, bold && { fontFamily: fonts.bodyBold }]}
      >
        {children}
      </Eyebrow>
    </View>
  );
}

const styles = StyleSheet.create({
  feature: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...{
      shadowColor: '#241710',
      shadowOpacity: 0.2,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
  },
  featureScrim: { ...StyleSheet.absoluteFillObject, borderRadius: radius.xl },
  chip: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(251,247,240,0.93)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  chipText: { fontSize: 9.5, letterSpacing: 1.2 },
  bookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18,11,7,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureOverlay: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  featureKicker: { fontSize: 9.5, letterSpacing: 1.4, marginBottom: 6 },
  featureTitle: { marginBottom: 10 },
  frow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexWrap: 'wrap',
  },
  frowItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    letterSpacing: 0,
    textTransform: 'none',
  },
  matchOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251,247,240,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251,247,240,0.30)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  matchOnImageText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 10.5,
    color: '#fff',
    letterSpacing: 0,
  },
  matchPlain: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  matchPlainText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0,
  },
  matchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8FCE8C',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 8,
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
  listImg: { width: 74, height: 74, borderRadius: 14, overflow: 'hidden' },
  listBody: { flex: 1, minWidth: 0, gap: 5 },
  listKicker: { fontSize: 9, letterSpacing: 1 },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 1,
  },
});

void spacing;
