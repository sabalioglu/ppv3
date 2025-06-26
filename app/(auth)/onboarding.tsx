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

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // Check if profile is already complete
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('age, gender, height_cm, weight_kg, activity_level, health_goals')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && profile.age && profile.gender && profile.height_cm && 
            profile.weight_kg && profile.activity_level && profile.health_goals) {
          console.log('✅ Profile already complete, redirecting to app');
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı ve soyadınızı girin.');
      return false;
    }
    if (!formData.age || isNaN(parseInt(formData.age)) || parseInt(formData.age) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir yaş girin.');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Hata', 'Lütfen cinsiyetinizi seçin.');
      return false;
    }
    if (!formData.height || isNaN(parseInt(formData.height)) || parseInt(formData.height) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir boy (cm) girin.');
      return false;
    }
    if (!formData.weight || isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir kilo (kg) girin.');
      return false;
    }
    if (!userId) {
      Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
      router.replace('/(auth)/login');
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    try {
      console.log('✅ Starting onboarding completion...');

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
        'Hata',
        'Profil güncellenirken bir sorun oluştu. Tekrar deneyin.',
        [
          { text: 'Tekrar Dene', style: 'cancel' },
          { 
            text: 'Devam Et', 
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
      <Text style={styles.title}>🍽 Profilinizi Tamamlayın</Text>
      <Text style={styles.subtitle}>Kişiselleştirilmiş deneyim için birkaç bilgi daha</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ad Soyad *</Text>
          <TextInput
            style={styles.input}
            placeholder="Adınızı ve soyadınızı girin"
            value={formData.fullName}
            onChangeText={(text) => setFormData({...formData, fullName: text})}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Yaş *</Text>
          <TextInput
            style={styles.input}
            placeholder="Yaşınızı girin"
            value={formData.age}
            onChangeText={(text) => setFormData({...formData, age: text})}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cinsiyet *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.gender}
              style={styles.picker}
              onValueChange={(value) => setFormData({...formData, gender: value})}
            >
              <Picker.Item label="Cinsiyet seçin" value="" />
              <Picker.Item label="Erkek" value="male" />
              <Picker.Item label="Kadın" value="female" />
              <Picker.Item label="Belirtmek istemiyorum" value="prefer_not_to_say" />
            </Picker>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Boy (cm) *</Text>
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
            <Text style={styles.label}>Kilo (kg) *</Text>
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
          <Text style={styles.label}>Aktivite Seviyesi</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.activityLevel}
              style={styles.picker}
              onValueChange={(value) => setFormData({...formData, activityLevel: value})}
            >
              <Picker.Item label="Hareketsiz (az veya hiç egzersiz)" value="sedentary" />
              <Picker.Item label="Hafif Aktif (haftada 1-3 gün)" value="lightly_active" />
              <Picker.Item label="Orta Aktif (haftada 3-5 gün)" value="moderately_active" />
              <Picker.Item label="Çok Aktif (haftada 6-7 gün)" value="very_active" />
              <Picker.Item label="Ekstra Aktif (çok yoğun egzersiz)" value="extra_active" />
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
          <Text style={styles.buttonText}>Profili Tamamla →</Text>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1f2937',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
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
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
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