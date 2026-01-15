import { formatTimeFromISO } from '@/lib/nutrition/dates';
import { supabase } from '@/lib/supabase';

const emptyIntake = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  water: 0,
};

export const getDailyIntake = async (
  userId: string,
  date: string // 'YYYY-MM-DD'
) => {
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;

  if (!data?.length) return { ...emptyIntake };

  return data.reduce((acc, log) => {
    if (log.meal_type === 'water') {
      acc.water += log.quantity ?? 0;
    } else {
      acc.calories += log.calories ?? 0;
      acc.protein += log.protein ?? 0;
      acc.carbs += log.carbs ?? 0;
      acc.fat += log.fat ?? 0;
    }
    return acc;
  }, emptyIntake);
};

export const getDailyMeals = async (userId: string, date: string) => {
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .neq('meal_type', 'water')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return data.map((log) => ({
    id: log.id,
    mealType: log.meal_type,
    time: formatTimeFromISO(log.created_at),
    foodName: log.food_name,
    calories: log.calories ?? 0,
    protein: log.protein ?? 0,
    carbs: log.carbs ?? 0,
    fat: log.fat ?? 0,
    source: log.source ?? 'manual',
  }));
};

export const deleteMealById = async (mealId: string) => {
  const { error } = await supabase
    .from('nutrition_logs')
    .delete()
    .eq('id', mealId);

  if (error) throw error;
};

export const addWaterLog = async ({
  userId,
  date,
  amount,
}: {
  userId: string;
  date: string;
  amount: number;
}): Promise<void> => {
  const { error } = await supabase.from('nutrition_logs').insert({
    user_id: userId,
    date: date,
    meal_type: 'water',
    food_name: 'Water',
    quantity: amount,
    unit: 'ml',
  });

  if (error) {
    throw error;
  }
};

export interface NutritionLog {
  date: string;
  calories: number | null;
}

export async function getWeeklyNutritionLogs(
  userId: string,
  dates: string[]
): Promise<NutritionLog[]> {
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('date, calories')
    .eq('user_id', userId)
    .in('date', dates)
    .neq('meal_type', 'water');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
