// app/website-recipe-import.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface JobStatus {
  job_id: string;
  status: 'analyzing' | 'validating' | 'saving' | 'completed' | 'failed';
  progress: number;
  message: string;
  data?: any;
}

export default function WebsiteRecipeImport() {
  const [url, setUrl] = useState('');
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
  const [processing, setProcessing] = useState(false);

  const isValidWebsiteUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Recipe website domains
      const recipeWebsites = [
        'allrecipes.com',
        'food.com', 
        'foodnetwork.com',
        'nefisyemektarifleri.com',
        'yemek.com',
        'tarifdefteri.com'
      ];
      
      return recipeWebsites.some(site => domain.includes(site)) || 
             domain.includes('tarif') || 
             domain.includes('recipe');
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert('Hata', 'Lütfen bir web sitesi URL\'si girin');
      return;
    }

    if (!isValidWebsiteUrl(url)) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir tarif web sitesi URL\'si girin\n\nÖrnekler:\n• AllRecipes.com\n• Nefis Yemek Tarifleri\n• Food.com');
      return;
    }

    setProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      const { data, error } = await supabase.functions.invoke('website-recipe-extractor', {
        body: { url, userId: user.id }
      });

      if (error) throw error;

      const jobId = data.jobId;
      
      // Real-time job updates subscription
      const subscription = supabase
        .channel(`job:${jobId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'recipe_processing_jobs',
          filter: `job_id=eq.${jobId}`
        }, (payload) => {
          const jobUpdate = payload.new as JobStatus;
          setCurrentJob(jobUpdate);
          
          if (jobUpdate.status === 'completed') {
            setProcessing(false);
            subscription.unsubscribe();
            
            Alert.alert(
              '🎉 Başarılı!',
              `"${jobUpdate.data?.title || 'Web sitesi tarifi'}" başarıyla kaydedildi!\n\nGüven Skoru: ${jobUpdate.data?.confidence}%`,
              [
                { 
                  text: 'Görüntüle', 
                  onPress: () => router.push(`/recipe/${jobUpdate.data?.recipeId}`) 
                },
                { text: 'Tamam', style: 'cancel' }
              ]
            );
          } else if (jobUpdate.status === 'failed') {
            setProcessing(false);
            subscription.unsubscribe();
            Alert.alert('Hata', jobUpdate.message || 'Web sitesi analizi başarısız');
          }
        })
        .subscribe();

    } catch (error: any) {
      setProcessing(false);
      Alert.alert('Hata', error.message || 'Web sitesi analizi başlatılamadı');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Web Sitesi Tarif Çıkarımı</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>✨ Nasıl Çalışır?</Text>
        <Text style={styles.infoText}>
          • Web sitesini AI ile analiz eder{'\n'}
          • Tarif bilgilerini otomatik çıkarır{'\n'}
          • Kütüphanenize kaydeder{'\n'}
          • 15-30 saniyede tamamlanır
        </Text>
      </View>

      <View style={styles.supportedSites}>
        <Text style={styles.supportedTitle}>🏆 Desteklenen Siteler</Text>
        <Text style={styles.supportedText}>
          AllRecipes • Food.com • Nefis Yemek Tarifleri{'\n'}
          Food Network • Yemek.com • Tarif Defteri
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Tarif web sitesi URL'si..."
        value={url}
        onChangeText={setUrl}
        multiline
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity
        style={[styles.button, processing && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={processing}
      >
        <Text style={styles.buttonText}>
          {processing ? 'Analiz Ediliyor...' : '🚀 Tarifi Çıkar'}
        </Text>
      </TouchableOpacity>

      {currentJob && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusMessage}>{currentJob.message}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${currentJob.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentJob.progress}% tamamlandı</Text>
          
          {currentJob.status === 'analyzing' && (
            <Text style={styles.tipText}>
              💡 AI web sitesindeki tarif bilgilerini çıkarıyor...
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2d3436'
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20
  },
  supportedSites: {
    backgroundColor: '#f3e5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  supportedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 8
  },
  supportedText: {
    fontSize: 12,
    color: '#4a148c',
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 20,
    minHeight: 60
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonDisabled: {
    backgroundColor: '#9e9e9e'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  statusMessage: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
    marginBottom: 10
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8
  },
  tipText: {
    fontSize: 12,
    color: '#2196F3',
    textAlign: 'center',
    fontStyle: 'italic'
  }
});
