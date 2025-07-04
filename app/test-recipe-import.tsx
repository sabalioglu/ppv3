import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  StyleSheet
} from 'react-native';
import { extractRecipeFromUrl } from '@/lib/recipeAIService';
import { debugScrapeService } from '@/lib/scrapeService';
import { colors, spacing, typography } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { ArrowLeft, TestTube, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';

interface TestResult {
  success: boolean;
  title?: string;
  imageUrl?: string;
  ingredientCount?: number;
  instructionCount?: number;
  executionTime?: number;
  error?: string;
  isAiGenerated?: boolean;
}

export default function TestScraping() {
  const [url, setUrl] = useState('https://www.allrecipes.com/recipe/92462/slow-cooker-texas-pulled-pork/');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [apiStatus, setApiStatus] = useState<any>(null);

  // API durumu kontrolü
  const checkApiStatus = () => {
    console.log('\n🔍 [TEST] API durumu kontrol ediliyor...');
    
    const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    const scrapeDoKey = process.env.EXPO_PUBLIC_SCRAPE_DO_API_KEY;
    
    console.log('🔑 [TEST] OpenAI Key:', openaiKey ? openaiKey.substring(0, 8) + '...' : 'YOK!');
    console.log('🔑 [TEST] Scrape.do Key:', scrapeDoKey ? scrapeDoKey.substring(0, 8) + '...' : 'YOK!');
    
    const scrapeStatus = debugScrapeService.checkStatus();
    
    setApiStatus({
      openaiConfigured: !!openaiKey,
      scrapeDoConfigured: !!scrapeDoKey,
      openaiPreview: openaiKey ? openaiKey.substring(0, 8) + '...' : 'Yapılandırılmamış',
      scrapeDoPreview: scrapeDoKey ? scrapeDoKey.substring(0, 8) + '...' : 'Yapılandırılmamış'
    });
  };

  // Scrape.do bağlantı testi
  const testScrapeDoConnection = async () => {
    setLoading(true);
    try {
      console.log('\n🔧 [TEST] Scrape.do bağlantı testi...');
      const connectionResult = await debugScrapeService.testConnection();
      console.log('📡 [TEST] Bağlantı sonucu:', connectionResult);
      
      Alert.alert(
        connectionResult.success ? '✅ Başarılı' : '❌ Hata',
        connectionResult.message
      );
    } catch (error) {
      console.error('❌ [TEST] Bağlantı testi hatası:', error);
      Alert.alert('❌ Hata', 'Bağlantı testi başarısız');
    }
    setLoading(false);
  };

  // Ana tarif çıkarım testi
  const testRecipeExtraction = async () => {
    if (!url.trim()) {
      Alert.alert('Hata', 'Lütfen bir URL girin');
      return;
    }

    console.log('\n🧪 [TEST] ===== TARİF ÇIKARIM TESTİ BAŞLADI =====');
    console.log('🌐 [TEST] Test URL:', url);

    setLoading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      const startTime = Date.now();
      const extractedData = await extractRecipeFromUrl(url, user.id);
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      if (extractedData) {
        console.log('✅ [TEST] Başarılı!');
        console.log('📝 [TEST] Başlık:', extractedData.title);
        console.log('🖼️ [TEST] Görsel:', extractedData.image_url ? 'Mevcut' : 'Yok');
        console.log('🥘 [TEST] Malzemeler:', extractedData.ingredients?.length || 0);
        console.log('📋 [TEST] Talimatlar:', extractedData.instructions?.length || 0);
        console.log('⏱️ [TEST] Süre:', executionTime.toFixed(2) + 's');

        setResult({
          success: true,
          title: extractedData.title,
          imageUrl: extractedData.image_url,
          ingredientCount: extractedData.ingredients?.length || 0,
          instructionCount: extractedData.instructions?.length || 0,
          executionTime: executionTime,
          isAiGenerated: extractedData.is_ai_generated
        });
      } else {
        throw new Error('Tarif çıkarılamadı');
      }

    } catch (error: any) {
      console.error('❌ [TEST] Hata:', error);
      setResult({
        success: false,
        error: error.message || 'Bilinmeyen hata'
      });
    }

    setLoading(false);
    console.log('🧪 [TEST] ===== TARİF ÇIKARIM TESTİ BİTTİ =====\n');
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Import Test</Text>
        <TouchableOpacity onPress={checkApiStatus} style={styles.refreshButton}>
          <Settings size={24} color={colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* API Status */}
        {apiStatus && (
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>🔧 API Durumu</Text>
            
            <View style={styles.statusItem}>
              <View style={styles.statusHeader}>
                {apiStatus.openaiConfigured ? 
                  <CheckCircle size={20} color={colors.success[500]} /> :
                  <XCircle size={20} color={colors.error[500]} />
                }
                <Text style={styles.statusLabel}>OpenAI API</Text>
              </View>
              <Text style={styles.statusValue}>{apiStatus.openaiPreview}</Text>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusHeader}>
                {apiStatus.scrapeDoConfigured ? 
                  <CheckCircle size={20} color={colors.success[500]} /> :
                  <XCircle size={20} color={colors.error[500]} />
                }
                <Text style={styles.statusLabel}>Scrape.do API</Text>
              </View>
              <Text style={styles.statusValue}>{apiStatus.scrapeDoPreview}</Text>
            </View>

            <TouchableOpacity 
              style={styles.testConnectionButton} 
              onPress={testScrapeDoConnection}
              disabled={loading || !apiStatus.scrapeDoConfigured}
            >
              <Text style={styles.testConnectionText}>Scrape.do Bağlantı Testi</Text>
            </TouchableOpacity>

            {!apiStatus.openaiConfigured && (
              <View style={styles.warningContainer}>
                <AlertTriangle size={16} color={colors.warning[600]} />
                <Text style={styles.warningText}>
                  OpenAI API key eksik! .env dosyanızı kontrol edin ve Metro'yu yeniden başlatın.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Test Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>🧪 Tarif URL Testi</Text>
          <TextInput
            style={styles.input}
            placeholder="Test edilecek tarif URL'sini girin..."
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
            placeholderTextColor={colors.neutral[500]}
            multiline
          />
          
          <TouchableOpacity
            style={[styles.testButton, loading && styles.testButtonDisabled]}
            onPress={testRecipeExtraction}
            disabled={loading || !apiStatus?.openaiConfigured}
          >
            <TestTube size={20} color={colors.neutral[0]} />
            <Text style={styles.testButtonText}>
              {loading ? 'Test Ediliyor...' : 'Tarif Çıkar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>İşlem devam ediyor...</Text>
            <Text style={styles.loadingSubtext}>Console loglarını terminalde takip edin</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={[styles.resultContainer, result.success ? styles.successResult : styles.errorResult]}>
            <Text style={styles.resultTitle}>
              {result.success ? '✅ Başarılı!' : '❌ Hata'}
            </Text>
            
            {result.success ? (
              <View style={styles.resultDetails}>
                <Text style={styles.resultItem}>📝 Başlık: {result.title}</Text>
                <Text style={styles.resultItem}>🖼️ Görsel: {result.imageUrl ? 'Mevcut' : 'Yok'}</Text>
                <Text style={styles.resultItem}>🥘 Malzemeler: {result.ingredientCount} adet</Text>
                <Text style={styles.resultItem}>📋 Talimatlar: {result.instructionCount} adım</Text>
                <Text style={styles.resultItem}>⏱️ Süre: {result.executionTime?.toFixed(2)}s</Text>
                <Text style={styles.resultItem}>🤖 AI Üretimi: {result.isAiGenerated ? 'Evet' : 'JSON-LD'}</Text>
              </View>
            ) : (
              <Text style={styles.errorText}>{result.error}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-Bold',
    color: colors.neutral[800],
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  statusSection: {
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  statusItem: {
    marginBottom: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statusLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    color: colors.neutral[700],
  },
  statusValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
    marginLeft: 28,
  },
  testConnectionButton: {
    backgroundColor: colors.accent[500],
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  testConnectionText: {
    color: colors.neutral[0],
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.warning[700],
  },
  inputSection: {
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  input: {
    borderColor: colors.neutral[300],
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[800],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  testButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  testButtonText: {
    color: colors.neutral[0],
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
  },
  loadingContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
  },
  loadingSubtext: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
  },
  resultContainer: {
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
  },
  successResult: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[200],
  },
  errorResult: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[200],
  },
  resultTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    marginBottom: spacing.md,
  },
  resultDetails: {
    gap: spacing.sm,
  },
  resultItem: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.success[700],
  },
  errorText: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.error[600],
  },
});