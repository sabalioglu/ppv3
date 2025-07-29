// lib/meal-plan/ingredient-compatibility.ts

import { Ingredient } from './types';

// A knowledge base of classic ingredient pairings, grouped by a primary ingredient.
const CLASSIC_PAIRINGS: Record<string, string[]> = {
  'chicken': ['rosemary', 'thyme', 'lemon', 'garlic', 'onion', 'carrots', 'celery'],
  'beef': ['thyme', 'rosemary', 'garlic', 'onion', 'mushrooms', 'red wine', 'potatoes'],
  'salmon': ['dill', 'lemon', 'asparagus', 'spinach', 'fennel'],
  'tomato': ['basil', 'garlic', 'onion', 'olive oil', 'mozzarella', 'oregano'],
  'eggs': ['cheese', 'bacon', 'spinach', 'mushrooms', 'onions', 'chives'],
  'apple': ['cinnamon', 'nutmeg', 'walnuts', 'cheddar', 'pork'],
  'chocolate': ['orange', 'raspberry', 'mint', 'coffee', 'almonds'],
};

// A list of ingredients that often clash in flavor.
const CLASHING_FLAVORS: [string, string][] = [
  ['fish', 'cheese'], // A classic culinary "don't"
  ['milk', 'lemon'], // Can cause curdling
  ['tomato', 'creamy sauces'], // High acidity can clash
];

/**
 * A utility class to evaluate the compatibility of ingredients within a recipe.
 */
export class IngredientCompatibility {

  /**
   * Calculates a compatibility score for a recipe based on classic pairings.
   * @param ingredients - An array of ingredients from a recipe.
   * @returns A score from 0 to 100, where 100 indicates high compatibility.
   */
  static getPairingScore(ingredients: Ingredient[]): number {
    if (ingredients.length < 2) {
      return 50; // Not enough ingredients to judge
    }

    let score = 0;
    let comparisons = 0;
    const ingredientNames = ingredients.map(ing => ing.name.toLowerCase());

    for (const primary of ingredientNames) {
      const pairings = CLASSIC_PAIRINGS[primary];
      if (pairings) {
        for (const secondary of ingredientNames) {
          if (primary !== secondary) {
            if (pairings.includes(secondary)) {
              score += 1; // Found a good pairing
            }
            comparisons += 1;
          }
        }
      }
    }

    if (comparisons === 0) return 50; // No known pairings to check against
    return Math.round((score / comparisons) * 100);
  }

  /**
   * Checks for known flavor clashes within a recipe's ingredients.
   * @param ingredients - An array of ingredients.
   * @returns An array of strings, each describing a detected flavor clash.
   */
  static findClashes(ingredients: Ingredient[]): string[] {
    const clashes: string[] = [];
    const ingredientNames = ingredients.map(ing => ing.name.toLowerCase());

    for (const name1 of ingredientNames) {
      for (const name2 of ingredientNames) {
        if (name1 === name2) continue;

        for (const [clash1, clash2] of CLASHING_FLAVORS) {
          if ((name1.includes(clash1) && name2.includes(clash2)) || (name1.includes(clash2) && name2.includes(clash1))) {
            const clashDescription = `Possible flavor clash between ${clash1} and ${clash2}.`;
            if (!clashes.includes(clashDescription)) {
              clashes.push(clashDescription);
            }
          }
        }
      }
    }
    return clashes;
  }
}
