import SelectableList from '@/components/onboarding/SelectableList';

const HEALTH_GOALS_MACROS = [
  { key: 'weight_loss', label: '🏃‍♀️ Weight Loss' },
  { key: 'muscle_gain', label: '💪 Muscle Gain' },
  { key: 'maintain_weight', label: '⚖️ Maintain Weight' },
] as const;

// Static data arrays
const HEALTH_GOALS_MICROS = [
  { key: 'improve_health', label: '❤️ Improve Health' },
  { key: 'energy_boost', label: '⚡ Energy Boost' },
  { key: 'digestive_health', label: '🌿 Digestive Health' },
  { key: 'skin_health', label: '✨ Skin Health' },
  { key: 'hormonal_balance', label: '🔄 Hormonal Balance' },
  { key: 'heart_health', label: '❤️‍🩹 Heart Health' },
  { key: 'immune_support', label: '🛡️ Immune Support' },
  { key: 'bone_strength', label: '🦴 Bone Strength' },
  { key: 'anti_aging', label: '⏳ Anti-Aging' },
  { key: 'blood_sugar_control', label: '🍭 Blood Sugar Control' },
  { key: 'cholesterol_control', label: '🩸 Cholesterol Control' },
] as const;

export const HealthGoalsMicrosKeys = HEALTH_GOALS_MICROS.map((opt) => opt.key);
export const HealthGoalsMacrosKeys = HEALTH_GOALS_MACROS.map((opt) => opt.key);

const COMMON_ALLERGENS = [
  { key: 'nuts', label: '🥜 Tree Nuts' },
  { key: 'peanuts', label: '🥜 Peanuts' },
  { key: 'dairy', label: '🥛 Dairy/Lactose' },
  { key: 'eggs', label: '🥚 Eggs' },
  { key: 'soy', label: '🫘 Soy' },
  { key: 'wheat', label: '🌾 Wheat/Gluten' },
  { key: 'fish', label: '🐟 Fish' },
  { key: 'shellfish', label: '🦐 Shellfish' },
  { key: 'sesame', label: '🌰 Sesame' },
  { key: 'sulfites', label: '🍷 Sulfites' },
];

const CUISINE_PREFERENCES = [
  { key: 'italian', label: '🇮🇹 Italian' },
  { key: 'chinese', label: '🇨🇳 Chinese' },
  { key: 'japanese', label: '🇯🇵 Japanese' },
  { key: 'turkish', label: '🇹🇷 Turkish' },
  { key: 'mexican', label: '🇲🇽 Mexican' },
  { key: 'indian', label: '🇮🇳 Indian' },
  { key: 'french', label: '🇫🇷 French' },
  { key: 'thai', label: '🇹🇭 Thai' },
  { key: 'greek', label: '🇬🇷 Greek' },
  { key: 'korean', label: '🇰🇷 Korean' },
  { key: 'spanish', label: '🇪🇸 Spanish' },
  { key: 'vietnamese', label: '🇻🇳 Vietnamese' },
  { key: 'lebanese', label: '🇱🇧 Lebanese' },
  { key: 'german', label: '🇩🇪 German' },
  { key: 'brazilian', label: '🇧🇷 Brazilian' },
  { key: 'moroccan', label: '🇲🇦 Moroccan' },
  { key: 'ethiopian', label: '🇪🇹 Ethiopian' },
  { key: 'russian', label: '🇷🇺 Russian' },
  { key: 'american', label: '🇺🇸 American' },
  { key: 'peruvian', label: '🇵🇪 Peruvian' },
];

const DIETARY_PREFERENCES = [
  { key: 'vegan', label: '🌱 Vegan' },
  { key: 'vegetarian', label: '🥬 Vegetarian' },
  { key: 'pescatarian', label: '🐟 Pescatarian' },
  { key: 'keto', label: '🥑 Ketogenic' },
  { key: 'paleo', label: '🦴 Paleo' },
  { key: 'mediterranean', label: '🫒 Mediterranean' },
  { key: 'low_carb', label: '🥩 Low Carb' },
  { key: 'gluten_free', label: '🌾 Gluten Free' },
  { key: 'dairy_free', label: '🥛 Dairy Free' },
  { key: 'low_fat', label: '🍃 Low Fat' },
  { key: 'raw_food', label: '🥗 Raw Food' },
  { key: 'flexitarian', label: '🍽️ Flexitarian' },
  { key: 'whole30', label: '🧘 Whole30' },
  { key: 'dash', label: '💓 DASH' },
  { key: 'fodmap', label: '🚫 FODMAP' },
  { key: 'carnivore', label: '🥓 Carnivore' },
  { key: 'halal', label: '🕌 Halal' },
  { key: 'kosher', label: '✡️ Kosher' },
  { key: 'intermittent_fasting', label: '⏱️ Intermittent Fasting' },
  { key: 'diabetic_friendly', label: '🩸 Diabetic-Friendly' },
];

// 🧩 Export individual screens using the shared component
export const HealthGoalsMicros = () => (
  <SelectableList
    name="healthGoalsMicros"
    title="🎯 Health Goals Micros"
    subtitle="Select your micro wellness goals"
    options={HEALTH_GOALS_MICROS}
    noSelectionLabel="✅ No specific micro health goals needed"
  />
);

export const HealthGoalsMacros = () => (
  <SelectableList
    name="healthGoalsMacros"
    title="🎯 Health Goals Macros"
    subtitle="Select your macro wellness goals"
    options={HEALTH_GOALS_MACROS}
  />
);

export const Allergens = () => (
  <SelectableList
    name="dietaryRestrictions"
    title="🛡️ Food Allergies & Intolerances"
    subtitle="Help us keep you safe by selecting any allergens you have"
    options={COMMON_ALLERGENS}
    noSelectionLabel="✅ I don’t have any food allergies or intolerances"
  />
);

export const DietaryPreferences = () => (
  <SelectableList
    name="dietaryPreferences"
    title="🥗 Dietary Preferences"
    subtitle="Select your preferred eating styles"
    options={DIETARY_PREFERENCES}
    noSelectionLabel="✅ No specific dietary preference"
  />
);

export const CuisinePreferences = () => (
  <SelectableList
    name="cuisinePreferences"
    title="🍽️ Cuisine Preferences"
    subtitle="Pick cuisines you enjoy the most"
    options={CUISINE_PREFERENCES}
    noSelectionLabel="✅ No specific cuisine preference"
  />
);
