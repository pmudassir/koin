import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { isBiometricsEnabled, authenticateWithBiometrics } from '../services/security';

import HomeScreen from '../screens/HomeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SmartSuggestionsScreen from '../screens/SmartSuggestionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AllTransactionsScreen from '../screens/AllTransactionsScreen';
import PendingScreen from '../screens/PendingScreen';

import LoginScreen from '../screens/LoginScreen';
import { getItem, setItem, STORAGE_KEYS } from '../storage/mmkv';

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
      <View style={lockStyles.iconWrapper}>
        <MaterialIcons name="lock" size={48} color={Colors.primary} />
      </View>
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
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.slate100,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.slate400,
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
  return (
    <TouchableOpacity
      style={styles.fabTab}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.fabTabInner}>{children}</View>
    </TouchableOpacity>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.slate500,
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
    if (isLoggedIn && isBiometricsEnabled()) {
      setIsLocked(true);
    }
    setInitialCheckDone(true);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const wasBackground = appState.current === 'background';
      const isNowActive = nextAppState === 'active';
      const cooldownPassed = Date.now() - lastUnlockTime.current > 3000;

      if (wasBackground && isNowActive && isBiometricsEnabled() && cooldownPassed) {
        setIsLocked(true);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isLoggedIn]);

  if (!initialCheckDone) return null;

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
        MainTabs: 'main',
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: Colors.backgroundDark },
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(16, 25, 34, 0.95)',
    borderTopColor: 'rgba(30, 41, 59, 0.8)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
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
