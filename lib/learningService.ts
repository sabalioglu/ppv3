// lib/learningService.ts - FIXED VERSION
import { supabase } from './supabase';
import { ReceiptLearning, UserFeedback, ParsedItem, FoodPattern } from '../types/learning';

export class ReceiptLearningService {
  
  // Save receipt learning data
  static async saveReceiptLearning(data: ReceiptLearning): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: result, error } = await supabase
        .from('receipt_learning')
        .insert([{
          user_id: user.id,
          original_text: data.original_text,
          store_name: data.store_name,
          store_format: data.store_format,
          parsed_items: data.parsed_items,
          confirmed_items: data.confirmed_items,
          rejected_items: data.rejected_items,
          accuracy_score: data.accuracy_score,
          processing_time: data.processing_time,
          receipt_total: data.receipt_total,
          items_count: data.items_count,
          image_url: data.image_url,
          parsing_method: data.parsing_method || 'ai_vision'
        }])
        .select('id')
        .single();

      if (error) throw error;
      return result?.id || null;
    } catch (error) {
      console.error('Error saving receipt learning:', error);
      return null;
    }
  }

  // Get food patterns for improved parsing
  static async getFoodPatterns(): Promise<FoodPattern[]> {
    try {
      const { data, error } = await supabase
        .from('food_patterns')
        .select('*')
        .eq('is_food', true)
        .order('confidence_score', { ascending: false })
        .limit(100);

      if (error) throw error;
      console.log('✅ Loaded food patterns:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching food patterns:', error);
      return [];
    }
  }

  // 🔧 FIXED: Update pattern performance without SQL functions
  static async updatePatternPerformance(
    pattern: string, 
    success: boolean, 
    storeFormat?: string
  ): Promise<void> {
    try {
      // First, get current pattern data
      const { data: currentPattern, error: fetchError } = await supabase
        .from('food_patterns')
        .select('usage_count, success_count')
        .eq('pattern', pattern.toUpperCase())
        .single();

      if (fetchError) {
        console.log('Pattern not found, skipping update:', pattern);
        return;
      }

      // Calculate new values
      const newUsageCount = (currentPattern.usage_count || 0) + 1;
      const newSuccessCount = (currentPattern.success_count || 0) + (success ? 1 : 0);

      // Update with calculated values
      const { error: updateError } = await supabase
        .from('food_patterns')
        .update({
          usage_count: newUsageCount,
          success_count: newSuccessCount,
          last_used: new Date().toISOString()
        })
        .eq('pattern', pattern.toUpperCase());

      if (updateError) {
        console.error('Error updating pattern performance:', updateError);
      }
    } catch (error) {
      console.error('Error in updatePatternPerformance:', error);
    }
  }

  // Get store format patterns
  static async getStoreFormat(storeName: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('store_formats')
        .select('*')
        .ilike('store_name', `%${storeName}%`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error fetching store format:', error);
      return null;
    }
  }

  // 🆕 ADD TO PANTRY - Real Supabase Integration
  static async addItemsToPantry(items: ParsedItem[]): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const pantryItems = items.map(item => ({
        user_id: user.id,
        name: item.name,
        category: item.category || 'food',
        quantity: item.quantity || 1,
        cost: item.price,
        purchase_date: new Date().toISOString().split('T')[0],
        recognition_source: 'ai_receipt',
        ai_confidence: item.confidence || 50,
        location: 'pantry'
      }));

      const { data, error } = await supabase
        .from('pantry_items')
        .insert(pantryItems)
        .select();

      if (error) throw error;
      console.log('✅ Added to pantry:', data?.length || 0, 'items');
      return true;
    } catch (error) {
      console.error('❌ Error adding to pantry:', error);
      return false;
    }
  }

  // Save user feedback session
  static async saveFeedbackSession(
    receiptLearningId: string, 
    feedbackData: UserFeedback[], 
    sessionStats: any
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('receipt_feedback_sessions')
        .insert([{
          user_id: user.id,
          receipt_learning_id: receiptLearningId,
          feedback_data: feedbackData,
          session_duration: sessionStats.duration,
          items_confirmed: sessionStats.confirmed,
          items_rejected: sessionStats.rejected,
          items_edited: sessionStats.edited,
          new_items_added: sessionStats.added,
          completion_status: sessionStats.completed ? 'completed' : 'partial'
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving feedback session:', error);
      return false;
    }
  }

  // Update user learning stats
  static async updateUserStats(userId: string, feedbackStats: any): Promise<void> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const statsData = {
        user_id: userId,
        total_receipts: (existing?.total_receipts || 0) + 1,
        total_feedback_provided: (existing?.total_feedback_provided || 0) + feedbackStats.totalFeedback,
        total_corrections: (existing?.total_corrections || 0) + feedbackStats.corrections,
        total_confirmations: (existing?.total_confirmations || 0) + feedbackStats.confirmations,
        total_rejections: (existing?.total_rejections || 0) + feedbackStats.rejections,
        contribution_score: (existing?.contribution_score || 0) + feedbackStats.points
      };

      const { error } = await supabase
        .from('user_learning_stats')
        .upsert([statsData]);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }
}
