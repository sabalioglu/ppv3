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
