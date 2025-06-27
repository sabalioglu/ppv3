import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface FormData {
  fullName: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
}

interface User {
  id: string;
  email: string;
}

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: 'moderately_active'
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      console.log('🔍 Checking user authentication...');
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('❌ No authenticated user, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      console.log('✅ User authenticated:', user.id);
      setUser(user);
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      router.replace('/(auth)/login');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.age || isNaN(parseInt(formData.age))) {
      Alert.alert('Error', 'Please enter a valid age');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Error', 'Please select your gender');
      return false;
    }
    if (!formData.height || isNaN(parseInt(formData.height))) {
      Alert.alert('Error', 'Please enter a valid height');
      return false;
    }
    if (!formData.weight || isNaN(parseFloat(formData.weight))) {
      Alert.alert('Error', 'Please enter a valid weight');
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in again');
      router.replace('/(auth)/login');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('📝 Saving user profile...');

      const profileData = {
        id: user.id,
        email: user.email,
        full_name: formData.fullName.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        height_cm: parseInt(formData.height),
        weight_kg: parseFloat(formData.weight),
        activity_level: formData.activityLevel,
        health_goals: ['weight_loss'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('user_profiles').upsert(profileData);

      if (error) throw error;

      console.log('✅ Profile saved successfully');
      console.log('🚀 Navigating to dashboard...');

      // Direct navigation - no session refresh needed
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('❌ Profile save failed:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ textAlign: 'center', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>🍽 Complete Your Profile</Text>
        <Text style={styles.subtitle}>Help us personalize your experience</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
              style={styles.input}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              placeholder="Enter your age"
              value={formData.age}
              onChangeText={(text) => setFormData({...formData, age: text})}
              style={styles.input}
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
                placeholder="170"
                value={formData.height}
                onChangeText={(text) => setFormData({...formData, height: text})}
                style={styles.input}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Weight (kg) *</Text>
              <TextInput
                placeholder="70"
                value={formData.weight}
                onChangeText={(text) => setFormData({...formData, weight: text})}
                style={styles.input}
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
          onPress={handleComplete}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Complete Profile →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
    marginTop: 20
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6b7280'
  },
  form: {
    marginBottom: 30
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    fontSize: 16,
    minHeight: 44
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  row: {
    flexDirection: 'row',
    gap: 15
  },
  halfWidth: {
    flex: 1
  },
  button: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af'
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});