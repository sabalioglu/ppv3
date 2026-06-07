import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { configurePurchases, logOutPurchases } from '@/lib/purchases';

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
        .select('full_name, age, gender, height_cm, weight_kg, activity_level')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // health_goals_macros dropped from onboarding; completeness now keys off
      // the basic + physical fields that are still collected.
      const complete = !!(
        profile?.full_name &&
        profile?.age &&
        profile?.gender &&
        profile?.height_cm &&
        profile?.weight_kg &&
        profile?.activity_level
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
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentSession = data.session;
        setSession(currentSession ?? null);

        if (currentSession?.user?.id) {
          await configurePurchases(currentSession.user.id);
          await checkProfile(currentSession.user.id);
        } else {
          await configurePurchases();
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
        // Update session state synchronously; defer any further Supabase calls
        // to the next tick — calling supabase methods directly inside this
        // callback can deadlock the auth client (documented constraint).
        setSession(newSession ?? null);
        setTimeout(async () => {
          if (event === 'SIGNED_IN' && newSession?.user?.id) {
            await configurePurchases(newSession.user.id);
            await checkProfile(newSession.user.id);
            setIsReady(true);
          } else if (event === 'SIGNED_OUT') {
            await logOutPurchases();
          }
        }, 0);
      },
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
