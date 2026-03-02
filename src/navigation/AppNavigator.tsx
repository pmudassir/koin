import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SmartSuggestionsScreen from '../screens/SmartSuggestionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import PendingScreen from '../screens/PendingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="home"
              size={24}
              color={color}
            />
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

export default function AppNavigator() {
  return (
    <NavigationContainer>
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
