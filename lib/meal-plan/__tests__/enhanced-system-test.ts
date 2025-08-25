// lib/meal-plan/__tests__/enhanced-system-test.ts
// Test suite for enhanced AI meal planning system

import { createEnhancedGenerator } from '../enhanced-ai-generation';
import { createDiversityManager } from '../enhanced-diversity';
import { createPersonalizedGenerator } from '../personalized-generation';
import { PantryItem, UserProfile } from '../types';

// Mock data for testing
const mockPantryItems: PantryItem[] = [
  {
    id: '1',
    user_id: 'test-user',
    name: 'Chicken Breast',
    category: 'Protein',
    quantity: 2,
    unit: 'pieces',
    expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'test-user',
    name: 'Rice',
    category: 'Grains',
    quantity: 1,
    unit: 'cup',
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    user_id: 'test-user',
    name: 'Broccoli',
    category: 'Vegetables',
    quantity: 1,
    unit: 'head',
    expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    user_id: 'test-user',
    name: 'Olive Oil',
    category: 'Condiments',
    quantity: 1,
    unit: 'bottle',
    expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    user_id: 'test-user',
    name: 'Garlic',
    category: 'Vegetables',
    quantity: 3,
    unit: 'cloves',
    expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockUserProfile: UserProfile = {
  id: 'test-user',
  age: 30,
  gender: 'female',
  height_cm: 165,
  weight_kg: 60,
  activity_level: 'moderately_active',
  health_goals: ['weight_loss', 'balanced_nutrition'],
  cooking_skill_level: 'intermediate',
  cuisine_preferences: ['Italian', 'Mediterranean'],
  dietary_preferences: ['balanced'],
  dietary_restrictions: [],
  allergens: []
};

// Test runner class
export class EnhancedSystemTestRunner {
  private testResults: { [key: string]: any } = {};

  // ✅ Test diversity manager
  async testDiversityManager(): Promise<void> {
    console.log('🧪 Testing Diversity Manager...');
    
    try {
      const diversityManager = createDiversityManager('test-user');
      
      // Test smart combinations generation
      const combinations = await diversityManager.generateSmartCombinations(
        mockPantryItems,
        'lunch',
        mockUserProfile,
        3
      );

      this.testResults.diversityManager = {
        success: true,
        combinationsGenerated: combinations.length,
        hasDiverseIngredients: combinations.length > 0 && combinations[0].ingredients.length >= 3,
        hasNoveltyScore: combinations.length > 0 && combinations[0].noveltyScore >= 0,
        hasNutritionBalance: combinations.length > 0 && combinations[0].nutritionBalance >= 50
      };

      console.log('✅ Diversity Manager Test Results:', this.testResults.diversityManager);

    } catch (error) {
      console.error('❌ Diversity Manager Test Failed:', error);
      this.testResults.diversityManager = { success: false, error: error.message };
    }
  }

  // ✅ Test personalized generator
  async testPersonalizedGenerator(): Promise<void> {
    console.log('🧪 Testing Personalized Generator...');
    
    try {
      const personalizedGenerator = createPersonalizedGenerator('test-user');
      
      // Test personalized meal generation
      const result = await personalizedGenerator.generatePersonalizedMeal(
        'dinner',
        mockPantryItems,
        []
      );

      this.testResults.personalizedGenerator = {
        success: true,
        mealGenerated: !!result.meal,
        hasPersonalizationInsights: !!result.personalizationInsights,
        confidenceScore: result.personalizationInsights?.confidenceScore || 0,
        hasAdaptations: result.personalizationInsights?.adaptations?.length > 0,
        mealName: result.meal?.name,
        ingredientCount: result.meal?.ingredients?.length || 0
      };

      console.log('✅ Personalized Generator Test Results:', this.testResults.personalizedGenerator);

    } catch (error) {
      console.error('❌ Personalized Generator Test Failed:', error);
      this.testResults.personalizedGenerator = { success: false, error: error.message };
    }
  }

  // ✅ Test enhanced generator
  async testEnhancedGenerator(): Promise<void> {
    console.log('🧪 Testing Enhanced Generator...');
    
    try {
      const enhancedGenerator = createEnhancedGenerator('test-user');
      
      // Test enhanced meal generation
      const result = await enhancedGenerator.generateEnhancedMeal(
        'breakfast',
        mockPantryItems,
        mockUserProfile,
        [],
        {
          prioritizeDiversity: true,
          prioritizePersonalization: true,
          allowFallback: true,
          maxAttempts: 2
        }
      );

      this.testResults.enhancedGenerator = {
        success: true,
        mealGenerated: !!result.meal,
        diversityScore: result.diversityScore,
        personalizationScore: result.personalizationScore,
        pantryUtilization: result.pantryUtilization,
        generationMethod: result.generationMethod,
        hasInsights: !!result.insights,
        mealComplexity: result.meal?.difficulty,
        ingredientCount: result.meal?.ingredients?.length || 0
      };

      console.log('✅ Enhanced Generator Test Results:', this.testResults.enhancedGenerator);

    } catch (error) {
      console.error('❌ Enhanced Generator Test Failed:', error);
      this.testResults.enhancedGenerator = { success: false, error: error.message };
    }
  }

  // ✅ Test variety over multiple generations
  async testVarietyOverTime(): Promise<void> {
    console.log('🧪 Testing Variety Over Multiple Generations...');
    
    try {
      const enhancedGenerator = createEnhancedGenerator('test-user');
      const generatedMeals = [];
      
      // Generate 5 consecutive meals
      for (let i = 0; i < 5; i++) {
        const result = await enhancedGenerator.generateEnhancedMeal(
          'lunch',
          mockPantryItems,
          mockUserProfile,
          generatedMeals,
          { maxAttempts: 1, allowFallback: true }
        );
        
        if (result.meal) {
          generatedMeals.push(result.meal);
        }
      }

      // Analyze variety
      const allIngredients = generatedMeals.flatMap(meal => 
        meal.ingredients.map(ing => ing.name.toLowerCase())
      );
      const uniqueIngredients = new Set(allIngredients);
      const varietyScore = uniqueIngredients.size / Math.max(allIngredients.length, 1) * 100;

      this.testResults.varietyOverTime = {
        success: true,
        mealsGenerated: generatedMeals.length,
        totalIngredients: allIngredients.length,
        uniqueIngredients: uniqueIngredients.size,
        varietyScore: Math.round(varietyScore),
        mealNames: generatedMeals.map(meal => meal.name)
      };

      console.log('✅ Variety Over Time Test Results:', this.testResults.varietyOverTime);

    } catch (error) {
      console.error('❌ Variety Over Time Test Failed:', error);
      this.testResults.varietyOverTime = { success: false, error: error.message };
    }
  }

  // ✅ Test fallback scenarios
  async testFallbackScenarios(): Promise<void> {
    console.log('🧪 Testing Fallback Scenarios...');
    
    try {
      const enhancedGenerator = createEnhancedGenerator('test-user');
      
      // Test with minimal pantry
      const minimalPantry: PantryItem[] = [mockPantryItems[0]]; // Only chicken
      
      const result = await enhancedGenerator.generateEnhancedMeal(
        'dinner',
        minimalPantry,
        mockUserProfile,
        [],
        { allowFallback: true, maxAttempts: 1 }
      );

      this.testResults.fallbackScenarios = {
        success: true,
        fallbackWorked: !!result.meal,
        generationMethod: result.generationMethod,
        mealName: result.meal?.name,
        usedFallback: result.generationMethod === 'fallback',
        hasInsights: !!result.insights?.reasoning
      };

      console.log('✅ Fallback Scenarios Test Results:', this.testResults.fallbackScenarios);

    } catch (error) {
      console.error('❌ Fallback Scenarios Test Failed:', error);
      this.testResults.fallbackScenarios = { success: false, error: error.message };
    }
  }

  // ✅ Run all tests
  async runAllTests(): Promise<{ [key: string]: any }> {
    console.log('🚀 Starting Enhanced AI Meal Planning System Tests...\n');
    
    await this.testDiversityManager();
    await this.testPersonalizedGenerator();
    await this.testEnhancedGenerator();
    await this.testVarietyOverTime();
    await this.testFallbackScenarios();
    
    // Summary
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result.success).length;
    const passRate = Math.round((passedTests / totalTests) * 100);
    
    console.log('\n📊 TEST SUMMARY:');
    console.log(`✅ Passed: ${passedTests}/${totalTests} (${passRate}%)`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passRate >= 80) {
      console.log('🎉 Enhanced AI Meal Planning System is working well!');
    } else if (passRate >= 60) {
      console.log('⚠️ Enhanced AI Meal Planning System needs some improvements.');
    } else {
      console.log('🚨 Enhanced AI Meal Planning System has significant issues.');
    }
    
    return {
      summary: {
        totalTests,
        passedTests,
        passRate,
        status: passRate >= 80 ? 'excellent' : passRate >= 60 ? 'good' : 'needs_work'
      },
      details: this.testResults,
      recommendations: this.generateRecommendations()
    };
  }

  // ✅ Generate improvement recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.testResults.diversityManager?.success) {
      recommendations.push('Fix diversity manager issues for better variety');
    }
    
    if (!this.testResults.personalizedGenerator?.success) {
      recommendations.push('Improve personalized generation reliability');
    }
    
    if (this.testResults.varietyOverTime?.varietyScore < 60) {
      recommendations.push('Enhance ingredient rotation algorithms');
    }
    
    if (!this.testResults.fallbackScenarios?.fallbackWorked) {
      recommendations.push('Strengthen fallback meal generation');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System is performing well, consider minor optimizations');
    }
    
    return recommendations;
  }
}

// ✅ Export test runner
export const runEnhancedSystemTests = async () => {
  const testRunner = new EnhancedSystemTestRunner();
  return await testRunner.runAllTests();
};

// ✅ Performance benchmark
export const benchmarkEnhancedSystem = async () => {
  console.log('⚡ Running Performance Benchmark...');
  
  const startTime = Date.now();
  const enhancedGenerator = createEnhancedGenerator('test-user');
  
  // Generate 3 meals and measure time
  const results = [];
  for (const mealType of ['breakfast', 'lunch', 'dinner']) {
    const mealStartTime = Date.now();
    
    try {
      const result = await enhancedGenerator.generateEnhancedMeal(
        mealType,
        mockPantryItems,
        mockUserProfile,
        results,
        { maxAttempts: 1 }
      );
      
      const mealTime = Date.now() - mealStartTime;
      results.push(result.meal);
      
      console.log(`✅ ${mealType}: ${mealTime}ms`);
      
    } catch (error) {
      console.log(`❌ ${mealType}: Failed`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  const averageTime = totalTime / 3;
  
  console.log(`📊 Total time: ${totalTime}ms`);
  console.log(`📊 Average per meal: ${averageTime}ms`);
  
  return {
    totalTime,
    averageTime,
    mealsGenerated: results.length,
    performance: averageTime < 5000 ? 'excellent' : averageTime < 10000 ? 'good' : 'slow'
  };
};