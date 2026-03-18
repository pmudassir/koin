import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  AppState,
  AppStateStatus,
  Image,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme';
import { isBiometricsEnabled, isBiometricsAvailable, authenticateWithBiometrics } from '../services/security';
import { ToastProvider, ConfirmDialog } from '../components/Toast';

import HomeScreen from '../screens/HomeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SmartSuggestionsScreen from '../screens/SmartSuggestionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AllTransactionsScreen from '../screens/AllTransactionsScreen';
import PendingScreen from '../screens/PendingScreen';
import MerchantDetailScreen from '../screens/MerchantDetailScreen';

import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { getItem, setItem, STORAGE_KEYS } from '../storage/mmkv';
import { processRecurringTransactions } from '../services/recurringProcessor';
import { setupNotifications } from '../services/notificationService';
import { initWidgets } from '../services/widgetBridge';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Lock Screen ──────────────────────────────────
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [error, setError] = useState(false);

  const authenticate = async () => {
    setError(false);
    const success = await authenticateWithBiometrics();
    if (success) {
      onUnlock();
    } else {
      setError(true);
    }
  };

  useEffect(() => {
    authenticate();
  }, []);

  return (
    <View style={lockStyles.container}>
      <Image
        source={require('../../assets/mascot/mascot-idle.png')}
        style={lockStyles.mascotImage}
      />
      <Text style={lockStyles.title}>Koin is Locked</Text>
      <Text style={lockStyles.subtitle}>Authenticate to continue</Text>
      {error && (
        <Text style={lockStyles.error}>Authentication failed</Text>
      )}
      <TouchableOpacity style={lockStyles.button} onPress={authenticate}>
        <MaterialIcons name="fingerprint" size={28} color={Colors.white} />
        <Text style={lockStyles.buttonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const lockStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mascotImage: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

// ─── Tab Bar ──────────────────────────────────
function CustomTabBarButton({ children, onPress }: any) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 300 });
    rotation.value = withSpring(45, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    rotation.value = withSpring(0, { damping: 12, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.fabTab}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.fabTabInner, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 28 : 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          ...styles.tabBar,
          height: 56 + bottomPadding,
          paddingBottom: bottomPadding,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="bar-chart" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={View}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="add" size={28} color={Colors.white} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
          tabBarLabel: () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('AddExpense');
          },
        })}
      />
      <Tab.Screen
        name="Wallet"
        component={SmartSuggestionsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-balance-wallet" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Main Navigator ──────────────────────────────────
export default function AppNavigator() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return getItem<boolean>(STORAGE_KEYS.HAS_SEEN_ONBOARDING) === true;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return getItem<boolean>(STORAGE_KEYS.HAS_ONBOARDED) === true;
  });
  const [isLocked, setIsLocked] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const appState = useRef(AppState.currentState);
  const lastUnlockTime = useRef(0);

  const handleLogin = () => {
    setItem(STORAGE_KEYS.HAS_ONBOARDED, true);
    setIsLoggedIn(true);
  };

  const handleUnlock = () => {
    lastUnlockTime.current = Date.now();
    setIsLocked(false);
  };

  useEffect(() => {
    const checkLock = async () => {
      if (isLoggedIn && isBiometricsEnabled()) {
        const available = await isBiometricsAvailable();
        if (available) {
          setIsLocked(true);
        }
      }
      setInitialCheckDone(true);
      // Process recurring transactions on startup
      processRecurringTransactions();
      // Setup push notifications
      setupNotifications();
      // Initialize widgets
      initWidgets();
    };
    checkLock();

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const wasBackground = appState.current === 'background';
      const isNowActive = nextAppState === 'active';
      const cooldownPassed = Date.now() - lastUnlockTime.current > 3000;

      if (wasBackground && isNowActive) {
        // Process recurring transactions on foreground
        processRecurringTransactions();

        if (isBiometricsEnabled() && cooldownPassed) {
          const available = await isBiometricsAvailable();
          if (available) {
            setIsLocked(true);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isLoggedIn]);

  if (!initialCheckDone) return null;

  // Show onboarding on first ever launch
  if (!hasSeenOnboarding) {
    return (
      <OnboardingScreen
        onDone={() => {
          setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, true);
          setHasSeenOnboarding(true);
        }}
      />
    );
  }

  // Show login screen if not onboarded
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show lock screen if biometrics enabled
  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const linking = {
    prefixes: ['koin://'],
    config: {
      screens: {
        AddExpense: 'add',
        MainTabs: 'main',
      },
    },
  };

  return (
    <ToastProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: Colors.canvas },
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="AllTransactions"
            component={AllTransactionsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Pending"
            component={PendingScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="MerchantDetail"
            component={MerchantDetailScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <ConfirmDialog />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.borderSubtle,
    borderTopWidth: 1,
    paddingTop: 8,
    elevation: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  fabTab: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabTabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
