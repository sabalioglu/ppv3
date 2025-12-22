import { supabase } from '@/lib/supabase';

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('User profile not found');
    return data;
  } catch (err: Error | any) {
    throw new Error('Error fetching user profile:' + err.message);
  }
};

export const getTodaysIntake = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    if (error) throw error;

    if (!data?.length) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return data.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  } catch (err: Error | any) {
    throw new Error("Error fetching today's intake: " + err.message);
  }
};
