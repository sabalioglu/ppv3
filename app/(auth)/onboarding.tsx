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

console.log('🔥 YENİ ONBOARDING AKTIF - v2.0 STEP SYSTEM');

interface FormData {
  fullName: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
  healthGoals: string[];
  dietaryRestrictions: string[];
  dietaryPreferences: string[];
  cuisinePreferences: string[];
  cookingSkillLevel: string;
}

interface User {
  id: string;
  email: string;
}

// Static data arrays - Top choices for better UX
const HEALTH_GOALS = [
  { key: 'weight_loss', label: '🏃‍♀️ Weight Loss' },
  { key: 'muscle_gain', label: '💪 Muscle Gain' },
  { key: 'maintain_weight', label: '⚖️ Maintain Weight' },
  { key: 'improve_health', label: '❤️ Improve Health' },
  { key: 'energy_boost', label: '⚡ Energy Boost' },
  { key: 'better_sleep', label: '🛌 Better Sleep' },
  { key: 'stress_relief', label: '🧘 Stress Relief' },
  { key: 'digestive_health', label: '🌿 Digestive Health' },
  { key: 'mental_clarity', label: '🧠 Mental Clarity' },
  { key: 'skin_health', label: '✨ Skin Health' },
  { key: 'hormonal_balance', label: '🔄 Hormonal Balance' },
  { key: 'heart_health', label: '❤️‍🩹 Heart Health' },
  { key: 'immune_support', label: '🛡️ Immune Support' },
  { key: 'bone_strength', label: '🦴 Bone Strength' },
  { key: 'anti_aging', label: '⏳ Anti-Aging' },
  { key: 'blood_sugar_control', label: '🍭 Blood Sugar Control' },
  { key: 'cholesterol_control', label: '🩸 Cholesterol Control' }
];

const DIETARY_PREFERENCES = [
  { key: 'vegan', label: '🌱 Vegan' },
  { key: 'vegetarian', label: '🥬 Vegetarian' },
  { key: 'pescatarian', label: '🐟 Pescatarian' },
  { key: 'keto', label: '🥑 Ketogenic' },
  { key: 'paleo', label: '🦴 Paleo' },
  { key: 'mediterranean', label: '🫒 Mediterranean' },
  { key: 'low_carb', label: '🥩 Low Carb' },
  { key: 'gluten_free', label: '🌾 Gluten Free' },
  { key: 'dairy_free', label: '🥛 Dairy Free' },
  { key: 'low_fat', label: '🍃 Low Fat' },
  { key: 'raw_food', label: '🥗 Raw Food' },
  { key: 'flexitarian', label: '🍽️ Flexitarian' },
  { key: 'whole30', label: '🧘 Whole30' },
  { key: 'dash', label: '💓 DASH' },
  { key: 'fodmap', label: '🚫 FODMAP' },
  { key: 'carnivore', label: '🥓 Carnivore' },
  { key: 'halal', label: '🕌 Halal' },
  { key: 'kosher', label: '✡️ Kosher' },
  { key: 'intermittent_fasting', label: '⏱️ Intermittent Fasting' },
  { key: 'diabetic_friendly', label: '🩸 Diabetic-Friendly' }
];

const CUISINE_PREFERENCES = [
  { key: 'italian', label: '🇮🇹 Italian' },
  { key: 'chinese', label: '🇨🇳 Chinese' },
  { key: 'japanese', label: '🇯🇵 Japanese' },
  { key: 'turkish', label: '🇹🇷 Turkish' },
  { key: 'mexican', label: '🇲🇽 Mexican' },
  { key: 'indian', label: '🇮🇳 Indian' },
  { key: 'french', label: '🇫🇷 French' },
  { key: 'thai', label: '🇹🇭 Thai' },
  { key: 'greek', label: '🇬🇷 Greek' },
  { key: 'korean', label: '🇰🇷 Korean' },
  { key: 'spanish', label: '🇪🇸 Spanish' },
  { key: 'vietnamese', label: '🇻🇳 Vietnamese' },
  { key: 'lebanese', label: '🇱🇧 Lebanese' },
  { key: 'german', label: '🇩🇪 German' },
  { key: 'brazilian', label: '🇧🇷 Brazilian' },
  { key: 'moroccan', label: '🇲🇦 Moroccan' },
  { key: 'ethiopian', label: '🇪🇹 Ethiopian' },
  { key: 'russian', label: '🇷🇺 Russian' },
  { key: 'american', label: '🇺🇸 American' },
  { key: 'peruvian', label: '🇵🇪 Peruvian' }
];

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    healthGoals: [], 
    dietaryRestrictions: [],
    dietaryPreferences: [],
    cuisinePreferences: [],
    cookingSkillLevel: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
  try {
    console.log('🔍 Getting current user for onboarding...');
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('⚠️ User not found in onboarding, redirecting...');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1000);
      return;
    }

    console.log('✅ User found in onboarding:', user.id);
    setUser(user);
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 1000);
  }
};


  const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
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
      return true;
    case 2:
      if (!formData.height || isNaN(parseInt(formData.height))) {
        Alert.alert('Error', 'Please enter a valid height');
        return false;
      }
      if (!formData.weight || isNaN(parseFloat(formData.weight))) {
        Alert.alert('Error', 'Please enter a valid weight');
        return false;
      }
      if (!formData.activityLevel) {
        Alert.alert('Error', 'Please select your activity level');
        return false;
      }
      return true;
    case 6:
      if (!formData.cookingSkillLevel) {
        Alert.alert('Error', 'Please select your cooking skill level');
        return false;
      }
      return true;
    default:
      return true;
  }
};


  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const toggleSelection = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in again');
      router.replace('/(auth)/login');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Saving enhanced user profile...');

      const profileData = {
        id: user.id,
        email: user.email,
        full_name: formData.fullName.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        height_cm: parseInt(formData.height),
        weight_kg: parseFloat(formData.weight),
        activity_level: formData.activityLevel,
        health_goals: formData.healthGoals,
        dietary_restrictions: formData.dietaryRestrictions,
        dietary_preferences: formData.dietaryPreferences,
        cuisine_preferences: formData.cuisinePreferences,
        cooking_skill_level: formData.cookingSkillLevel
        // daily_calorie_goal, daily_protein_goal, etc. otomatik hesaplanacak (trigger ile)
        // notification_settings, streak_days, created_at, updated_at otomatik atanacak
      };

      const { error } = await supabase.from('user_profiles').upsert(profileData);

      if (error) throw error;

      console.log('✅ Enhanced profile saved successfully');
      console.log('🚀 Navigating to dashboard...');

      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('❌ Profile save failed:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>👋 Basic Information</Text>
      
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

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            placeholder="Your Age"
            value={formData.age}
            onChangeText={(text) => setFormData({...formData, age: text})}
            style={styles.input}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.gender}
              style={styles.picker}
              onValueChange={(value) => setFormData({...formData, gender: value})}
            >
              <Picker.Item label="Select" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>📏 Physical Stats</Text>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Height (cm) *</Text>
          <TextInput
            placeholder="Height in cm"
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
            placeholder="Weight in kg"
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
            <Picker.Item label="Select activity level" value="" />
            <Picker.Item label="Sedentary (little exercise)" value="sedentary" />
            <Picker.Item label="Lightly Active (1-3 days/week)" value="lightly_active" />
            <Picker.Item label="Moderately Active (3-5 days/week)" value="moderately_active" />
            <Picker.Item label="Very Active (6-7 days/week)" value="very_active" />
            <Picker.Item label="Extra Active (very intense)" value="extra_active" />
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>🎯 Health Goals</Text>
      <Text style={styles.stepSubtitle}>What are your main goals?</Text>
      
      <View style={styles.optionsGrid}>
        {HEALTH_GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.key}
            style={[
              styles.optionCard,
              formData.healthGoals.includes(goal.key) && styles.optionCardSelected
            ]}
            onPress={() => toggleSelection(
              formData.healthGoals, 
              goal.key, 
              (arr) => setFormData({...formData, healthGoals: arr})
            )}
          >
            <Text style={styles.optionText}>{goal.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>🥗 Dietary Preferences</Text>
      <Text style={styles.stepSubtitle}>Select any that apply (optional)</Text>
      
      <View style={styles.optionsGrid}>
        {DIETARY_PREFERENCES.map((pref) => (
          <TouchableOpacity
            key={pref.key}
            style={[
              styles.optionCard,
              formData.dietaryPreferences.includes(pref.key) && styles.optionCardSelected
            ]}
            onPress={() => toggleSelection(
              formData.dietaryPreferences, 
              pref.key, 
              (arr) => setFormData({...formData, dietaryPreferences: arr})
            )}
          >
            <Text style={styles.optionText}>{pref.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>🍽 Favorite Cuisines</Text>
      <Text style={styles.stepSubtitle}>What cuisines do you enjoy?</Text>
      
      <View style={styles.optionsGrid}>
        {CUISINE_PREFERENCES.map((cuisine) => (
          <TouchableOpacity
            key={cuisine.key}
            style={[
              styles.optionCard,
              formData.cuisinePreferences.includes(cuisine.key) && styles.optionCardSelected
            ]}
            onPress={() => toggleSelection(
              formData.cuisinePreferences, 
              cuisine.key, 
              (arr) => setFormData({...formData, cuisinePreferences: arr})
            )}
          >
            <Text style={styles.optionText}>{cuisine.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>👨‍🍳 Cooking Experience</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Cooking Skill Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
           selectedValue={formData.cookingSkillLevel}
  style={styles.picker}
  onValueChange={(value) => setFormData({...formData, cookingSkillLevel: value})}
>
  <Picker.Item label="Select your skill level" value="" />
  <Picker.Item label="🌱 Beginner" value="beginner" />
  <Picker.Item label="🍳 Intermediate" value="intermediate" />
  <Picker.Item label="👨‍🍳 Advanced" value="advanced" />
  <Picker.Item label="⭐ Expert" value="expert" />
          </Picker>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>🎉 Almost Done!</Text>
        <Text style={styles.summaryText}>
          We'll calculate your daily nutrition goals automatically based on your information.
        </Text>
      </View>
    </View>
  );

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
        <View style={styles.header}>
          <Text style={styles.title}>🍽 Complete Your Profile</Text>
          <Text style={styles.subtitle}>Step {currentStep} of 6</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 6) * 100}%` }]} />
          </View>
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}

        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 6 ? (
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleComplete}
              style={[styles.completeButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.completeButtonText}>Complete Profile 🚀</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
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
  header: {
    marginBottom: 30,
    marginTop: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: '#6b7280'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2
  },
  form: {
    marginBottom: 30
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center'
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '45%',
    borderWidth: 2,
    borderColor: '#e5e7eb'
  },
  optionCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4'
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center'
  },
  summaryCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#10b981'
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center'
  },
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600'
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center'
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af'
  }
});