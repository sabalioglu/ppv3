import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { addWaterLog } from '@/services/nutritionService';
import { formatISODate } from '@/lib/nutrition/dates';

interface UseWaterProps {
  userId?: string | null;
  percentage: number;
  selectedDate: Date;
  onWaterAdded: (amount: number) => void;
}

export function useWater({
  userId,
  percentage,
  selectedDate,
  onWaterAdded,
}: UseWaterProps) {
  const [celebrated, setCelebrated] = useState(false);
  const [loadingWater, setLoading] = useState(false);
  const [errorWater, setError] = useState<string | null>(null);

  // animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (percentage >= 100) {
      triggerCelebration();
      setCelebrated(true);
    }
  }, [percentage]);

  const triggerCelebration = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1800);
    });
  };

  const addWater = async (amount: number) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      onWaterAdded(amount);

      if (!celebrated && percentage >= 100) {
        triggerCelebration();
        setCelebrated(true);
      }

      await addWaterLog({
        userId,
        date: formatISODate(selectedDate),
        amount,
      });
    } catch (e: Error | any) {
      console.error(e.message);
      setError(e.message);
      onWaterAdded(-amount);
    } finally {
      setLoading(false);
    }
  };

  return {
    loadingWater,
    errorWater,
    addWater,
    fadeAnim,
    scaleAnim,
    showCelebration: celebrated,
  };
}
