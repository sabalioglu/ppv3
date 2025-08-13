// lib/meal-plan/pantry-analysis.ts
// Enhanced pantry analysis with better insights generation
import { PantryItem, PantryMetrics, PantryComposition, PantryInsight } from './types';

// ✅ ADDED: Missing PantryMatchResult interface and calculatePantryMatch function
export interface PantryMatchResult {
  matchPercentage: number;
  matchCount: number;
  totalIngredients: number;
  missingIngredients: string[];
}

export function calculatePantryMatch(
  mealIngredients: any[], 
  pantryItems: PantryItem[]
): PantryMatchResult {
  if (!mealIngredients || mealIngredients.length === 0) {
    return {
      matchPercentage: 0,
      matchCount: 0,
      totalIngredients: 0,
      missingIngredients: []
    };
  }

  const pantryNames = pantryItems.map(item => item.name.toLowerCase().trim());
  let matchCount = 0;
  const missingIngredients: string[] = [];

  for (const ingredient of mealIngredients) {
    const ingredientName = (ingredient.name || '').toLowerCase().trim();
    
    // Check for exact or partial match
    const isInPantry = pantryNames.some(pantryName => 
      pantryName.includes(ingredientName) || 
      ingredientName.includes(pantryName) ||
      ingredientName.split(' ').some(part => pantryName.includes(part))
    );

    if (isInPantry) {
      matchCount++;
      // Mark ingredient as from pantry
      if (typeof ingredient === 'object') {
        ingredient.fromPantry = true;
      }
    } else {
      missingIngredients.push(ingredient.name || 'Unknown ingredient');
    }
  }

  const matchPercentage = Math.round((matchCount / mealIngredients.length) * 100);

  return {
    matchPercentage,
    matchCount,
    totalIngredients: mealIngredients.length,
    missingIngredients
  };
}

export const calculatePantryMetrics = (items: PantryItem[]): PantryMetrics => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let expiringCount = 0;
  let expiredCount = 0;
  const categoryCount: Record<string, number> = {};

  items.forEach(item => {
    // Category counting
    if (item.category) {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    }

    // Expiry checking
    if (item.expiry_date) {
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        expiredCount++;
      } else if (daysUntilExpiry >= 0 && daysUntilExpiry <= 3) {
        expiringCount++;
      }
    }
  });

  return {
    totalItems: items.length,
    expiringItems: expiringCount,
    expiredItems: expiredCount,
    categories: categoryCount,
  };
};

export const getExpiringItems = (items: PantryItem[], daysAhead: number = 3): PantryItem[] => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return items.filter(item => {
    if (!item.expiry_date) return false;
    const expiryDate = new Date(item.expiry_date);
    return expiryDate >= today && expiryDate <= futureDate;
  }).sort((a, b) => {
    // Sort by expiry date (soonest first)
    const dateA = new Date(a.expiry_date!);
    const dateB = new Date(b.expiry_date!);
    return dateA.getTime() - dateB.getTime();
  });
};

export const getExpiredItems = (items: PantryItem[]): PantryItem[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return items.filter(item => {
    if (!item.expiry_date) return false;
    const expiryDate = new Date(item.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate < today;
  });
};

export const getLowStockItems = (items: PantryItem[], threshold: number = 2): PantryItem[] => {
  return items.filter(item => item.quantity <= threshold);
};

export const analyzePantryComposition = (pantryItems: PantryItem[]): PantryComposition => {
  const composition: PantryComposition = {
    categories: {},
    totalItems: pantryItems.length,
    expiringItems: getExpiringItems(pantryItems),
    dominantCategories: [],
    deficientCategories: [],
    suggestions: []
  };

  // Count items by category
  pantryItems.forEach(item => {
    if (item.category) {
      composition.categories[item.category] = (composition.categories[item.category] || 0) + 1;
    }
  });

  // Identify dominant and deficient categories
  const categoryEntries = Object.entries(composition.categories);
  if (categoryEntries.length > 0) {
    const avgItemsPerCategory = composition.totalItems / categoryEntries.length;

    categoryEntries.forEach(([category, count]) => {
      if (count > avgItemsPerCategory * 1.5) {
        composition.dominantCategories.push(category);
      } else if (count < avgItemsPerCategory * 0.5) {
        composition.deficientCategories.push(category);
      }
    });
  }

  // Generate intelligent suggestions
  const suggestions = generatePantrySuggestions(composition, pantryItems);
  composition.suggestions = suggestions;

  return composition;
};

export const generatePantrySuggestions = (composition: PantryComposition, pantryItems: PantryItem[]): string[] => {
  const suggestions: string[] = [];
  
  // Category-based suggestions
  if (composition.dominantCategories.includes('Vegetables') && composition.expiringItems.length > 0) {
    suggestions.push('Consider making vegetable-heavy meals to use expiring produce');
  }
  
  if (composition.dominantCategories.includes('Protein')) {
    suggestions.push('Great protein variety! Focus on protein-rich meal plans');
  }
  
  if (composition.deficientCategories.includes('Fruits')) {
    suggestions.push('Add fresh fruits for balanced nutrition and natural sweetness');
  }
  
  if (composition.deficientCategories.includes('Vegetables')) {
    suggestions.push('Stock up on vegetables for healthier meal options');
  }
  
  // Expiry-based suggestions
  if (composition.expiringItems.length > 3) {
    suggestions.push('Prioritize meals using expiring ingredients to reduce waste');
  }
  
  // Quantity-based suggestions
  const lowStockItems = getLowStockItems(pantryItems);
  if (lowStockItems.length > 5) {
    suggestions.push('Several items are running low - consider restocking essentials');
  }
  
  return suggestions;
};

export const generatePantryInsights = (pantryItems: PantryItem[], metrics: PantryMetrics): PantryInsight[] => {
  const insights: PantryInsight[] = [];
  
  // Critical: Expired items
  if (metrics.expiredItems > 0) {
    const expiredItems = getExpiredItems(pantryItems);
    insights.push({
      type: 'error',
      icon: 'AlertCircle',
      title: 'Expired Items Found',
      message: `${metrics.expiredItems} items have expired and should be removed`,
      items: expiredItems.map(item => item.name).slice(0, 3),
      action: 'Clean pantry now',
      priority: 'urgent',
      actionable: true
    });
  }
  
  // High Priority: Expiring items
  if (metrics.expiringItems > 0) {
    const expiringItems = getExpiringItems(pantryItems);
    const urgentItems = expiringItems.filter(item => {
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 1;
    });
    
    insights.push({
      type: 'warning',
      icon: 'AlertCircle',
      title: urgentItems.length > 0 ? 'Items Expiring Today!' : 'Items Expiring Soon',
      message: `${metrics.expiringItems} items expiring in the next 3 days`,
      items: expiringItems.map(item => {
        const daysUntilExpiry = Math.ceil(
          (new Date(item.expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return `${item.name} (${daysUntilExpiry}d)`;
      }).slice(0, 3),
      action: 'Use in next meals',
      priority: urgentItems.length > 0 ? 'urgent' : 'high',
      actionable: true
    });
  }
  
  // Medium Priority: Low stock items
  const lowStockItems = getLowStockItems(pantryItems);
  if (lowStockItems.length > 0) {
    insights.push({
      type: 'low_stock',
      icon: 'TrendingDown',
      title: 'Low Stock Alert',
      message: `${lowStockItems.length} items are running low`,
      items: lowStockItems.map(item => `${item.name} (${item.quantity} ${item.unit || 'units'})`).slice(0, 3),
      action: 'Add to shopping list',
      priority: 'medium',
      actionable: true
    });
  }
  
  // Category balance insights
  const categories = Object.keys(metrics.categories);
  
  if (!categories.includes('Protein') || (metrics.categories['Protein'] || 0) < 3) {
    insights.push({
      type: 'suggestion',
      icon: 'Package',
      title: 'Low on Protein Sources',
      message: 'Consider adding more protein variety to your pantry',
      action: 'Shop for proteins',
      priority: 'medium',
      actionable: true
    });
  }
  
  if (!categories.includes('Vegetables') || (metrics.categories['Vegetables'] || 0) < 5) {
    insights.push({
      type: 'suggestion',
      icon: 'Package',
      title: 'Need More Vegetables',
      message: 'A variety of vegetables ensures balanced nutrition',
      action: 'Shop for vegetables',
      priority: 'medium',
      actionable: true
    });
  }

  if (!categories.includes('Fruits') || (metrics.categories['Fruits'] || 0) < 3) {
    insights.push({
      type: 'suggestion',
      icon: 'Info',
      title: 'Add Fresh Fruits',
      message: 'Fruits provide essential vitamins and natural sweetness',
      action: 'Shop for fruits',
      priority: 'low',
      actionable: true
    });
  }

  // Positive insights
  if (metrics.totalItems > 20 && metrics.expiringItems === 0 && metrics.expiredItems === 0) {
    insights.push({
      type: 'suggestion',
      icon: 'Package',
      title: 'Well-Stocked Pantry!',
      message: 'Your pantry is well-organized with no expiring items',
      priority: 'low',
      actionable: false
    });
  }
  
  // Sort insights by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => {
    const aPriority = priorityOrder[a.priority || 'low'];
    const bPriority = priorityOrder[b.priority || 'low'];
    return aPriority - bPriority;
  });
};

export const calculatePantryValue = (items: PantryItem[]): number => {
  return items.reduce((total, item) => {
    return total + ((item.cost || 0) * item.quantity);
  }, 0);
};

export const getPantryHealthScore = (items: PantryItem[]): number => {
  const metrics = calculatePantryMetrics(items);
  let score = 100;
  
  // Deduct points for expired items
  score -= metrics.expiredItems * 10;
  
  // Deduct points for expiring items
  score -= metrics.expiringItems * 5;
  
  // Bonus for category diversity
  const categoryCount = Object.keys(metrics.categories).length;
  if (categoryCount >= 5) score += 10;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
};

// ✅ ADDED: Export PantryMatchResult type for other files
export type { PantryMatchResult };