import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

interface OnboardingScreenProps {
  userId: string;
  onComplete: (signupData?: any) => void;
  isSignupFlow?: boolean;
}

const { width } = Dimensions.get('window');

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ 
  userId, 
  onComplete,
  isSignupFlow = false 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form data - email ve password ekleyelim signup flow için
  const [formData, setFormData] = useState({
    // Signup fields (only for signup flow)
    email: '',
    password: '',
    
    // Basic info
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    
    // Multi-select arrays
    healthGoals: [] as string[],
    dietaryPreferences: [] as string[],
    allergies: [] as string[],
    cuisines: [] as string[],
    
    // Single selects
    cookingExperience: '',
    preferredCookTime: ''
  });

  // Quiz steps - signup flow için email/password adımı ekleyelim
  const STEPS = isSignupFlow ? [
    { id: 'account', title: 'Create Account', emoji: '📧' },
    { id: 'personal', title: 'Personal Info', emoji: '👤' },
    { id: 'activity', title: 'Activity Level', emoji: '🏃‍♂️' },
    { id: 'goals', title: 'Health Goals', emoji: '🎯' },
    { id: 'dietary', title: 'Dietary Preferences', emoji: '🍽️' },
    { id: 'cooking', title: 'Cooking Style', emoji: '👩‍🍳' },
    { id: 'cuisines', title: 'Favorite Cuisines', emoji: '🌍' }
  ] : [
    { id: 'personal', title: 'Personal Info', emoji: '👤' },
    { id: 'activity', title: 'Activity Level', emoji: '🏃‍♂️' },
    { id: 'goals', title: 'Health Goals', emoji: '🎯' },
    { id: 'dietary', title: 'Dietary Preferences', emoji: '🍽️' },
    { id: 'cooking', title: 'Cooking Style', emoji: '👩‍🍳' },
    { id: 'cuisines', title: 'Favorite Cuisines', emoji: '🌍' }
  ];

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof typeof formData, item: string) => {
    const currentArray = formData[key] as string[];
    if (currentArray.includes(item)) {
      updateFormData(key, currentArray.filter(i => i !== item));
    } else {
      updateFormData(key, [...currentArray, item]);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    // Validation
    if (!formData.fullName || !formData.age || !formData.gender || 
        !formData.height || !formData.weight || !formData.activityLevel) {
      Alert.alert('Missing Information', 'Please complete all required fields.');
      setCurrentStep(isSignupFlow ? 1 : 0); // Go to personal info step
      return;
    }

    // For signup flow, validate email and password
    if (isSignupFlow && (!formData.email || !formData.password)) {
      Alert.alert('Missing Information', 'Please provide email and password.');
      setCurrentStep(0); // Go to account step
      return;
    }

    setLoading(true);

    try {
      if (isSignupFlow) {
        // Create account first
        console.log('📝 Creating account...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create profile
          const profileData = {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName.trim(),
            age: parseInt(formData.age),
            gender: formData.gender,
            height_cm: parseInt(formData.height),
            weight_kg: parseFloat(formData.weight),
            activity_level: formData.activityLevel,
            health_goals: formData.healthGoals,
            dietary_preferences: formData.dietaryPreferences,
            dietary_restrictions: formData.allergies,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([profileData]);

          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
            // Continue anyway - profile can be updated later
          }

          Alert.alert(
            '🎉 Account Created!',
            'Please check your email to verify your account, then sign in.',
            [
              {
                text: 'OK',
                onPress: () => onComplete({ email: formData.email })
              }
            ]
          );
        }
      } else {
        // Update existing profile
        const updateData: any = {
          full_name: formData.fullName.trim(),
          age: parseInt(formData.age),
          gender: formData.gender,
          height_cm: parseInt(formData.height),
          weight_kg: parseFloat(formData.weight),
          activity_level: formData.activityLevel,
          health_goals: formData.healthGoals,
          dietary_preferences: formData.dietaryPreferences,
          dietary_restrictions: formData.allergies,
          updated_at: new Date().toISOString(),
        };

        // Add optional fields if available
        if (formData.cuisines.length > 0) {
          updateData.cuisine_preferences = formData.cuisines;
        }
        if (formData.cookingExperience) {
          updateData.cooking_skill_level = formData.cookingExperience;
        }

        console.log('📤 Updating profile with:', updateData);

        const { error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', userId);

        if (error) {
          console.error('❌ Profile update error:', error);
          throw error;
        }

        console.log('✅ Profile updated successfully');
        
        Alert.alert(
          '🎉 Welcome to AI Food Pantry!',
          'Your profile is all set up. Let\'s start your nutrition journey!',
          [
            {
              text: 'OK',
              onPress: () => onComplete()
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error completing onboarding:', error);
      Alert.alert(
        'Setup Error',
        error.message || 'We couldn\'t save your profile. Please try again.',
        [
          {
            text: 'Try Again',
            style: 'cancel'
          },
          {
            text: 'Continue Anyway',
            onPress: () => onComplete(),
            style: 'destructive'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / STEPS.length) * 100}%` }
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep + 1} of {STEPS.length}
      </Text>
    </View>
  );

  const renderAccountCreation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Create Your Account 📧</Text>
      <Text style={styles.stepSubtitle}>Start your nutrition journey</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password (min 6 characters)"
          value={formData.password}
          onChangeText={(value) => updateFormData('password', value)}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.helperText}>
        You'll receive a confirmation email after signup
      </Text>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Let's get to know you! 👋</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={formData.fullName}
          onChangeText={(value) => updateFormData('fullName', value)}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your age"
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(value) => updateFormData('age', value)}
          maxLength={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.gender}
            style={styles.picker}
            onValueChange={(value) => updateFormData('gender', value)}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Prefer not to say" value="prefer_not_to_say" />
          </Picker>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Height (cm) *</Text>
          <TextInput
            style={styles.input}
            placeholder="170"
            keyboardType="numeric"
            value={formData.height}
            onChangeText={(value) => updateFormData('height', value)}
            maxLength={3}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
          <Text style={styles.label}>Weight (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="70"
            keyboardType="decimal-pad"
            value={formData.weight}
            onChangeText={(value) => updateFormData('weight', value)}
            maxLength={5}
          />
        </View>
      </View>
    </View>
  );

  const renderActivityLevel = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How active are you? 🏃‍♂️</Text>
      <Text style={styles.stepSubtitle}>This helps us calculate your daily calorie needs</Text>
      
      {[
        { key: 'sedentary', emoji: '🛋️', title: 'Sedentary', desc: 'Little or no exercise' },
        { key: 'lightly_active', emoji: '🚶‍♂️', title: 'Lightly Active', desc: '1-3 days/week' },
        { key: 'moderately_active', emoji: '🏃‍♂️', title: 'Moderately Active', desc: '3-5 days/week' },
        { key: 'very_active', emoji: '💪', title: 'Very Active', desc: '6-7 days/week' },
        { key: 'extra_active', emoji: '🔥', title: 'Extra Active', desc: 'Very intense exercise' }
      ].map((activity) => (
        <TouchableOpacity
          key={activity.key}
          style={[
            styles.optionCard,
            formData.activityLevel === activity.key && styles.optionCardActive
          ]}
          onPress={() => updateFormData('activityLevel', activity.key)}
        >
          <Text style={styles.optionEmoji}>{activity.emoji}</Text>
          <View style={styles.optionInfo}>
            <Text style={[
              styles.optionTitle,
              formData.activityLevel === activity.key && styles.optionTitleActive
            ]}>
              {activity.title}
            </Text>
            <Text style={styles.optionDesc}>{activity.desc}</Text>
          </View>
          {formData.activityLevel === activity.key && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHealthGoals = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What are your health goals? 🎯</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>
      
      <View style={styles.chipContainer}>
        {[
          { key: 'weight_loss', emoji: '⚖️', label: 'Weight Loss' },
          { key: 'muscle_gain', emoji: '💪', label: 'Muscle Gain' },
          { key: 'maintain_weight', emoji: '🔄', label: 'Maintain Weight' },
          { key: 'improve_energy', emoji: '⚡', label: 'Improve Energy' },
          { key: 'better_digestion', emoji: '💨', label: 'Better Digestion' },
          { key: 'heart_health', emoji: '❤️', label: 'Heart Health' },
          { key: 'blood_sugar', emoji: '🩸', label: 'Blood Sugar Control' },
          { key: 'reduce_inflammation', emoji: '🔥', label: 'Reduce Inflammation' },
          { key: 'boost_immunity', emoji: '🛡️', label: 'Boost Immunity' },
          { key: 'clear_skin', emoji: '✨', label: 'Clear Skin' }
        ].map((goal) => (
          <TouchableOpacity
            key={goal.key}
            style={[
              styles.chip,
              formData.healthGoals.includes(goal.key) && styles.chipActive
            ]}
            onPress={() => toggleArrayItem('healthGoals', goal.key)}
          >
            <Text style={styles.chipEmoji}>{goal.emoji}</Text>
            <Text style={[
              styles.chipLabel,
              formData.healthGoals.includes(goal.key) && styles.chipLabelActive
            ]}>
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDietaryPreferences = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Dietary Preferences & Restrictions 🍽️</Text>
      
      <Text style={styles.sectionTitle}>🥦 Dietary Lifestyle</Text>
      <View style={styles.chipContainer}>
        {[
          { key: 'vegan', emoji: '🥦', label: 'Vegan' },
          { key: 'vegetarian', emoji: '🥗', label: 'Vegetarian' },
          { key: 'pescatarian', emoji: '🐟', label: 'Pescatarian' },
          { key: 'keto', emoji: '🥩', label: 'Ketogenic' },
          { key: 'paleo', emoji: '🥩', label: 'Paleo' },
          { key: 'gluten_free', emoji: '🌾', label: 'Gluten-Free' },
          { key: 'dairy_free', emoji: '🥛', label: 'Dairy-Free' },
          { key: 'halal', emoji: '🕌', label: 'Halal' },
          { key: 'kosher', emoji: '✡️', label: 'Kosher' }
        ].map((pref) => (
          <TouchableOpacity
            key={pref.key}
            style={[
              styles.chip,
              formData.dietaryPreferences.includes(pref.key) && styles.chipActive
            ]}
            onPress={() => toggleArrayItem('dietaryPreferences', pref.key)}
          >
            <Text style={styles.chipEmoji}>{pref.emoji}</Text>
            <Text style={[
              styles.chipLabel,
              formData.dietaryPreferences.includes(pref.key) && styles.chipLabelActive
            ]}>
              {pref.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>⚠️ Allergies</Text>
      <View style={styles.chipContainer}>
        {[
          { key: 'peanuts', emoji: '🥜', label: 'Peanuts' },
          { key: 'tree_nuts', emoji: '🌰', label: 'Tree Nuts' },
          { key: 'dairy', emoji: '🥛', label: 'Dairy' },
          { key: 'eggs', emoji: '🥚', label: 'Eggs' },
          { key: 'gluten', emoji: '🍞', label: 'Gluten' },
          { key: 'soy', emoji: '🌱', label: 'Soy' },
          { key: 'shellfish', emoji: '🦐', label: 'Shellfish' },
          { key: 'fish', emoji: '🐟', label: 'Fish' }
        ].map((allergy) => (
          <TouchableOpacity
            key={allergy.key}
            style={[
              styles.chip,
              formData.allergies.includes(allergy.key) && styles.chipActive
            ]}
            onPress={() => toggleArrayItem('allergies', allergy.key)}
          >
            <Text style={styles.chipEmoji}>{allergy.emoji}</Text>
            <Text style={[
              styles.chipLabel,
              formData.allergies.includes(allergy.key) && styles.chipLabelActive
            ]}>
              {allergy.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCookingPreferences = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Cooking Style 👩‍🍳</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cooking Experience</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.cookingExperience}
            style={styles.picker}
            onValueChange={(value) => updateFormData('cookingExperience', value)}
          >
            <Picker.Item label="Select Experience Level" value="" />
            <Picker.Item label="👶 Beginner" value="beginner" />
            <Picker.Item label="🧑 Intermediate" value="intermediate" />
            <Picker.Item label="👨‍🍳 Advanced" value="advanced" />
            <Picker.Item label="🏡 Home Cook" value="home_cook" />
            <Picker.Item label="⚡ Quick Meals Only" value="quick_meals" />
          </Picker>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>⏱️ Preferred Cook Time</Text>
      {[
        { key: 'under_15', emoji: '⚡', label: 'Under 15 min' },
        { key: 'under_30', emoji: '⏳', label: 'Under 30 min' },
        { key: 'under_60', emoji: '🕒', label: 'Under 1 hour' },
        { key: 'over_60', emoji: '🕰️', label: '1+ hour' }
      ].map((time) => (
        <TouchableOpacity
          key={time.key}
          style={[
            styles.optionCard,
            formData.preferredCookTime === time.key && styles.optionCardActive
          ]}
          onPress={() => updateFormData('preferredCookTime', time.key)}
        >
          <Text style={styles.optionEmoji}>{time.emoji}</Text>
          <Text style={[
            styles.optionTitle,
            formData.preferredCookTime === time.key && styles.optionTitleActive
          ]}>
            {time.label}
          </Text>
          {formData.preferredCookTime === time.key && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCuisines = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Favorite Cuisines 🌍</Text>
      <Text style={styles.stepSubtitle}>Select your preferred cuisines</Text>
      
      <View style={styles.chipContainer}>
        {[
          { key: 'turkish', emoji: '🇹🇷', label: 'Turkish' },
          { key: 'italian', emoji: '🇮🇹', label: 'Italian' },
          { key: 'french', emoji: '🇫🇷', label: 'French' },
          { key: 'chinese', emoji: '🇨🇳', label: 'Chinese' },
          { key: 'japanese', emoji: '🇯🇵', label: 'Japanese' },
          { key: 'indian', emoji: '🇮🇳', label: 'Indian' },
          { key: 'thai', emoji: '🇹🇭', label: 'Thai' },
          { key: 'mexican', emoji: '🇲🇽', label: 'Mexican' },
          { key: 'greek', emoji: '🇬🇷', label: 'Greek' },
          { key: 'korean', emoji: '🇰🇷', label: 'Korean' },
          { key: 'lebanese', emoji: '🇱🇧', label: 'Lebanese' },
          { key: 'spanish', emoji: '🇪🇸', label: 'Spanish' },
          { key: 'american', emoji: '🇺🇸', label: 'American' },
          { key: 'vietnamese', emoji: '🇻🇳', label: 'Vietnamese' },
          { key: 'moroccan', emoji: '🇲🇦', label: 'Moroccan' }
        ].map((cuisine) => (
          <TouchableOpacity
            key={cuisine.key}
            style={[
              styles.chip,
              formData.cuisines.includes(cuisine.key) && styles.chipActive
            ]}
            onPress={() => toggleArrayItem('cuisines', cuisine.key)}
          >
            <Text style={styles.chipEmoji}>{cuisine.emoji}</Text>
            <Text style={[
              styles.chipLabel,
              formData.cuisines.includes(cuisine.key) && styles.chipLabelActive
            ]}>
              {cuisine.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    if (isSignupFlow && currentStep === 0) {
      return renderAccountCreation();
    }
    
    const adjustedStep = isSignupFlow ? currentStep - 1 : currentStep;
    
    switch (adjustedStep) {
      case 0: return renderPersonalInfo();
      case 1: return renderActivityLevel();
      case 2: return renderHealthGoals();
      case 3: return renderDietaryPreferences();
      case 4: return renderCookingPreferences();
      case 5: return renderCuisines();
      default: return renderPersonalInfo();
    }
  };

  const isStepValid = () => {
    if (isSignupFlow && currentStep === 0) {
      // Email and password validation for signup
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return formData.email && emailRegex.test(formData.email) && formData.password && formData.password.length >= 6;
    }
    
    const adjustedStep = isSignupFlow ? currentStep - 1 : currentStep;
    
    switch (adjustedStep) {
      case 0: return formData.fullName.trim().length >= 2 && formData.age && formData.gender && formData.height && formData.weight;
      case 1: return formData.activityLevel;
      default: return true; // Other steps are optional
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍽️ AI Food Pantry</Text>
        <Text style={styles.headerSubtitle}>
          {isSignupFlow ? 'Create your account' : 'Let\'s personalize your experience'}
        </Text>
        {renderProgressBar()}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={prevStep}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !isStepValid() && styles.nextButtonDisabled,
            currentStep === 0 && { width: '100%' }
          ]}
          onPress={nextStep}
          disabled={!isStepValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === STEPS.length - 1 ? 'Complete →' : 'Next →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#10b981',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
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
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  optionCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionTitleActive: {
    color: '#10b981',
  },
  optionDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipLabelActive: {
    color: '#10b981',
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;