import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function OnboardingRoute() {
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: 'moderately_active',
    healthGoals: ['weight_loss']
  });

  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // CRITICAL FIX: getSession() → getUser() for reliable authentication
  const checkAuth = async () => {
    try {
      console.log('🔍 Starting checkAuth in onboarding...');
      
      // Use getUser() instead of getSession() - more reliable for client-side auth
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ getUser error:', error);
        router.replace('/(auth)/login');
        return;
      }
      
      if (user) {
        console.log('✅ User found in onboarding:', user.id);
        setUserId(user.id);
        
        // Check if profile is already complete
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('age, gender, height_cm, weight_kg, activity_level, health_goals')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && profile.age && profile.gender && profile.height_cm && 
            profile.weight_kg && profile.activity_level && profile.health_goals) {
          console.log('✅ Profile already complete, redirecting to app');
          router.replace('/(tabs)');
        }
      } else {
        console.log('🚫 No user found in checkAuth, redirecting to login');
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      router.replace('/(auth)/login');
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name.');
      return false;
    }
    if (!formData.age || isNaN(parseInt(formData.age)) || parseInt(formData.age) <= 0) {
      Alert.alert('Error', 'Please enter a valid age.');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Error', 'Please select your gender.');
      return false;
    }
    if (!formData.height || isNaN(parseInt(formData.height)) || parseInt(formData.height) <= 0) {
      Alert.alert('Error', 'Please enter a valid height (cm).');
      return false;
    }
    if (!formData.weight || isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight (kg).');
      return false;
    }
    if (!userId) {
      Alert.alert('Error', 'User session not found. Please sign in again.');
      router.replace('/(auth)/login');
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    try {
      console.log('✅ Starting onboarding completion...');

      // SAFETY CHECK: Double-check user authentication before proceeding
      if (!userId) {
        console.log('🔍 userId is empty, attempting to get user again...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          console.log('✅ userId recovered:', user.id);
        } else {
          Alert.alert('Error', 'User session not found. Please sign in again.');
          router.replace('/(auth)/login');
          return;
        }
      }

      if (!validateForm()) {
        return;
      }

      setLoading(true);

      // 1. Update profile in Supabase
      const updateData = {
        full_name: formData.fullName.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        height_cm: parseInt(formData.height),
        weight_kg: parseFloat(formData.weight),
        activity_level: formData.activityLevel,
        health_goals: formData.healthGoals,
        updated_at: new Date().toISOString()
      };

      console.log('📤 Updating profile with:', updateData);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Profile update error:', updateError);
        throw updateError;
      }

      console.log('✅ Profile updated successfully');

      // 2. Refresh Supabase session (Official Supabase AI approved solution)
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        throw refreshError;
      }

      console.log('✅ Session refreshed successfully');

      // 3. Navigate to dashboard
      router.replace('/(tabs)');
      console.log('✅ Navigation completed');

    } catch (error: any) {
      console.error('❌ Onboarding completion error:', error);
      Alert.alert(
        'Error',
        'There was a problem updating your profile. Please try again.',
        [
          { text: 'Try Again', style: 'cancel' },
          { 
            text: 'Continue Anyway', 
            onPress: () => {
              // Fallback navigation (guaranteed to work)
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              } else {
                router.replace('/(tabs)');
              }
            },
            style: 'destructive' 
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🍽 Complete Your Profile</Text>
      <Text style={styles.subtitle}>A few more details for personalized experience</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={formData.fullName}
            onChangeText={(text) => setFormData({...formData, fullName: text})}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={formData.age}
            onChangeText={(text) => setFormData({...formData, age: text})}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.gender}
              style={styles.picker}
              onValueChange={(value) => setFormData({...formData, gender: value})}
            >
              <Picker.Item label="Select gender" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Prefer not to say" value="prefer_not_to_say" />
            </Picker>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Height (cm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="170"
              value={formData.height}
              onChangeText={(text) => setFormData({...formData, height: text})}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              placeholder="70"
              value={formData.weight}
              onChangeText={(text) => setFormData({...formData, weight: text})}
              keyboardType="decimal-pad"
              maxLength={5}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.activityLevel}
              style={styles.picker}
              onValueChange={(value) => setFormData({...formData, activityLevel: value})}
            >
              <Picker.Item label="Sedentary (little or no exercise)" value="sedentary" />
              <Picker.Item label="Lightly Active (1-3 days/week)" value="lightly_active" />
              <Picker.Item label="Moderately Active (3-5 days/week)" value="moderately_active" />
              <Picker.Item label="Very Active (6-7 days/week)" value="very_active" />
              <Picker.Item label="Extra Active (very intense exercise)" value="extra_active" />
            </Picker>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Complete Profile →</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1f2937',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 44,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
