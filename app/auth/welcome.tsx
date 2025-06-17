import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChefHat, Sparkles, Shield, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/lib/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const features = [
    {
      icon: ChefHat,
      title: 'Akıllı Mutfak',
      description: 'AI ile yemek tanıma ve beslenme takibi'
    },
    {
      icon: Sparkles,
      title: 'Otomatik Envanter',
      description: 'Fiş tarayarak otomatik ürün ekleme'
    },
    {
      icon: Shield,
      title: 'Güvenli Depolama',
      description: 'Verileriniz güvenli şekilde korunur'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary[400], colors.primary[600], colors.primary[800]]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <ChefHat size={60} color={colors.neutral[0]} strokeWidth={1.5} />
            <Sparkles 
              size={24} 
              color={colors.secondary[400]} 
              style={styles.sparkle}
            />
          </View>
          <Text style={styles.title}>Pantry Pal</Text>
          <Text style={styles.subtitle}>
            Akıllı mutfak asistanınız
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <feature.icon size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/signup')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.secondary[400], colors.secondary[600]]}
              style={styles.buttonGradient}
            >
              <Zap size={20} color={colors.neutral[0]} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Hemen Başla</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Zaten hesabım var</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Giriş yaparak{' '}
            <Text style={styles.footerLink}>Kullanım Şartları</Text>
            {' '}ve{' '}
            <Text style={styles.footerLink}>Gizlilik Politikası</Text>
            'nı kabul etmiş olursunuz
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  sparkle: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[0],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[100],
    textAlign: 'center',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[0],
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[200],
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  actionsContainer: {
    paddingVertical: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[0],
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.neutral[0],
    textAlign: 'center',
  },
  footer: {
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[300],
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
  footerLink: {
    color: colors.secondary[300],
    fontFamily: 'Inter-SemiBold',
  },
});