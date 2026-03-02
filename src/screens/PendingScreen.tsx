import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../theme';
import { Category, CATEGORY_COLORS } from '../models/Transaction';
import { updateTransaction } from '../storage/transactionStorage';

interface CategoryOption {
  name: Category;
  icon: keyof typeof MaterialIcons.glyphMap;
  colors: { bg: string; text: string };
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { name: 'Food', icon: 'restaurant', colors: { bg: 'rgba(234, 88, 12, 0.15)', text: '#fb923c' } },
  { name: 'Transport', icon: 'directions-car', colors: { bg: 'rgba(37, 99, 235, 0.15)', text: '#60a5fa' } },
  { name: 'Shopping', icon: 'shopping-bag', colors: { bg: 'rgba(147, 51, 234, 0.15)', text: '#c084fc' } },
  { name: 'Bills', icon: 'receipt-long', colors: { bg: 'rgba(22, 163, 74, 0.15)', text: '#4ade80' } },
  { name: 'Health', icon: 'favorite', colors: { bg: 'rgba(220, 38, 38, 0.15)', text: '#f87171' } },
  { name: 'Others', icon: 'more-horiz', colors: { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8' } },
];

export default function PendingScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {
    transactionId,
    amount = 300,
    merchant = 'Unknown',
    timestamp = Date.now(),
  } = route.params || {};

  const handleCategorySelect = (category: Category) => {
    if (transactionId) {
      updateTransaction(transactionId, { category });
    }
    navigation.goBack();
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const time = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `Today, ${time}`;
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="chevron-left" size={28} color={Colors.slate100} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pending</Text>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="more-horiz" size={24} color={Colors.slate100} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Transaction Detail */}
          <View style={styles.detailSection}>
            <View style={styles.merchantIcon}>
              <MaterialIcons name="local-cafe" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.questionText}>
              What was ₹{amount.toLocaleString('en-IN')} for?
            </Text>
            <Text style={styles.merchantInfo}>
              {merchant} • {formatTime(timestamp)}
            </Text>
          </View>

          {/* Category Grid */}
          <View style={styles.categoryGrid}>
            {CATEGORY_OPTIONS.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={styles.categoryCard}
                activeOpacity={0.7}
                onPress={() => handleCategorySelect(cat.name)}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.colors.bg }]}>
                  <MaterialIcons name={cat.icon} size={24} color={cat.colors.text} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.slate100,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  detailSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  merchantIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 127, 236, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  questionText: {
    color: Colors.slate100,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  merchantInfo: {
    color: Colors.slate400,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 16,
  },
  categoryCard: {
    width: '47%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: Colors.slate100,
    fontSize: 14,
    fontWeight: '600',
  },
});
