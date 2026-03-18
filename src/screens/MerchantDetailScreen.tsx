import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Elevation } from '../theme';
import { getTransactions } from '../storage/transactionStorage';
import TransactionItem from '../components/TransactionItem';
import { Transaction } from '../models/Transaction';

interface MerchantStats {
  totalSpent: number;
  totalIncome: number;
  count: number;
  avgAmount: number;
  firstDate: number;
  lastDate: number;
  monthlyFrequency: number;
  transactions: Transaction[];
  monthlyTrend: { month: string; amount: number }[];
}

function computeStats(merchant: string): MerchantStats {
  const allTxns = getTransactions();
  const txns = allTxns.filter(
    (t) => t.merchant.toLowerCase() === merchant.toLowerCase(),
  );

  if (txns.length === 0) {
    return {
      totalSpent: 0,
      totalIncome: 0,
      count: 0,
      avgAmount: 0,
      firstDate: 0,
      lastDate: 0,
      monthlyFrequency: 0,
      transactions: [],
      monthlyTrend: [],
    };
  }

  const sorted = [...txns].sort((a, b) => a.timestamp - b.timestamp);
  const expenses = txns.filter((t) => t.type !== 'income');
  const income = txns.filter((t) => t.type === 'income');
  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  // Monthly frequency
  const firstDate = sorted[0].timestamp;
  const lastDate = sorted[sorted.length - 1].timestamp;
  const monthSpan = Math.max(
    1,
    (lastDate - firstDate) / (30 * 24 * 60 * 60 * 1000),
  );
  const monthlyFrequency = Math.round((txns.length / monthSpan) * 10) / 10;

  // Monthly trend (last 6 months)
  const now = new Date();
  const monthlyTrend: { month: string; amount: number }[] = [];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = d.getTime();
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const mAmount = expenses
      .filter((t) => t.timestamp >= mStart && t.timestamp <= mEnd)
      .reduce((s, t) => s + t.amount, 0);
    monthlyTrend.push({
      month: MONTHS[d.getMonth()],
      amount: mAmount,
    });
  }

  return {
    totalSpent,
    totalIncome,
    count: txns.length,
    avgAmount: expenses.length > 0 ? totalSpent / expenses.length : 0,
    firstDate,
    lastDate,
    monthlyFrequency,
    transactions: [...txns].sort((a, b) => b.timestamp - a.timestamp),
    monthlyTrend,
  };
}

export default function MerchantDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const merchant = route.params?.merchant || 'Unknown';

  const stats = useMemo(() => computeStats(merchant), [merchant]);
  const maxTrendAmount = useMemo(
    () => Math.max(...stats.monthlyTrend.map((m) => m.amount), 1),
    [stats.monthlyTrend],
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="chevron-left" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {merchant}
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>
                ₹{Math.round(stats.totalSpent).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{stats.count}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Amount</Text>
              <Text style={styles.statValue}>
                ₹{Math.round(stats.avgAmount).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Frequency</Text>
              <Text style={styles.statValue}>
                {stats.monthlyFrequency}/mo
              </Text>
            </View>
          </View>

          {/* Mini Trend Chart */}
          {stats.monthlyTrend.length > 0 && (
            <View style={styles.trendSection}>
              <Text style={styles.sectionTitle}>Monthly Trend</Text>
              <View style={styles.trendChart}>
                {stats.monthlyTrend.map((m, i) => {
                  const height = maxTrendAmount > 0
                    ? Math.max(4, (m.amount / maxTrendAmount) * 80)
                    : 4;
                  return (
                    <View key={i} style={styles.trendBarWrapper}>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            height,
                            backgroundColor: m.amount > 0 ? Colors.primary : Colors.borderSubtle,
                          },
                        ]}
                      />
                      <Text style={styles.trendLabel}>{m.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* All Transactions */}
          <Text style={styles.sectionTitle}>All Transactions</Text>
          <View style={styles.transactionsList}>
            {stats.transactions.map((txn) => (
              <TransactionItem key={txn.id} transaction={txn} />
            ))}
          </View>

          {stats.count === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="store" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.elevation1,
  },
  headerTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Elevation.elevation1,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  trendSection: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Elevation.elevation1,
  },
  trendBarWrapper: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  trendBar: {
    width: 20,
    borderRadius: 6,
  },
  trendLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
  },
  transactionsList: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
});
