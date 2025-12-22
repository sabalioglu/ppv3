export const MICRO_GROUPS = {
  vitamins: [
    'vitaminA',
    'vitaminB1',
    'vitaminB2',
    'vitaminB3',
    'vitaminB6',
    'vitaminB12',
    'folate',
    'vitaminC',
    'vitaminD',
    'vitaminE',
    'vitaminK',
  ],

  minerals: [
    'calcium',
    'magnesium',
    'potassium',
    'iron',
    'zinc',
    'selenium',
    'phosphorus',
    'iodine',
  ],

  fatty_acids: ['omega3', 'omega6', 'saturatedFat'],

  health_nutrients: ['fiber', 'sodium', 'sugar', 'cholesterol'],
} as const;

const HEALTH_GOAL_MICRO_MAP: Record<string, string[]> = {
  improve_health: ['vitaminC', 'vitaminD', 'magnesium', 'fiber', 'omega3'],
  energy_boost: [
    'vitaminB1',
    'vitaminB2',
    'vitaminB3',
    'vitaminB12',
    'iron',
    'magnesium',
  ],
  digestive_health: ['fiber', 'magnesium', 'vitaminB6', 'zinc', 'vitaminB1'],

  skin_health: ['vitaminA', 'vitaminC', 'vitaminE', 'zinc', 'omega3'],

  hormonal_balance: [
    'vitaminB6',
    'magnesium',
    'zinc',
    'vitaminD',
    'omega3',
    'vitaminE',
  ],

  heart_health: ['omega3', 'fiber', 'potassium', 'vitaminK'],

  immune_support: ['vitaminC', 'vitaminD', 'zinc', 'selenium'],

  bone_strength: ['calcium', 'vitaminD', 'phosphorus', 'vitaminK', 'magnesium'],

  anti_aging: ['vitaminC', 'vitaminE', 'selenium', 'omega3'],

  blood_sugar_control: [
    'fiber',
    'magnesium',
    'vitaminB1',
    'vitaminB6',
    'zinc',
    'vitaminD',
  ],
  cholesterol_control: ['fiber', 'omega3', 'vitaminB3', 'vitaminE'],
};
