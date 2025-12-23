import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/services/userService';

export interface UserPreferences {
  dietary_restrictions: string[];
  cuisine_preferences: string[];
  cooking_time: 'quick' | 'medium' | 'long' | 'any';
  meal_complexity: 'simple' | 'moderate' | 'complex' | 'any';
  spice_level: 'mild' | 'medium' | 'hot' | 'any';
  allergies: string[];
  disliked_ingredients: string[];
  preferred_meal_types: string[];
  serving_size: number;
  budget_range: 'budget' | 'moderate' | 'premium' | 'any';
  cooking_equipment: string[];
  meal_prep_friendly: boolean;
  family_friendly: boolean;
}

export interface UserProfile extends UserPreferences {
  id: string;
  full_name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  activity_level:
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extra_active';
  health_goals_macros: string[];
  health_goals_micros: string[];
  daily_calories: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { session } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!session?.user) return;

        const profile = await getUserProfile(session.user.id);
        setUserProfile(profile);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [session?.user?.id]);

  return { userProfile, loading };
};
