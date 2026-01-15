import { useEffect, useState } from 'react';
import { getDailyIntake } from '@/services/nutritionService';
import { formatISODate } from '@/lib/nutrition/dates';

export const useDailyMacroIntake = (date: Date, userId?: string) => {
  const [intake, setIntake] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDailyIntake(userId, formatISODate(date));
        setIntake(data);
      } catch (e: Error | any) {
        console.error(e.message);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, date]);

  return { intake, setIntake, loading, error };
};
