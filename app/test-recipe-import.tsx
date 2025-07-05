import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { extractRecipeFromUrl } from '@/lib/recipeAIService';
import { debugScrapeService } from '@/lib/scrapeService';
import { colors, spacing, typography } from '@/lib/theme';
import { router } from 'expo-router';

export default function TestRecipeImport() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleDebugScrape = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setLoading(true);
    setDebugInfo(null);

    try {
      console.log('🔍 Starting debug scrape for:', url);
      const result = await debugScrapeService(url);
      
      setDebugInfo({
        success: result.success,
        htmlLength: result.html.length,
        hasTitle: !!result.metadata?.title,
        hasDescription: !!result.metadata?.description,
        hasStructuredData: !!result.metadata?.structuredData?.length,
        title: result.metadata?.title,
        description: result.metadata?.description,
        structuredDataCount: result.metadata?.structuredData?.length || 0,
        error: result.error
      });

    } catch (error) {
      console.error('Debug scrape error:', error);
      Alert.alert('Error', `Debug scraping failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFullRecipeImport = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setLoading(true);

    try {
      const recipe = await extractRecipeFromUrl(url);
      
      if (recipe) {
        Alert.alert(
          'Success!', 
          `Recipe "${recipe.name}" imported successfully!`,
          [{ text: 'OK', onPress: () => router.push('/library') }]
        );
      } else {
        Alert.alert('Error', 'Failed to extract recipe from URL');
      }

    } catch (error) {
      console.error('Full import error:', error);
      Alert.alert('Error', `Recipe import failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg }}>
        <Text style={[typography.h1, { color: colors.primary, marginBottom: spacing.md }]}>
          🧪 ScrapingBee Test
        </Text>

        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: spacing.md,
            marginBottom: spacing.md,
            fontSize: 16,
            backgroundColor: colors.surface
          }}
          placeholder="Enter recipe URL (YouTube, TikTok, Instagram, etc.)"
          value={url}
          onChangeText={setUrl}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.secondary,
              padding: spacing.md,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleDebugScrape}
            disabled={loading}
          >
            <Text style={[typography.button, { color: colors.surface }]}>
              🔍 Debug Scrape
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              padding: spacing.md,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleFullRecipeImport}
            disabled={loading}
          >
            <Text style={[typography.button, { color: colors.surface }]}>
              🚀 Full Import
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              Processing...
            </Text>
          </View>
        )}

        {debugInfo && (
          <View style={{
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
              📊 Debug Results
            </Text>
            
            <Text style={[typography.body, { color: colors.text }]}>
              Success: {debugInfo.success ? '✅' : '❌'}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              HTML Length: {debugInfo.htmlLength.toLocaleString()} chars
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Has Title: {debugInfo.hasTitle ? '✅' : '❌'}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Has Description: {debugInfo.hasDescription ? '✅' : '❌'}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Structured Data: {debugInfo.structuredDataCount} items
            </Text>

            {debugInfo.title && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Title: {debugInfo.title}
                </Text>
              </View>
            )}

            {debugInfo.error && (
              <Text style={[typography.body, { color: colors.error, marginTop: spacing.sm }]}>
                Error: {debugInfo.error}
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
