import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { isBiometricsEnabled, setBiometricsEnabled } from '../services/security';
import { getDailyBudget, setDailyBudget } from '../storage/transactionStorage';

export default function SettingsScreen() {
  const [biometrics, setBiometrics] = useState(isBiometricsEnabled());
  const [cloudSync, setCloudSync] = useState(false);
  const [budget, setBudget] = useState(getDailyBudget());

  const toggleBiometrics = (value: boolean) => {
    setBiometrics(value);
    setBiometricsEnabled(value);
  };

  const handleBudgetChange = () => {
    Alert.prompt(
      'Daily Budget',
      'Set your daily spending limit (₹)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (value?: string) => {
            const num = parseFloat(value || '0');
            if (num > 0) {
              setBudget(num);
              setDailyBudget(num);
            }
          },
        },
      ],
      'plain-text',
      budget.toString(),
      'number-pad'
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>K</Text>
            </View>
            <Text style={styles.profileName}>Koin User</Text>
            <Text style={styles.profileEmail}>Personal Finance</Text>
          </View>

          {/* Security */}
          <Text style={styles.sectionLabel}>SECURITY</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
                  <MaterialIcons name="fingerprint" size={20} color="#60a5fa" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Face ID / Biometrics</Text>
                  <Text style={styles.settingSubtitle}>Lock app on close</Text>
                </View>
              </View>
              <Switch
                value={biometrics}
                onValueChange={toggleBiometrics}
                trackColor={{ false: Colors.slate700, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* Budget */}
          <Text style={styles.sectionLabel}>BUDGET</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingRow} onPress={handleBudgetChange}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(5, 150, 105, 0.15)' }]}>
                  <MaterialIcons name="account-balance-wallet" size={20} color="#34d399" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Daily Budget</Text>
                  <Text style={styles.settingSubtitle}>
                    ₹{budget.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.slate500} />
            </TouchableOpacity>
          </View>

          {/* Sync */}
          <Text style={styles.sectionLabel}>DATA</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(234, 88, 12, 0.15)' }]}>
                  <MaterialIcons name="cloud-upload" size={20} color="#fb923c" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Cloud Sync</Text>
                  <Text style={styles.settingSubtitle}>Firebase backup</Text>
                </View>
              </View>
              <Switch
                value={cloudSync}
                onValueChange={setCloudSync}
                trackColor={{ false: Colors.slate700, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* About */}
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(147, 51, 234, 0.15)' }]}>
                  <MaterialIcons name="info-outline" size={20} color="#c084fc" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Koin</Text>
                  <Text style={styles.settingSubtitle}>Version 1.0.0</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: Colors.slate100,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.slate800,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarLargeText: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  profileName: {
    color: Colors.slate100,
    fontSize: 20,
    fontWeight: '700',
  },
  profileEmail: {
    color: Colors.slate400,
    fontSize: 14,
  },
  sectionLabel: {
    color: Colors.slate500,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  settingsGroup: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: '600',
  },
  settingSubtitle: {
    color: Colors.slate400,
    fontSize: 13,
    marginTop: 2,
  },
});
