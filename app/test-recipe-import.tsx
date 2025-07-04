// app/test-recipe-import.tsx - YENİ DOSYA OLUŞTURUN
import React, { useState } from 'react';
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
import { colors, spacing, typography } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { ArrowLeft, TestTube, Clock, DollarSign } from 'lucide-react-native';

interface TestResult {
  url: string;
  success: boolean;
  title?: string;
  imageUrl?: string;
  ingredientCount?: number;
  instructionCount?: number;
  isAiGenerated?: boolean;
  confidence?: number;
  executionTime?: number;
  error?: string;
}

export default function RecipeImportTest() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');

  // Önceden tanımlanmış test URL'leri
  const testUrls = [
    {
      name: 'JSON-LD Blog (Ücretsiz)',
      url: 'https://www.allrecipes.com/recipe/231506/simple-macaroni-and-cheese/',
      expected: 'JSON-LD extraction, no AI needed'
    },
    {
      name: 'Recipe Blog (HTML)',
      url: 'https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524',
      expected: 'HTML extraction + AI analysis'
    },
    {
      name: 'YouTube Video',
      url: 'https://www.youtube.com/watch?v=FUeyrEN14Rk',
      expected: 'JS rendering + AI analysis'
    },
    {
      name: 'Serious Eats Blog',
      url: 'https://www.seriouseats.com/best-chocolate-chip-cookies-recipe',
      expected: 'Complex HTML + AI analysis'
    }
  ];

  const runSingleTest = async (testUrl: string, testName: string = 'Manual Test') => {
    console.log(`\n🧪 ===== ${testName.toUpperCase()} BAŞLADI =====`);
    console.log('🔗 Test URL:', testUrl);
    
    setLoading(true);
    setCurrentTest(testName);
    
    const startTime = Date.now();
    let testResult: TestResult = {
      url: testUrl,
      success: false
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await extractRecipeFromUrl(testUrl, user.id);
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      if (result) {
        testResult = {
          url: testUrl,
          success: true,
          title: result.title,
          imageUrl: result.image_url,
          ingredientCount: result.ingredients?.length || 0,
          instructionCount: result.instructions?.length || 0,
          isAiGenerated: result.is_ai_generated,
          confidence: result.ai_match_score,
          executionTime: executionTime
        };

        console.log('✅ SUCCESS!');
        console.log('📝 Title:', result.title);
        console.log('🖼️ Image URL:', result.image_url ? 'Available' : 'Missing');
        console.log('🥘 Ingredients:', result.ingredients?.length || 0);
        console.log('📋 Instructions:', result.instructions?.length || 0);
        console.log('🤖 AI Generated:', result.is_ai_generated);
        console.log('⭐ Confidence:', result.ai_match_score || 'N/A');
        console.log('⏱️ Execution Time:', executionTime.toFixed(2), 'seconds');
      } else {
        throw new Error('No result returned');
      }

    } catch (error: any) {
      console.error('❌ ERROR:', error.message);
      testResult.error = error.message;
    }

    console.log(`🧪 ===== ${testName.toUpperCase()} BİTTİ =====\n`);
    
    setResults(prev => [testResult, ...prev]);
    setLoading(false);
    setCurrentTest('');
  };

  const runAllTests = async () => {
    Alert.alert(
      'Tüm Testleri Çalıştır',
      'Bu işlem birkaç dakika sürebilir ve API maliyeti oluşturabilir. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Başlat', 
          onPress: async () => {
            setResults([]);
            for (const test of testUrls) {
              await runSingleTest(test.url, test.name);
              // Testler arasında kısa bekleme
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Import Test</Text>
      </View>

      {/* Manual Test Input */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Manuel Test</Text>
        <TextInput
          style={styles.input}
          placeholder="Tarif URL'sini girin..."
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          placeholderTextColor={colors.neutral[500]}
        />
        <TouchableOpacity
          style={[styles.testButton, loading && styles.testButtonDisabled]}
          onPress={() => runSingleTest(url, 'Manual Test')}
          disabled={loading || !url}
        >
          <TestTube size={20} color={colors.neutral[0]} />
          <Text style={styles.testButtonText}>
            {loading ? 'Test Ediliyor...' : 'Test Et'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Predefined Tests */}
      <View style={styles.predefinedSection}>
        <Text style={styles.sectionTitle}>Önceden Tanımlanmış Testler</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {testUrls.map((test, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.predefinedButton, loading && styles.testButtonDisabled]}
              onPress={() => runSingleTest(test.url, test.name)}
              disabled={loading}
            >
              <Text style={styles.predefinedButtonText}>{test.name}</Text>
              <Text style={styles.predefinedButtonSubtext}>{test.expected}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity
          style={[styles.runAllButton, loading && styles.testButtonDisabled]}
          onPress={runAllTests}
          disabled={loading}
        >
          <Text style={styles.runAllButtonText}>Tüm Testleri Çalıştır</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>
            {currentTest ? `${currentTest} test ediliyor...` : 'Test ediliyor...'}
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {results.map((result, index) => (
          <View key={index} style={[styles.resultCard, result.success ? styles.successCard : styles.errorCard]}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultStatus}>
                {result.success ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}
              </Text>
              {result.executionTime && (
                <View style={styles.executionTime}>
                  <Clock size={14} color={colors.neutral[500]} />
                  <Text style={styles.executionTimeText}>
                    {result.executionTime.toFixed(2)}s
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.resultUrl} numberOfLines={2}>
              {result.url}
            </Text>
            
            {result.success ? (
              <View style={styles.resultDetails}>
                <Text style={styles.resultTitle}>{result.title}</Text>
                <View style={styles.resultStats}>
                  <Text style={styles.resultStat}>
                    🥘 {result.ingredientCount} malzeme
                  </Text>
                  <Text style={styles.resultStat}>
                    📋 {result.instructionCount} adım
                  </Text>
                  <Text style={styles.resultStat}>
                    🖼️ {result.imageUrl ? 'Görsel var' : 'Görsel yok'}
                  </Text>
                </View>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultMetaText}>
                    🤖 {result.isAiGenerated ? 'AI Üretimi' : 'Yapısal Veri'}
                  </Text>
                  {result.confidence && (
                    <Text style={styles.resultMetaText}>
                      ⭐ Güven: {result.confidence}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.errorText}>{result.error}</Text>
            )}
          </View>
        ))}
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
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-Bold',
    color: colors.neutral[800],
  },
  inputSection: {
    padding: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  input: {
    height: 50,
    borderColor: colors.neutral[300],
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[800],
    backgroundColor: colors.neutral[0],
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
  predefinedSection: {
    padding: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  predefinedButton: {
    backgroundColor: colors.accent[50],
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    minWidth: 200,
    borderWidth: 1,
    borderColor: colors.accent[200],
  },
  predefinedButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    color: colors.accent[700],
    marginBottom: spacing.xs,
  },
  predefinedButtonSubtext: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.accent[500],
  },
  runAllButton: {
    backgroundColor: colors.secondary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  runAllButtonText: {
    color: colors.neutral[0],
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
  },
  resultsContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  resultCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  successCard: {
    borderColor: colors.success[200],
  },
  errorCard: {
    borderColor: colors.error[200],
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultStatus: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Bold',
    color: colors.neutral[700],
  },
  executionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  executionTimeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
  },
  resultUrl: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
    marginBottom: spacing.md,
  },
  resultDetails: {
    gap: spacing.sm,
  },
  resultTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-SemiBold',
    color: colors.neutral[800],
  },
  resultStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  resultStat: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[600],
  },
  resultMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  resultMetaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.error[600],
  },
});
