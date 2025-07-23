//lib/meal-plan/pantry-analysis.ts
// Pantry related functions will go here
import { PantryItem, PantryMetrics, PantryComposition, PantryInsight } from './types';
import { AlertCircle, Info } from 'lucide-react-native';

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
  });
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

  // Generate suggestions based on composition
  if (composition.dominantCategories.includes('Vegetables')) {
    composition.suggestions.push('Focus on vegetable-heavy meals');
  }
  if (composition.dominantCategories.includes('Protein')) {
    composition.suggestions.push('Prioritize protein-rich dishes');
  }
  if (composition.deficientCategories.includes('Fruits')) {
    composition.suggestions.push('Add fresh fruits to shopping list');
  }

  return composition;
};

export const generatePantryInsights = (pantryItems: PantryItem[], metrics: PantryMetrics): PantryInsight[] => {
  const insights: PantryInsight[] = [];
  
  // Expiring items warning
  if (metrics.expiringItems > 0) {
    const expiringItems = getExpiringItems(pantryItems);
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Items Expiring Soon',
      message: `${metrics.expiringItems} items expiring in the next 3 days`,
      items: expiringItems.map(item => item.name).slice(0, 3),
      action: 'Use these items first in your meals',
      priority: 'high',
      actionable: true
    });
  }
  
  // Category balance check
  const categories = Object.keys(metrics.categories);
  if (!categories.includes('Protein') || (metrics.categories['Protein'] || 0) < 3) {
    insights.push({
      type: 'suggestion',
      icon: Info,
      title: 'Low on Protein',
      message: 'Consider adding more protein sources to your pantry',
      action: 'Add to shopping list',
      priority: 'medium',
      actionable: true
    });
  }
  
  if (!categories.includes('Vegetables') || (metrics.categories['Vegetables'] || 0) < 5) {
    insights.push({
      type: 'suggestion',
      icon: Info,
      title: 'Need More Vegetables',
      message: 'A variety of vegetables ensures balanced nutrition',
      action: 'Shop for vegetables',
      priority: 'medium',
      actionable: true
    });
  }

  // Expired items alert
  if (metrics.expiredItems > 0) {
    const expiredItems = pantryItems.filter(item => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      const today = new Date();
      return expiryDate < today;
    });

    insights.push({
      type: 'error',
      icon: AlertCircle,
      title: 'Expired Items Found',
      message: `${metrics.expiredItems} items have expired and should be removed`,
      items: expiredItems.map(item => item.name).slice(0, 3),
      action: 'Clean pantry',
      priority: 'urgent',
      actionable: true
    });
  }

  // Low stock items
  const lowStockItems = pantryItems.filter(item => item.quantity < 2);
  if (lowStockItems.length > 0) {
    insights.push({
      type: 'low_stock',
      icon: Info,
      title: 'Low Stock Alert',
      message: `${lowStockItems.length} items are running low`,
      items: lowStockItems.map(item => item.name).slice(0, 3),
      action: 'Add to shopping list',
      priority: 'medium',
      actionable: true
    });
  }
  
  return insights;
};
