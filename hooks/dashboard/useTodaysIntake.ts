import { useEffect, useState } from 'react';
import { getTodaysIntake } from '@/services/userService';

export const useTodaysMacroIntake = (userId?: string) => {
  const [intake, setIntake] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const load = async () => {
      try {
        const data = await getTodaysIntake(userId);
        setIntake(data);
      } catch (e) {
        console.error("Failed to load today's intake", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  return { intake, loading };
};
