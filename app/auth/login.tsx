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
  Chrome,
  Apple,
  ShoppingBag
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthService } from '@/lib/authService';
import { colors, spacing, typography, shadows } from '@/lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await AuthService.signInWithEmail(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message);
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
              
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to your account
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={colors.neutral[500]} />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your email address"
                  placeholderTextColor={colors.neutral[400]}
                  value={email}
                  onChangeText={setEmail}
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
                  placeholder="Your password"
                  placeholderTextColor={colors.neutral[400]}
                  value={password}
                  onChangeText={setPassword}
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

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleEmailLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.secondary[400], colors.secondary[600]]}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.neutral[0]} />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
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

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                  <Text style={styles.signupLink}>Sign up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: colors.primary[600],
  },
  loginButton: {
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
  loginButtonText: {
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: colors.neutral[600],
  },
  signupLink: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
  },
});
