import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation } from '../theme';
import { initFirebase, signIn } from '../services/firebase';

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Floating mascot animation
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1800 }),
        withTiming(10, { duration: 1800 }),
      ),
      -1,
      true,
    );
  }, []);
  const mascotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError('');
    try {
      initFirebase();
      const user = await signIn();
      if (user) {
        onLogin();
      } else {
        setError('Sign in failed. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow offline usage without sign in
    onLogin();
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Area */}
          <Animated.View style={styles.logoSection} entering={FadeInDown.duration(600).springify()}>
            <Animated.View style={mascotAnimStyle}>
              <Image
                source={require('../../assets/mascot/mascot-greet.png')}
                style={styles.mascotImage}
              />
            </Animated.View>
            <Text style={styles.appName}>Koin</Text>
            <Text style={styles.tagline}>Personal Finance Tracker</Text>
          </Animated.View>

          {/* Features */}
          <View style={styles.features}>
            {[
              { icon: 'flash-on', text: 'Track expenses in under 3 seconds' },
              { icon: 'lightbulb', text: 'Smart suggestions that learn your habits' },
              { icon: 'cloud-done', text: 'Sync across devices with cloud backup' },
              { icon: 'fingerprint', text: 'Secure with Face ID / Biometrics' },
            ].map((item, index) => (
              <Animated.View key={item.icon} entering={FadeInDown.delay(200 + index * 80).springify().damping(18)}>
                <FeatureRow icon={item.icon} text={item.text} />
              </Animated.View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={handleAnonymousLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <MaterialIcons name="login" size={22} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={handleSkip}
            >
              <Text style={styles.secondaryButtonText}>Continue Offline</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Sign in anonymously to enable cloud sync.{'\n'}
              No personal data collected.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <MaterialIcons name={icon as any} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    gap: 12,
  },
  mascotImage: {
    width: 140,
    height: 140,
    marginBottom: 8,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  features: {
    gap: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    gap: 14,
  },
  errorText: {
    color: Colors.expense,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Elevation.elevationBrand,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderMedium,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  disclaimer: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
