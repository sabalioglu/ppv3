import { useEffect, useState } from 'react';
import { formatISODate } from '@/lib/nutrition/dates';
import { getWeeklyNutritionLogs } from '@/services/nutritionService';

// Returns the last 7 days (oldest → newest) as ISO strings
function getLast7Days(selectedDate: Date): string[] {
  const days: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - i);
    days.push(formatISODate(d));
  }

  return days;
}

export function useWeeklyProgress(selectedDate: Date, userId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todayISO = formatISODate(new Date());
  const selectedISO = formatISODate(selectedDate);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const days = getLast7Days(selectedDate);
        const logs = await getWeeklyNutritionLogs(userId, days);

        // Aggregate calories per day
        const totals: Record<string, number> = {};
        logs.forEach((log) => {
          totals[log.date] = (totals[log.date] || 0) + (log.calories ?? 0);
        });

        const chartData = days.map((dateStr) => {
          const dateObj = new Date(dateStr);

          let label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

          if (dateStr === todayISO) {
            label = 'Today';
          } else if (dateStr === selectedISO) {
            label = 'Selected';
          }

          return {
            day: label,
            calories: Math.round(totals[dateStr] || 0),
            isSelected: dateStr === selectedISO || dateStr === todayISO,
          };
        });

        setData(chartData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, selectedDate]);

  return {
    weeklyProgress: data,
    loading,
    error,
  };
}
