import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChefHat, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  User,
  Chrome,
  Apple,
  ShoppingBag,
  Check
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthService } from '@/lib/authService';
import { colors, spacing, typography, shadows } from '@/lib/theme';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!formData.displayName || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords don\'t match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Error', 'You must accept the terms of service');
      return;
    }

    setLoading(true);
    try {
      await AuthService.signUpWithEmail(formData.email, formData.password, formData.displayName);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'amazon') => {
    setSocialLoading(provider);
    try {
      switch (provider) {
        case 'google':
          await AuthService.signInWithGoogle();
          break;
        case 'apple':
          await AuthService.signInWithApple();
          break;
        case 'amazon':
          await AuthService.signInWithAmazon();
          break;
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message);
    } finally {
      setSocialLoading(null);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary[400], colors.primary[600]]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={colors.neutral[0]} />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <ChefHat size={48} color={colors.neutral[0]} />
              </View>
              
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Start your smart kitchen experience
              </Text>
            </View>

            {/* Signup Form */}
            <View style={styles.formContainer}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <User size={20} color={colors.neutral[500]} />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your full name"
                  placeholderTextColor={colors.neutral[400]}
                  value={formData.displayName}
                  onChangeText={(value) => updateFormData('displayName', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={colors.neutral[500]} />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your email address"
                  placeholderTextColor={colors.neutral[400]}
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color={colors.neutral[500]} />
                </View>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Your password (min 6 characters)"
                  placeholderTextColor={colors.neutral[400]}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.neutral[500]} />
                  ) : (
                    <Eye size={20} color={colors.neutral[500]} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color={colors.neutral[500]} />
                </View>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.neutral[400]}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.neutral[500]} />
                  ) : (
                    <Eye size={20} color={colors.neutral[500]} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Check size={16} color={colors.neutral[0]} />}
                </View>
                <Text style={styles.termsText}>
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                  {' '}(I agree)
                </Text>
              </TouchableOpacity>

              {/* Signup Button */}
              <TouchableOpacity
                style={[styles.signupButton, loading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.secondary[400], colors.secondary[600]]}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.neutral[0]} />
                  ) : (
                    <Text style={styles.signupButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('google')}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === 'google' ? (
                    <ActivityIndicator size="small" color={colors.neutral[600]} />
                  ) : (
                    <>
                      <Chrome size={20} color="#4285F4" />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('apple')}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === 'apple' ? (
                    <ActivityIndicator size="small" color={colors.neutral[600]} />
                  ) : (
                    <>
                      <Apple size={20} color={colors.neutral[800]} />
                      <Text style={styles.socialButtonText}>Apple</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('amazon')}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === 'amazon' ? (
                    <ActivityIndicator size="small" color={colors.neutral[600]} />
                  ) : (
                    <>
                      <ShoppingBag size={20} color="#FF9900" />
                      <Text style={styles.socialButtonText}>Amazon</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={styles.loginLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: 'Poppins-Bold',
    color: colors.neutral[0],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[200],
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    ...shadows.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  inputIcon: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    fontSize: typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[800],
  },
  passwordInput: {
    paddingRight: spacing.xs,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    marginRight: spacing.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  termsLink: {
    color: colors.primary[600],
    fontFamily: 'Inter-SemiBold',
  },
  signupButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Poppins-SemiBold',
    color: colors.neutral[0],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[300],
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[500],
    marginHorizontal: spacing.md,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  socialButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.neutral[700],
    marginLeft: spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
  },
  loginLink: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
  },
});