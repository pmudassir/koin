import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { initFirebase, signIn } from '../services/firebase';

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>₹</Text>
            </View>
            <Text style={styles.appName}>Koin</Text>
            <Text style={styles.tagline}>Personal Finance Tracker</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <FeatureRow icon="flash-on" text="Track expenses in under 3 seconds" />
            <FeatureRow icon="lightbulb" text="Smart suggestions that learn your habits" />
            <FeatureRow icon="cloud-done" text="Sync across devices with cloud backup" />
            <FeatureRow icon="fingerprint" text="Secure with Face ID / Biometrics" />
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
    backgroundColor: Colors.backgroundDark,
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
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(19, 127, 236, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(19, 127, 236, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    color: Colors.primary,
    fontSize: 40,
    fontWeight: '700',
  },
  appName: {
    color: Colors.slate100,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.slate400,
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
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: Colors.slate300,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    gap: 14,
  },
  errorText: {
    color: '#ef4444',
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
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
    borderColor: 'rgba(30, 41, 59, 0.8)',
  },
  secondaryButtonText: {
    color: Colors.slate400,
    fontSize: 15,
    fontWeight: '600',
  },
  disclaimer: {
    color: Colors.slate600,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
