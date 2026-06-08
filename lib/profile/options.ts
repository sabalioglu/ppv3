// lib/profile/options.ts — selectable option sets for the profile editor.
//
// `value` is the stored data (written verbatim to user_profiles, never
// translated). `labelKey` is an i18n key resolved at render time. Keys mirror
// the onboarding flow (components/onboarding/*) so a profile edited here stays
// compatible with what onboarding wrote.
export interface ProfileOption {
  value: string;
  labelKey: string;
}

// → user_profiles.dietary_preferences
export const DIET_OPTIONS: readonly ProfileOption[] = [
  { value: 'vegan', labelKey: 'auth.onboarding.dietVegan' },
  { value: 'vegetarian', labelKey: 'auth.onboarding.dietVegetarian' },
  { value: 'pescatarian', labelKey: 'auth.onboarding.dietPescatarian' },
  { value: 'keto', labelKey: 'auth.onboarding.dietKeto' },
  { value: 'paleo', labelKey: 'auth.onboarding.dietPaleo' },
  { value: 'mediterranean', labelKey: 'auth.onboarding.dietMediterranean' },
  { value: 'low_carb', labelKey: 'auth.onboarding.dietLowCarb' },
  { value: 'gluten_free', labelKey: 'auth.onboarding.dietGlutenFree' },
  { value: 'dairy_free', labelKey: 'auth.onboarding.dietDairyFree' },
  { value: 'low_fat', labelKey: 'auth.onboarding.dietLowFat' },
  { value: 'raw_food', labelKey: 'auth.onboarding.dietRawFood' },
  { value: 'flexitarian', labelKey: 'auth.onboarding.dietFlexitarian' },
  { value: 'whole30', labelKey: 'auth.onboarding.dietWhole30' },
  { value: 'dash', labelKey: 'auth.onboarding.dietDash' },
  { value: 'fodmap', labelKey: 'auth.onboarding.dietFodmap' },
  { value: 'carnivore', labelKey: 'auth.onboarding.dietCarnivore' },
  { value: 'halal', labelKey: 'auth.onboarding.dietHalal' },
  { value: 'kosher', labelKey: 'auth.onboarding.dietKosher' },
  {
    value: 'intermittent_fasting',
    labelKey: 'auth.onboarding.dietIntermittentFasting',
  },
  {
    value: 'diabetic_friendly',
    labelKey: 'auth.onboarding.dietDiabeticFriendly',
  },
];

// → user_profiles.dietary_restrictions
export const ALLERGEN_OPTIONS: readonly ProfileOption[] = [
  { value: 'nuts', labelKey: 'auth.onboarding.allergenNuts' },
  { value: 'peanuts', labelKey: 'auth.onboarding.allergenPeanuts' },
  { value: 'dairy', labelKey: 'auth.onboarding.allergenDairy' },
  { value: 'eggs', labelKey: 'auth.onboarding.allergenEggs' },
  { value: 'soy', labelKey: 'auth.onboarding.allergenSoy' },
  { value: 'wheat', labelKey: 'auth.onboarding.allergenWheat' },
  { value: 'fish', labelKey: 'auth.onboarding.allergenFish' },
  { value: 'shellfish', labelKey: 'auth.onboarding.allergenShellfish' },
  { value: 'sesame', labelKey: 'auth.onboarding.allergenSesame' },
  { value: 'sulfites', labelKey: 'auth.onboarding.allergenSulfites' },
];

// → user_profiles.cuisine_preferences
export const CUISINE_OPTIONS: readonly ProfileOption[] = [
  { value: 'italian', labelKey: 'auth.onboarding.cuisineItalian' },
  { value: 'chinese', labelKey: 'auth.onboarding.cuisineChinese' },
  { value: 'japanese', labelKey: 'auth.onboarding.cuisineJapanese' },
  { value: 'turkish', labelKey: 'auth.onboarding.cuisineTurkish' },
  { value: 'mexican', labelKey: 'auth.onboarding.cuisineMexican' },
  { value: 'indian', labelKey: 'auth.onboarding.cuisineIndian' },
  { value: 'french', labelKey: 'auth.onboarding.cuisineFrench' },
  { value: 'thai', labelKey: 'auth.onboarding.cuisineThai' },
  { value: 'greek', labelKey: 'auth.onboarding.cuisineGreek' },
  { value: 'korean', labelKey: 'auth.onboarding.cuisineKorean' },
  { value: 'spanish', labelKey: 'auth.onboarding.cuisineSpanish' },
  { value: 'vietnamese', labelKey: 'auth.onboarding.cuisineVietnamese' },
  { value: 'lebanese', labelKey: 'auth.onboarding.cuisineLebanese' },
  { value: 'german', labelKey: 'auth.onboarding.cuisineGerman' },
  { value: 'brazilian', labelKey: 'auth.onboarding.cuisineBrazilian' },
  { value: 'moroccan', labelKey: 'auth.onboarding.cuisineMoroccan' },
  { value: 'ethiopian', labelKey: 'auth.onboarding.cuisineEthiopian' },
  { value: 'russian', labelKey: 'auth.onboarding.cuisineRussian' },
  { value: 'american', labelKey: 'auth.onboarding.cuisineAmerican' },
  { value: 'peruvian', labelKey: 'auth.onboarding.cuisinePeruvian' },
];

// → user_profiles.cooking_skill_level (single select)
export const COOKING_SKILL_OPTIONS: readonly ProfileOption[] = [
  { value: 'beginner', labelKey: 'auth.onboarding.skillBeginner' },
  { value: 'intermediate', labelKey: 'auth.onboarding.skillIntermediate' },
  { value: 'advanced', labelKey: 'auth.onboarding.skillAdvanced' },
  { value: 'expert', labelKey: 'auth.onboarding.skillExpert' },
];

// → user_profiles.activity_level (single select)
export const ACTIVITY_OPTIONS: readonly ProfileOption[] = [
  { value: 'sedentary', labelKey: 'auth.onboarding.activitySedentary' },
  { value: 'lightly_active', labelKey: 'auth.onboarding.activityLightly' },
  {
    value: 'moderately_active',
    labelKey: 'auth.onboarding.activityModerately',
  },
  { value: 'very_active', labelKey: 'auth.onboarding.activityVery' },
  { value: 'extra_active', labelKey: 'auth.onboarding.activityExtra' },
];
