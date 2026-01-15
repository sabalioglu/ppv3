import { useEffect, useState } from 'react';
import { deleteMealById, getDailyMeals } from '@/services/nutritionService';
import { Meal } from '@/components/nutrition/MealCard';
import { formatISODate } from '@/lib/nutrition/dates';

export const useDailyMeals = (date: Date, userId?: string) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        setLoading(true);
        const mealsData = await getDailyMeals(userId, formatISODate(date));
        setMeals(mealsData);
      } catch (e: Error | any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, date]);

  const deleteMeal = async (mealId: string) => {
    let snapshot: Meal[] = [];

    setMeals((prev) => {
      snapshot = prev;
      return prev.filter((meal) => meal.id !== mealId);
    });
    try {
      await deleteMealById(mealId);
    } catch (e: Error | any) {
      setMeals(snapshot);
      setError(`Failed to delete meal: ${e.message}`);
    }
  };

  return { meals, loading, error, deleteMeal };
};
