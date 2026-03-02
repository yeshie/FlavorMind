// src/features/auth/screens/LoginScreen.tsx - Email + OAuth
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Apple, Search } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { moderateScale, scaleFontSize } from '../../../common/utils/responsive';
import Input from '../../../common/components/Input/Input';
import Button from '../../../common/components/Button/button';
import {
  loginWithEmail,
  loginWithGoogleIdToken,
  loginWithAppleIdToken,
  getRememberedEmail,
} from '../../../services/firebase/authService';

WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    loadRememberedEmail();
  }, []);

  const googleClientIds = {
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      || process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
      || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      || 'MISSING_GOOGLE_IOS_CLIENT_ID',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  };

  const useProxy = process.env.EXPO_PUBLIC_USE_AUTH_PROXY === 'true'
    || Constants.appOwnership === 'expo';

  const redirectUri = makeRedirectUri({
    scheme: 'flavormind',
    useProxy,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    ...googleClientIds,
    responseType: ResponseType.IdToken,
    scopes: ['profile', 'email'],
    redirectUri,
    selectAccount: true,
  });

  const hasGoogleConfig = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
      || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
      || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  );

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (!response) return;

      if (response.type !== 'success') {
        setLoading(false);
        return;
      }

      const idToken =
        (response.params as { id_token?: string })?.id_token
        || (response as { authentication?: { idToken?: string } })?.authentication?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'Google Sign-In failed to return a token.');
        setLoading(false);
        return;
      }

      try {
        const loginResponse = await loginWithGoogleIdToken(idToken);
        if (!loginResponse.success) {
          Alert.alert('Error', loginResponse.message || 'Google Sign-In failed');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Google Sign-In failed');
      } finally {
        setLoading(false);
      }
    };

    handleGoogleResponse();
  }, [response]);

  const loadRememberedEmail = async () => {
    const savedEmail = await getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  };

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await loginWithEmail(email, password, rememberMe);
      if (!response.success) {
        Alert.alert('Error', response.message || 'Login failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!hasGoogleConfig) {
      Alert.alert('Missing Configuration', 'Add Google OAuth client IDs to your .env file.');
      return;
    }

    if (!request) {
      Alert.alert('Please wait', 'Google Sign-In is still initializing.');
      return;
    }

    setLoading(true);
    const result = await promptAsync({ useProxy });
    if (result.type !== 'success') {
      setLoading(false);
    }
  };

  const createNonce = async (size = 16) => {
    const bytes = await Crypto.getRandomBytesAsync(size);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleAppleSignIn = async () => {
    setLoading(true);

    try {
      const rawNonce = await createNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        Alert.alert('Error', 'Apple Sign-In failed to return a token.');
        return;
      }

      const loginResponse = await loginWithAppleIdToken(credential.identityToken, rawNonce);
      if (!loginResponse.success) {
        Alert.alert('Error', loginResponse.message || 'Apple Sign-In failed');
      }
    } catch (error: any) {
      if (error?.code !== 'ERR_CANCELED') {
        Alert.alert('Error', error.message || 'Apple Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your culinary journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberMeContainer}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: COLORS.border.light, true: COLORS.primary.light }}
                  thumbColor={rememberMe ? COLORS.primary.main : COLORS.background.white}
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </View>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Button
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              onPress={handleLogin}
              style={styles.loginButton}
            >
              Sign In
            </Button>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.text.primary} />
                ) : (
                  <View style={styles.socialButtonContent}>
                    <Search
                      size={scaleFontSize(18)}
                      color={COLORS.text.primary}
                      strokeWidth={2}
                    />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleAppleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.text.primary} />
                  ) : (
                    <View style={styles.socialButtonContent}>
                      <Apple
                        size={scaleFontSize(18)}
                        color={COLORS.text.primary}
                        strokeWidth={2}
                      />
                      <Text style={styles.socialButtonText}>Apple</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(SPACING.xl),
    paddingTop: moderateScale(SPACING['4xl']),
    paddingBottom: moderateScale(SPACING.xl),
  },
  header: {
    marginBottom: moderateScale(SPACING['3xl']),
  },
  title: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize['3xl']),
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: moderateScale(SPACING.xs),
  },
  subtitle: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * scaleFontSize(TYPOGRAPHY.fontSize.base),
  },
  form: {
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.xl),
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.primary,
    marginLeft: moderateScale(SPACING.xs),
  },
  forgotPasswordText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  loginButton: {
    marginBottom: moderateScale(SPACING.md),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(SPACING.xl),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border.light,
  },
  dividerText: {
    marginHorizontal: moderateScale(SPACING.md),
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.xs),
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: moderateScale(SPACING.md),
    marginBottom: moderateScale(SPACING.xl),
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border.main,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: moderateScale(SPACING.md),
    alignItems: 'center',
    backgroundColor: COLORS.background.white,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(SPACING.xs),
  },
  socialButtonText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.base),
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.text.secondary,
  },
  signUpText: {
    fontSize: scaleFontSize(TYPOGRAPHY.fontSize.sm),
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});

export default LoginScreen;
