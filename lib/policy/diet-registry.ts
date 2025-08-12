// lib/policy/diet-registry.ts
// Diet rule compilation and token management

export interface CompiledDiet {
  picked: string[];
  tokens: string[];
  restrictions: Record<string, string[]>;
}

const DIET_TOKENS = {
  vegan: ['meat', 'beef', 'lamb', 'pork', 'chicken', 'turkey', 'fish', 'shrimp', 'egg', 'milk', 'cheese', 'yogurt', 'honey'],
  vegetarian: ['meat', 'beef', 'lamb', 'pork', 'chicken', 'turkey', 'fish', 'shrimp'],
  pescatarian: ['beef', 'lamb', 'pork', 'chicken', 'turkey'],
  halal: ['pork', 'bacon', 'ham', 'gelatin', 'wine', 'rum', 'brandy', 'beer', 'alcohol'],
  kosher: ['pork', 'bacon', 'ham', 'shellfish', 'shrimp', 'crab', 'lobster', 'oyster', 'clam', 'mussel'],
} as const;

export function compileDietPolicy(dietRules: string[]): CompiledDiet {
  const picked = (dietRules || []).map(r => r.toLowerCase());
  const tokens = new Set<string>();
  const restrictions: Record<string, string[]> = {};

  for (const rule of picked) {
    if (rule in DIET_TOKENS) {
      const ruleTokens = DIET_TOKENS[rule as keyof typeof DIET_TOKENS];
      ruleTokens.forEach(token => tokens.add(token));
      restrictions[rule] = ruleTokens;
    }
  }

  return {
    picked,
    tokens: Array.from(tokens),
    restrictions
  };
}