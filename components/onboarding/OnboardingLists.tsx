import SelectableList, {
  SelectableOption,
} from '@/components/onboarding/SelectableList';
import { t } from '@/lib/i18n';

// NOTE: `key` values are stored data — never translate them. Only `label`
// (a resolver fn) is localized.
const HEALTH_GOALS_MACROS: readonly SelectableOption[] = [
  { key: 'weight_loss', label: () => t('auth.onboarding.goalWeightLoss') },
  { key: 'muscle_gain', label: () => t('auth.onboarding.goalMuscleGain') },
  {
    key: 'maintain_weight',
    label: () => t('auth.onboarding.goalMaintainWeight'),
  },
];

const HEALTH_GOALS_MICROS: readonly SelectableOption[] = [
  {
    key: 'improve_health',
    label: () => t('auth.onboarding.goalImproveHealth'),
  },
  { key: 'energy_boost', label: () => t('auth.onboarding.goalEnergyBoost') },
  {
    key: 'digestive_health',
    label: () => t('auth.onboarding.goalDigestiveHealth'),
  },
  { key: 'skin_health', label: () => t('auth.onboarding.goalSkinHealth') },
  {
    key: 'hormonal_balance',
    label: () => t('auth.onboarding.goalHormonalBalance'),
  },
  { key: 'heart_health', label: () => t('auth.onboarding.goalHeartHealth') },
  {
    key: 'immune_support',
    label: () => t('auth.onboarding.goalImmuneSupport'),
  },
  { key: 'bone_strength', label: () => t('auth.onboarding.goalBoneStrength') },
  { key: 'anti_aging', label: () => t('auth.onboarding.goalAntiAging') },
  {
    key: 'blood_sugar_control',
    label: () => t('auth.onboarding.goalBloodSugar'),
  },
  {
    key: 'cholesterol_control',
    label: () => t('auth.onboarding.goalCholesterol'),
  },
];

export const HealthGoalsMicrosKeys = HEALTH_GOALS_MICROS.map((opt) => opt.key);
export const HealthGoalsMacrosKeys = HEALTH_GOALS_MACROS.map((opt) => opt.key);

const COMMON_ALLERGENS: readonly SelectableOption[] = [
  { key: 'nuts', label: () => t('auth.onboarding.allergenNuts') },
  { key: 'peanuts', label: () => t('auth.onboarding.allergenPeanuts') },
  { key: 'dairy', label: () => t('auth.onboarding.allergenDairy') },
  { key: 'eggs', label: () => t('auth.onboarding.allergenEggs') },
  { key: 'soy', label: () => t('auth.onboarding.allergenSoy') },
  { key: 'wheat', label: () => t('auth.onboarding.allergenWheat') },
  { key: 'fish', label: () => t('auth.onboarding.allergenFish') },
  { key: 'shellfish', label: () => t('auth.onboarding.allergenShellfish') },
  { key: 'sesame', label: () => t('auth.onboarding.allergenSesame') },
  { key: 'sulfites', label: () => t('auth.onboarding.allergenSulfites') },
];

const CUISINE_PREFERENCES: readonly SelectableOption[] = [
  { key: 'italian', label: () => t('auth.onboarding.cuisineItalian') },
  { key: 'chinese', label: () => t('auth.onboarding.cuisineChinese') },
  { key: 'japanese', label: () => t('auth.onboarding.cuisineJapanese') },
  { key: 'turkish', label: () => t('auth.onboarding.cuisineTurkish') },
  { key: 'mexican', label: () => t('auth.onboarding.cuisineMexican') },
  { key: 'indian', label: () => t('auth.onboarding.cuisineIndian') },
  { key: 'french', label: () => t('auth.onboarding.cuisineFrench') },
  { key: 'thai', label: () => t('auth.onboarding.cuisineThai') },
  { key: 'greek', label: () => t('auth.onboarding.cuisineGreek') },
  { key: 'korean', label: () => t('auth.onboarding.cuisineKorean') },
  { key: 'spanish', label: () => t('auth.onboarding.cuisineSpanish') },
  { key: 'vietnamese', label: () => t('auth.onboarding.cuisineVietnamese') },
  { key: 'lebanese', label: () => t('auth.onboarding.cuisineLebanese') },
  { key: 'german', label: () => t('auth.onboarding.cuisineGerman') },
  { key: 'brazilian', label: () => t('auth.onboarding.cuisineBrazilian') },
  { key: 'moroccan', label: () => t('auth.onboarding.cuisineMoroccan') },
  { key: 'ethiopian', label: () => t('auth.onboarding.cuisineEthiopian') },
  { key: 'russian', label: () => t('auth.onboarding.cuisineRussian') },
  { key: 'american', label: () => t('auth.onboarding.cuisineAmerican') },
  { key: 'peruvian', label: () => t('auth.onboarding.cuisinePeruvian') },
];

const DIETARY_PREFERENCES: readonly SelectableOption[] = [
  { key: 'vegan', label: () => t('auth.onboarding.dietVegan') },
  { key: 'vegetarian', label: () => t('auth.onboarding.dietVegetarian') },
  { key: 'pescatarian', label: () => t('auth.onboarding.dietPescatarian') },
  { key: 'keto', label: () => t('auth.onboarding.dietKeto') },
  { key: 'paleo', label: () => t('auth.onboarding.dietPaleo') },
  {
    key: 'mediterranean',
    label: () => t('auth.onboarding.dietMediterranean'),
  },
  { key: 'low_carb', label: () => t('auth.onboarding.dietLowCarb') },
  { key: 'gluten_free', label: () => t('auth.onboarding.dietGlutenFree') },
  { key: 'dairy_free', label: () => t('auth.onboarding.dietDairyFree') },
  { key: 'low_fat', label: () => t('auth.onboarding.dietLowFat') },
  { key: 'raw_food', label: () => t('auth.onboarding.dietRawFood') },
  { key: 'flexitarian', label: () => t('auth.onboarding.dietFlexitarian') },
  { key: 'whole30', label: () => t('auth.onboarding.dietWhole30') },
  { key: 'dash', label: () => t('auth.onboarding.dietDash') },
  { key: 'fodmap', label: () => t('auth.onboarding.dietFodmap') },
  { key: 'carnivore', label: () => t('auth.onboarding.dietCarnivore') },
  { key: 'halal', label: () => t('auth.onboarding.dietHalal') },
  { key: 'kosher', label: () => t('auth.onboarding.dietKosher') },
  {
    key: 'intermittent_fasting',
    label: () => t('auth.onboarding.dietIntermittentFasting'),
  },
  {
    key: 'diabetic_friendly',
    label: () => t('auth.onboarding.dietDiabeticFriendly'),
  },
];

// Step screens using the shared multi-select component.
export const HealthGoalsMicros = () => (
  <SelectableList
    name="healthGoalsMicros"
    helper={t('auth.onboarding.goalsMicrosHelper')}
    options={HEALTH_GOALS_MICROS}
    allowNone
  />
);

export const HealthGoalsMacros = () => (
  <SelectableList
    name="healthGoalsMacros"
    helper={t('auth.onboarding.goalsMacrosHelper')}
    options={HEALTH_GOALS_MACROS}
  />
);

export const Allergens = () => (
  <SelectableList
    name="dietaryRestrictions"
    helper={t('auth.onboarding.allergensHelper')}
    options={COMMON_ALLERGENS}
    allowNone
  />
);

export const DietaryPreferences = () => (
  <SelectableList
    name="dietaryPreferences"
    helper={t('auth.onboarding.dietaryHelper')}
    options={DIETARY_PREFERENCES}
    allowNone
  />
);

export const CuisinePreferences = () => (
  <SelectableList
    name="cuisinePreferences"
    helper={t('auth.onboarding.cuisinesHelper')}
    options={CUISINE_PREFERENCES}
    allowNone
  />
);
