import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isReady: boolean;
  isProfileComplete: boolean;
  checkProfileCompletion: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  isReady: false,
  isProfileComplete: false,
  checkProfileCompletion: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const checkProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(
          'full_name, age, gender, height_cm, weight_kg, activity_level, health_goals'
        )
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      const complete = !!(
        profile?.full_name &&
        profile?.age &&
        profile?.gender &&
        profile?.height_cm &&
        profile?.weight_kg &&
        profile?.activity_level &&
        profile?.health_goals
      );
      setIsProfileComplete(complete);
    } catch (err) {
      console.error('Profile check failed', err);
      setIsProfileComplete(false);
    } finally {
      console.log('Profile check completed', isReady);
    }
  };

  useEffect(() => {
    const init = async () => {
      // simulate a delay, e.g. for an API request
      await new Promise((res) => setTimeout(() => res(null), 1000));
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentSession = data.session;
        setSession(currentSession ?? null);

        if (currentSession?.user?.id) {
          await checkProfile(currentSession.user.id);
        }
      } catch (err) {
        console.error('Auth init failed', err);
      } finally {
        setIsReady(true);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setTimeout(async () => {
          setSession(newSession ?? null);
          if (event === 'SIGNED_IN' && newSession?.user?.id) {
            await checkProfile(newSession.user.id);
            setIsReady(true);
          }
        }, 1000);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const checkProfileCompletion = async () => {
    if (session?.user?.id) {
      await checkProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, isReady, isProfileComplete, checkProfileCompletion }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
