// app/(protected)/profile-edit.tsx — full profile editor (Warm Editorial).
// Reads the current user_profiles row, lets the user edit name + dietary
// preferences + body metrics, and writes them back. Meal plans and recipe
// suggestions consume this data (getCalorieTarget, portioning).
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LocaleContext';
import { supabase } from '@/lib/supabase';
import { Display, Eyebrow } from '@/components/UI/Display';
import { spacing, radius, fonts } from '@/lib/theme/index';
import {
  DIET_OPTIONS,
  ALLERGEN_OPTIONS,
  CUISINE_OPTIONS,
  COOKING_SKILL_OPTIONS,
  ACTIVITY_OPTIONS,
  type ProfileOption,
} from '@/lib/profile/options';

export default function ProfileEditScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [diets, setDiets] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [cookingSkill, setCookingSkill] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('user_profiles')
          .select(
            'full_name, dietary_preferences, dietary_restrictions, cuisine_preferences, cooking_skill_level, activity_level, height_cm, weight_kg',
          )
          .eq('id', user.id)
          .single();
        if (data) {
          setFullName(data.full_name ?? '');
          setDiets(data.dietary_preferences ?? []);
          setAllergens(data.dietary_restrictions ?? []);
          setCuisines(data.cuisine_preferences ?? []);
          setCookingSkill(data.cooking_skill_level ?? null);
          setActivity(data.activity_level ?? null);
          setHeight(data.height_cm != null ? String(data.height_cm) : '');
          setWeight(data.weight_kg != null ? String(data.weight_kg) : '');
        }
      } catch (e) {
        console.error('profile load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (
    list: string[],
    setList: (v: string[]) => void,
    value: string,
  ) => {
    setList(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('no user');

      const h = parseInt(height, 10);
      const w = parseFloat(weight);
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName.trim() || null,
          dietary_preferences: diets,
          dietary_restrictions: allergens,
          cuisine_preferences: cuisines,
          cooking_skill_level: cookingSkill,
          activity_level: activity,
          height_cm: Number.isFinite(h) ? h : null,
          weight_kg: Number.isFinite(w) ? w : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;

      if (Platform.OS === 'web') {
        router.back();
      } else {
        Alert.alert(t('settings.profileSaved'), '', [
          { text: t('common.ok'), onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert(
        t('common.error'),
        e?.message ?? t('settings.profileSaveError'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Eyebrow style={styles.kicker}>
              {t('settings.profileEditKicker')}
            </Eyebrow>
            <Display size="xl">{t('settings.editProfile')}</Display>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('settings.profileEditSubtitle')}
            </Text>
          </View>

          {/* Basics */}
          <Eyebrow style={styles.sectionTitle}>
            {t('settings.profileSectionBasics')}
          </Eyebrow>
          <Field label={t('settings.profileNameLabel')} colors={colors}>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('settings.profileNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.borderLight,
                  backgroundColor: colors.surface,
                },
              ]}
              maxLength={60}
            />
          </Field>

          {/* Diet & taste */}
          <Eyebrow style={styles.sectionTitle}>
            {t('settings.profileSectionDiet')}
          </Eyebrow>
          <Field label={t('settings.profileDiets')} colors={colors}>
            <ChipGroup
              options={DIET_OPTIONS}
              selected={diets}
              onToggle={(v) => toggle(diets, setDiets, v)}
              colors={colors}
              t={t}
            />
          </Field>
          <Field label={t('settings.profileAllergens')} colors={colors}>
            <ChipGroup
              options={ALLERGEN_OPTIONS}
              selected={allergens}
              onToggle={(v) => toggle(allergens, setAllergens, v)}
              colors={colors}
              t={t}
            />
          </Field>
          <Field label={t('settings.profileCuisines')} colors={colors}>
            <ChipGroup
              options={CUISINE_OPTIONS}
              selected={cuisines}
              onToggle={(v) => toggle(cuisines, setCuisines, v)}
              colors={colors}
              t={t}
            />
          </Field>
          <Field label={t('settings.profileCookingSkill')} colors={colors}>
            <ChipGroup
              options={COOKING_SKILL_OPTIONS}
              selected={cookingSkill ? [cookingSkill] : []}
              onToggle={(v) => setCookingSkill(cookingSkill === v ? null : v)}
              colors={colors}
              t={t}
            />
          </Field>

          {/* Body & activity */}
          <Eyebrow style={styles.sectionTitle}>
            {t('settings.profileSectionBody')}
          </Eyebrow>
          <View style={styles.row}>
            <View style={styles.half}>
              <Field label={t('settings.profileHeight')} colors={colors}>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder={t('settings.profileHeightUnit')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.borderLight,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  maxLength={3}
                />
              </Field>
            </View>
            <View style={styles.half}>
              <Field label={t('settings.profileWeight')} colors={colors}>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={t('settings.profileWeightUnit')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.borderLight,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  maxLength={5}
                />
              </Field>
            </View>
          </View>
          <Field label={t('settings.profileActivity')} colors={colors}>
            <ChipGroup
              options={ACTIVITY_OPTIONS}
              selected={activity ? [activity] : []}
              onToggle={(v) => setActivity(activity === v ? null : v)}
              colors={colors}
              t={t}
            />
          </Field>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.textOnPrimary} size="small" />
            ) : (
              <Text style={[styles.saveText, { color: colors.textOnPrimary }]}>
                {t('common.save')}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  colors: any;
  children: React.ReactNode;
}> = ({ label, colors, children }) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
      {label}
    </Text>
    {children}
  </View>
);

const ChipGroup: React.FC<{
  options: readonly ProfileOption[];
  selected: string[];
  onToggle: (value: string) => void;
  colors: any;
  t: (key: string) => string;
}> = ({ options, selected, onToggle, colors, t }) => (
  <View style={styles.chips}>
    {options.map((opt) => {
      const on = selected.includes(opt.value);
      return (
        <Pressable
          key={opt.value}
          onPress={() => onToggle(opt.value)}
          style={[
            styles.chip,
            {
              backgroundColor: on ? colors.primary : colors.surfaceVariant,
              borderColor: on ? colors.primary : colors.borderLight,
            },
          ]}
        >
          {on && <Check size={13} color={colors.textOnPrimary} strokeWidth={3} />}
          <Text
            style={[
              styles.chipText,
              { color: on ? colors.textOnPrimary : colors.textSecondary },
            ]}
          >
            {t(opt.labelKey)}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: { marginTop: spacing.sm, marginBottom: spacing.lg },
  kicker: { marginBottom: 6 },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13.5,
    fontFamily: fonts.bodyMedium,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 16,
    fontFamily: fonts.bodySemibold,
  },
});
