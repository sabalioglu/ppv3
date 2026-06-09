// components/camera/ScanSurface.tsx — full-screen scan progress / result surface.
// Rendered INSTEAD of the live CameraView, never as a <Modal> on top of it:
// iOS does not reliably composite a Modal above an active camera preview, so the
// camera screen unmounts the preview and shows this surface while a scan runs.
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TriangleAlert as AlertTriangle,
  X,
  Plus,
  Sparkles,
  Lightbulb,
  FileText,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, type Colors } from '@/lib/theme/index';
import { Display, Eyebrow } from '@/components/UI/Display';
import { t } from '@/lib/i18n';

export interface ScanResultData {
  name: string;
  confidence: number;
  items?: any[];
  text?: string;
  suggestions?: string[];
  imageType?: string;
  calories?: number;
  nutrition?: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface ScanSurfaceProps {
  /** Non-null while the pipeline is running (optimizing/analyzing step label). */
  phaseLabel: string | null;
  result: ScanResultData | null;
  error: string | null;
  showAddAll: boolean;
  showReceiptText: boolean;
  onRetry: () => void;
  onClose: () => void;
  onAddAll: () => void;
}

export default function ScanSurface({
  phaseLabel,
  result,
  error,
  showAddAll,
  showReceiptText,
  onRetry,
  onClose,
  onAddAll,
}: ScanSurfaceProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // 1) In-progress: visible step status, nothing silent.
  if (phaseLabel) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.phaseText, { color: colors.textPrimary }]}>
            {phaseLabel}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2) Failure: real error message + retry. Never a dead end.
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centered}>
          <AlertTriangle size={36} color={colors.error} />
          <Display
            size="md"
            color={colors.textPrimary}
            style={styles.errorTitle}
          >
            {t('camera.scanFailedTitle')}
          </Display>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={onRetry}
          >
            <RotateCcw size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ghostButton, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <X size={18} color={colors.textSecondary} />
            <Text
              style={[styles.ghostButtonText, { color: colors.textSecondary }]}
            >
              {t('common.close')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3) Result.
  if (result) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultHeader}>
            <Eyebrow style={styles.resultEyebrow}>
              {t('camera.resultEyebrow')}
            </Eyebrow>
            <Display size="lg" color={colors.textPrimary}>
              {result.name}
            </Display>
          </View>

          {/* Calorie & nutrition (CALORIE mode and any result carrying them) */}
          {result.calories ? (
            <View
              style={[
                styles.calorieContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Eyebrow style={styles.calorieTitle}>
                {t('camera.nutritionTitle')}
              </Eyebrow>
              <View style={styles.calorieGrid}>
                <View style={styles.calorieItem}>
                  <Display size="md" color={colors.primary}>
                    {result.calories}
                  </Display>
                  <Text
                    style={[
                      styles.calorieLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t('camera.calories')}
                  </Text>
                </View>
                {result.nutrition && (
                  <>
                    <View style={styles.calorieItem}>
                      <Display size="md" color={colors.secondary}>
                        {result.nutrition.protein}g
                      </Display>
                      <Text
                        style={[
                          styles.calorieLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t('camera.protein')}
                      </Text>
                    </View>
                    <View style={styles.calorieItem}>
                      <Display size="md" color={colors.accent}>
                        {result.nutrition.carbs}g
                      </Display>
                      <Text
                        style={[
                          styles.calorieLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t('camera.carbs')}
                      </Text>
                    </View>
                    <View style={styles.calorieItem}>
                      <Display size="md" color={colors.error}>
                        {result.nutrition.fat}g
                      </Display>
                      <Text
                        style={[
                          styles.calorieLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t('camera.fat')}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          ) : null}

          {/* Detected items */}
          {result.items && result.items.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <Sparkles size={16} color={colors.secondary} />
                <Display size="sm" color={colors.textPrimary}>
                  {t('camera.foundItems')}
                </Display>
              </View>
              {result.items.map((item: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.detectedItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text
                    style={[styles.itemName, { color: colors.textPrimary }]}
                  >
                    {item.name || item.item}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <Lightbulb size={16} color={colors.accent} />
                <Display size="sm" color={colors.textPrimary}>
                  {t('camera.suggestions')}
                </Display>
              </View>
              {result.suggestions.map((suggestion: string, index: number) => (
                <Text
                  key={index}
                  style={[
                    styles.suggestionText,
                    { color: colors.textSecondary },
                  ]}
                >
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}

          {/* Raw text (receipt mode) */}
          {result.text && showReceiptText && (
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <FileText size={16} color={colors.textSecondary} />
                <Display size="sm" color={colors.textPrimary}>
                  {t('camera.extractedText')}
                </Display>
              </View>
              <ScrollView
                style={[styles.textScroll, { backgroundColor: colors.surface }]}
                nestedScrollEnabled={true}
              >
                <Text
                  style={[
                    styles.extractedText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {result.text}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.ghostButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <X size={18} color={colors.textSecondary} />
              <Text
                style={[
                  styles.ghostButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                {t('common.close')}
              </Text>
            </TouchableOpacity>

            {showAddAll && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={onAddAll}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {t('camera.addAll')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 4) Nothing to show (e.g. inventory modal owns the screen): themed backdrop.
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} />
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    phaseText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      marginTop: spacing.md,
      textAlign: 'center',
    },

    // Error
    errorTitle: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },

    // Result layout
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: 110,
    },
    resultHeader: {
      marginBottom: 20,
    },
    resultEyebrow: {
      marginBottom: 6,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 12,
    },

    // Calorie card
    calorieContainer: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: 20,
      shadowColor: '#3C2814',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    calorieTitle: {
      textAlign: 'center',
      marginBottom: 15,
    },
    calorieGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
    },
    calorieItem: {
      alignItems: 'center',
      minWidth: 60,
      gap: 2,
    },
    calorieLabel: {
      fontSize: 11,
      fontFamily: 'Inter-Medium',
      marginTop: 2,
    },

    // Items
    detectedItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderRadius: radius.md,
      marginBottom: 8,
    },
    itemName: {
      fontSize: 15,
      fontFamily: 'Inter-Medium',
      flex: 1,
    },

    // Suggestions
    suggestionText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      marginBottom: 6,
      lineHeight: 20,
    },

    // Receipt text
    textScroll: {
      maxHeight: 150,
      borderRadius: radius.md,
      padding: 15,
    },
    extractedText: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'monospace',
    },

    // Buttons
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 20,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 22,
      height: 48,
      borderRadius: 18,
      gap: 8,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-Bold',
    },
    ghostButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      paddingHorizontal: 20,
      height: 48,
      borderRadius: 18,
      gap: 8,
      marginTop: spacing.sm,
    },
    ghostButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
  });
