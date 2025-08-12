// Cultural rules for meal-time conventions (breakfast seafood, etc.)
export type BreakfastSeafoodMode = 'allow'|'avoid'|'contextual';

// Cuisines in our app keys where fish/seafood at breakfast is culturally OK/common.
const BASE_ALLOW = new Set<string>([
  'japanese','korean','chinese','vietnamese','thai','russian'
  // not adding turkish/american/greek/italian/french/mexican by default
]);

export function breakfastSeafoodAllowList(cuisines: string[]) {
  return (cuisines||[]).filter(c => BASE_ALLOW.has(c));
}

export function breakfastSeafoodMode(
  cuisines: string[] = [],
  dietRules: string[] = [],
  envDefault = String(process.env.EXPO_PUBLIC_BREAKFAST_SEAFOOD_DEFAULT || 'contextual')
): BreakfastSeafoodMode {
  const env = envDefault.toLowerCase();
  if (dietRules?.some(r => r.toLowerCase()==='vegan' || r.toLowerCase()==='vegetarian')) return 'avoid';
  if (env === 'allow' || env === 'avoid') return env as BreakfastSeafoodMode;
  // contextual = allow only when final cuisine is in the allow list
  return breakfastSeafoodAllowList(cuisines).length ? 'contextual' : 'avoid';
}

export function breakfastSeafoodAllowedForCuisine(
  primaryCuisine: string,
  mode: BreakfastSeafoodMode,
  cuisines: string[] = [],
  dietRules: string[] = []
) {
  if (dietRules?.some(r => r.toLowerCase()==='vegan' || r.toLowerCase()==='vegetarian')) return false;
  if (mode === 'allow') return true;
  if (mode === 'avoid')  return false;
  // contextual
  return breakfastSeafoodAllowList(cuisines).includes(primaryCuisine);
}

export function includesSeafood(ingredients: any[] = []) {
  const rx = /(salmon|tuna|fish|cod|anchovy|mackerel|sardine|trout|prawn|shrimp|crab|lobster|oyster|clam|mussel|scallop)/i;
  return ingredients.some((i:any) => rx.test(String(i?.name||'')));
}