// lib/meal-plan/demo/enhanced-system-demo.ts
// Demo and example usage of the Enhanced AI Meal Planning System

import { 
  generateEnhancedMealPlan,
  createEnhancedGenerator 
} from '../enhanced-ai-generation';
import { PantryItem, UserProfile } from '../types';

// ✅ Demo data representing different user scenarios
export const demoScenarios = {
  // Scenario 1: Busy professional with diverse pantry
  busyProfessional: {
    userProfile: {
      id: 'demo-user-1',
      age: 28,
      gender: 'male',
      height_cm: 175,
      weight_kg: 70,
      activity_level: 'moderately_active',
      health_goals: ['energy_boost', 'muscle_gain'],
      cooking_skill_level: 'beginner',
      cuisine_preferences: ['American', 'Asian'],
      dietary_preferences: ['high_protein'],
      dietary_restrictions: [],
      allergens: [],
      family_size: 1,
      time_constraints: 'quick'
    } as UserProfile,
    
    pantryItems: [
      { id: '1', user_id: 'demo-user-1', name: 'Chicken Breast', category: 'Protein', quantity: 3, unit: 'pieces' },
      { id: '2', user_id: 'demo-user-1', name: 'Brown Rice', category: 'Grains', quantity: 2, unit: 'cups' },
      { id: '3', user_id: 'demo-user-1', name: 'Eggs', category: 'Protein', quantity: 12, unit: 'pieces' },
      { id: '4', user_id: 'demo-user-1', name: 'Spinach', category: 'Vegetables', quantity: 1, unit: 'bag' },
      { id: '5', user_id: 'demo-user-1', name: 'Soy Sauce', category: 'Condiments', quantity: 1, unit: 'bottle' },
      { id: '6', user_id: 'demo-user-1', name: 'Garlic', category: 'Vegetables', quantity: 4, unit: 'cloves' }
    ] as PantryItem[],
    
    description: "Young professional who needs quick, protein-rich meals for muscle gain"
  },

  // Scenario 2: Health-conscious family
  healthyFamily: {
    userProfile: {
      id: 'demo-user-2',
      age: 35,
      gender: 'female',
      height_cm: 162,
      weight_kg: 58,
      activity_level: 'very_active',
      health_goals: ['heart_health', 'balanced_nutrition'],
      cooking_skill_level: 'intermediate',
      cuisine_preferences: ['Mediterranean', 'Italian'],
      dietary_preferences: ['balanced', 'organic'],
      dietary_restrictions: [],
      allergens: [],
      family_size: 4,
      time_constraints: 'moderate'
    } as UserProfile,
    
    pantryItems: [
      { id: '1', user_id: 'demo-user-2', name: 'Salmon Fillet', category: 'Protein', quantity: 2, unit: 'pieces' },
      { id: '2', user_id: 'demo-user-2', name: 'Quinoa', category: 'Grains', quantity: 1, unit: 'cup' },
      { id: '3', user_id: 'demo-user-2', name: 'Cherry Tomatoes', category: 'Vegetables', quantity: 1, unit: 'pint' },
      { id: '4', user_id: 'demo-user-2', name: 'Olive Oil', category: 'Condiments', quantity: 1, unit: 'bottle' },
      { id: '5', user_id: 'demo-user-2', name: 'Feta Cheese', category: 'Dairy', quantity: 1, unit: 'block' },
      { id: '6', user_id: 'demo-user-2', name: 'Fresh Herbs', category: 'Vegetables', quantity: 1, unit: 'bunch' }
    ] as PantryItem[],
    
    description: "Health-conscious mother cooking for a family of 4"
  },

  // Scenario 3: Adventurous foodie
  adventurousFoodie: {
    userProfile: {
      id: 'demo-user-3',
      age: 42,
      gender: 'non_binary',
      height_cm: 170,
      weight_kg: 65,
      activity_level: 'lightly_active',
      health_goals: ['digestive_health', 'balanced_nutrition'],
      cooking_skill_level: 'expert',
      cuisine_preferences: ['Indian', 'Mexican', 'Thai', 'Middle_Eastern'],
      dietary_preferences: ['vegetarian', 'spicy'],
      dietary_restrictions: ['vegetarian'],
      allergens: [],
      family_size: 2,
      time_constraints: 'flexible'
    } as UserProfile,
    
    pantryItems: [
      { id: '1', user_id: 'demo-user-3', name: 'Tofu', category: 'Protein', quantity: 2, unit: 'blocks' },
      { id: '2', user_id: 'demo-user-3', name: 'Coconut Milk', category: 'Dairy', quantity: 2, unit: 'cans' },
      { id: '3', user_id: 'demo-user-3', name: 'Curry Powder', category: 'Spices', quantity: 1, unit: 'jar' },
      { id: '4', user_id: 'demo-user-3', name: 'Basmati Rice', category: 'Grains', quantity: 2, unit: 'cups' },
      { id: '5', user_id: 'demo-user-3', name: 'Chickpeas', category: 'Protein', quantity: 2, unit: 'cans' },
      { id: '6', user_id: 'demo-user-3', name: 'Bell Peppers', category: 'Vegetables', quantity: 3, unit: 'pieces' }
    ] as PantryItem[],
    
    description: "Experienced cook who loves experimenting with international cuisines"
  },

  // Scenario 4: Minimalist pantry
  minimalistPantry: {
    userProfile: {
      id: 'demo-user-4',
      age: 25,
      gender: 'female',
      height_cm: 160,
      weight_kg: 55,
      activity_level: 'sedentary',
      health_goals: ['weight_loss'],
      cooking_skill_level: 'beginner',
      cuisine_preferences: ['Simple', 'American'],
      dietary_preferences: ['low_calorie'],
      dietary_restrictions: [],
      allergens: ['nuts'],
      family_size: 1,
      time_constraints: 'quick'
    } as UserProfile,
    
    pantryItems: [
      { id: '1', user_id: 'demo-user-4', name: 'Canned Tuna', category: 'Protein', quantity: 3, unit: 'cans' },
      { id: '2', user_id: 'demo-user-4', name: 'Bread', category: 'Grains', quantity: 1, unit: 'loaf' },
      { id: '3', user_id: 'demo-user-4', name: 'Lettuce', category: 'Vegetables', quantity: 1, unit: 'head' }
    ] as PantryItem[],
    
    description: "College student with minimal pantry items"
  }
};

// ✅ Demo runner class
export class EnhancedSystemDemo {
  
  // Run a specific demo scenario
  async runScenario(scenarioName: keyof typeof demoScenarios): Promise<any> {
    const scenario = demoScenarios[scenarioName];
    
    console.log(`\n🎭 DEMO SCENARIO: ${scenarioName.toUpperCase()}`);
    console.log(`📝 ${scenario.description}`);
    console.log(`👤 User: ${scenario.userProfile.age}yr ${scenario.userProfile.gender}, ${scenario.userProfile.cooking_skill_level} cook`);
    console.log(`🥘 Pantry: ${scenario.pantryItems.length} items`);
    console.log(`🎯 Goals: ${scenario.userProfile.health_goals?.join(', ')}`);
    console.log(`🍽️ Cuisines: ${scenario.userProfile.cuisine_preferences?.join(', ')}`);
    
    try {
      const startTime = Date.now();
      
      // Generate enhanced meal plan
      const result = await generateEnhancedMealPlan(
        scenario.userProfile.id,
        scenario.pantryItems,
        scenario.userProfile
      );
      
      const generationTime = Date.now() - startTime;
      
      console.log(`\n📊 RESULTS (${generationTime}ms):`);
      console.log(`🌟 Diversity Score: ${result.summary.totalDiversityScore}%`);
      console.log(`🎯 Personalization: ${result.summary.totalPersonalizationScore}%`);
      console.log(`🥫 Pantry Usage: ${result.summary.pantryUtilization}%`);
      console.log(`🔧 Methods: ${result.summary.generationMethods.join(', ')}`);
      
      console.log(`\n🍽️ GENERATED MEALS:`);
      
      if (result.breakfast?.meal) {
        console.log(`🌅 Breakfast: ${result.breakfast.meal.name} (${result.breakfast.meal.calories} cal)`);
        console.log(`   📊 Diversity: ${result.breakfast.diversityScore}%, Personal: ${result.breakfast.personalizationScore}%`);
      }
      
      if (result.lunch?.meal) {
        console.log(`☀️ Lunch: ${result.lunch.meal.name} (${result.lunch.meal.calories} cal)`);
        console.log(`   📊 Diversity: ${result.lunch.diversityScore}%, Personal: ${result.lunch.personalizationScore}%`);
      }
      
      if (result.dinner?.meal) {
        console.log(`🌙 Dinner: ${result.dinner.meal.name} (${result.dinner.meal.calories} cal)`);
        console.log(`   📊 Diversity: ${result.dinner.diversityScore}%, Personal: ${result.dinner.personalizationScore}%`);
      }
      
      if (result.snacks && result.snacks.length > 0) {
        console.log(`🍎 Snack: ${result.snacks[0].meal.name} (${result.snacks[0].meal.calories} cal)`);
      }
      
      // Show insights if available
      if (result.breakfast?.insights) {
        console.log(`\n💡 AI INSIGHTS:`);
        console.log(`   🧠 ${result.breakfast.insights.reasoning}`);
        if (result.breakfast.insights.adaptations.length > 0) {
          console.log(`   🔧 Adaptations: ${result.breakfast.insights.adaptations.slice(0, 2).join(', ')}`);
        }
      }
      
      return {
        scenario: scenarioName,
        success: true,
        generationTime,
        result,
        metrics: {
          diversityScore: result.summary.totalDiversityScore,
          personalizationScore: result.summary.totalPersonalizationScore,
          pantryUtilization: result.summary.pantryUtilization
        }
      };
      
    } catch (error) {
      console.error(`❌ Demo failed:`, error);
      return {
        scenario: scenarioName,
        success: false,
        error: error.message
      };
    }
  }
  
  // Run all demo scenarios
  async runAllScenarios(): Promise<any> {
    console.log('🚀 ENHANCED AI MEAL PLANNING SYSTEM - DEMO SHOWCASE\n');
    console.log('Testing different user profiles and pantry situations...\n');
    
    const results = [];
    
    for (const scenarioName of Object.keys(demoScenarios) as (keyof typeof demoScenarios)[]) {
      const result = await this.runScenario(scenarioName);
      results.push(result);
      
      // Small delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n📊 DEMO SUMMARY:');
    const successful = results.filter(r => r.success).length;
    const avgDiversity = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.metrics.diversityScore, 0) / successful;
    const avgPersonalization = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.metrics.personalizationScore, 0) / successful;
    const avgPantryUsage = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.metrics.pantryUtilization, 0) / successful;
    
    console.log(`✅ Success Rate: ${successful}/${results.length} (${Math.round(successful/results.length*100)}%)`);
    console.log(`📈 Avg Diversity: ${Math.round(avgDiversity)}%`);
    console.log(`🎯 Avg Personalization: ${Math.round(avgPersonalization)}%`);
    console.log(`🥫 Avg Pantry Usage: ${Math.round(avgPantryUsage)}%`);
    
    const overallScore = (avgDiversity + avgPersonalization + avgPantryUsage) / 3;
    console.log(`🏆 Overall System Score: ${Math.round(overallScore)}%`);
    
    if (overallScore >= 80) {
      console.log('🎉 EXCELLENT! System performs very well across all scenarios.');
    } else if (overallScore >= 70) {
      console.log('✨ GOOD! System works well with room for minor improvements.');
    } else if (overallScore >= 60) {
      console.log('⚠️ MODERATE! System needs some optimization.');
    } else {
      console.log('🚨 NEEDS WORK! System requires significant improvements.');
    }
    
    return {
      summary: {
        totalScenarios: results.length,
        successfulScenarios: successful,
        successRate: Math.round(successful/results.length*100),
        averageMetrics: {
          diversity: Math.round(avgDiversity),
          personalization: Math.round(avgPersonalization),
          pantryUsage: Math.round(avgPantryUsage),
          overall: Math.round(overallScore)
        }
      },
      scenarios: results
    };
  }
  
  // Demonstrate diversity over time
  async demonstrateDiversityOverTime(): Promise<void> {
    console.log('\n🔄 DIVERSITY OVER TIME DEMONSTRATION');
    console.log('Generating meals over 7 days to show variety...\n');
    
    const generator = createEnhancedGenerator('demo-user-diversity');
    const scenario = demoScenarios.busyProfessional;
    const mealHistory = [];
    
    for (let day = 1; day <= 7; day++) {
      try {
        const result = await generator.generateEnhancedMeal(
          'lunch',
          scenario.pantryItems,
          scenario.userProfile,
          mealHistory,
          { prioritizeDiversity: true }
        );
        
        if (result.meal) {
          mealHistory.push(result.meal);
          console.log(`Day ${day}: ${result.meal.name} (Diversity: ${result.diversityScore}%)`);
        }
        
      } catch (error) {
        console.log(`Day ${day}: Generation failed`);
      }
    }
    
    // Analyze ingredient variety
    const allIngredients = mealHistory.flatMap(meal => 
      meal.ingredients.map(ing => ing.name.toLowerCase())
    );
    const uniqueIngredients = new Set(allIngredients);
    const varietyScore = Math.round((uniqueIngredients.size / allIngredients.length) * 100);
    
    console.log(`\n📊 Variety Analysis:`);
    console.log(`🥘 Total meals: ${mealHistory.length}`);
    console.log(`🧄 Total ingredients used: ${allIngredients.length}`);
    console.log(`✨ Unique ingredients: ${uniqueIngredients.size}`);
    console.log(`🎯 Variety score: ${varietyScore}%`);
  }
}

// ✅ Export demo runner
export const runEnhancedSystemDemo = async () => {
  const demo = new EnhancedSystemDemo();
  return await demo.runAllScenarios();
};

// ✅ Export diversity demonstration
export const demonstrateDiversityOverTime = async () => {
  const demo = new EnhancedSystemDemo();
  return await demo.demonstrateDiversityOverTime();
};

// ✅ Quick demo function
export const quickDemo = async (scenarioName?: keyof typeof demoScenarios) => {
  const demo = new EnhancedSystemDemo();
  
  if (scenarioName && demoScenarios[scenarioName]) {
    return await demo.runScenario(scenarioName);
  } else {
    console.log('🎲 Running random scenario...');
    const scenarios = Object.keys(demoScenarios) as (keyof typeof demoScenarios)[];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    return await demo.runScenario(randomScenario);
  }
};