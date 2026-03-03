import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl
} from 'react-native';
import { showToast } from '../components/Toast';
import { showConfirm } from '../components/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors } from '../theme';
import { Transaction } from '../models/Transaction';
import {
  getTransactionsForDay,
  getTodayTotal,
  getDailyBudget,
  deleteTransaction,
  getBudgetPeriod,
  getPeriodTotal,
  getWeeklyTotal,
  getMonthlyTotal,
} from '../storage/transactionStorage';
import TransactionItem from '../components/TransactionItem';
import BudgetCard from '../components/BudgetCard';
import { setupShareListener } from '../services/shareExtensionBridge';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [periodTotal, setPeriodTotal] = useState(0);
  const [budget, setBudget] = useState(2500);
  const [budgetPeriod, setBudgetPeriodState] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    const period = getBudgetPeriod();
    setBudgetPeriodState(period);
    setPeriodTotal(getPeriodTotal());
    setBudget(getDailyBudget());
    setRecentTransactions(getTransactionsForDay(new Date()).slice(0, 5));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Listen for share extension data when app comes to foreground
  useEffect(() => {
    const cleanup = setupShareListener(() => {
      loadData();
      showToast({
        type: 'success',
        title: 'Transaction Added',
        message: 'A shared transaction was automatically added.',
      });
    });
    return cleanup;
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleDelete = (txn: Transaction) => {
    showConfirm({
      title: 'Delete Transaction',
      message: `Delete "${txn.merchant}" — ₹${txn.amount.toLocaleString('en-IN')}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        deleteTransaction(txn.id);
        loadData();
      },
    });
  };

  const handleEdit = (txn: Transaction) => {
    navigation.navigate('AddExpense', { transaction: txn });
  };

  const periodLabel = budgetPeriod === 'daily' ? 'Today' : budgetPeriod === 'weekly' ? 'This Week' : 'This Month';
  const budgetLabel = budgetPeriod.charAt(0).toUpperCase() + budgetPeriod.slice(1) + ' Budget';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>K</Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.dateText}>{periodLabel}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <MaterialIcons name="notifications-none" size={24} color={Colors.slate300} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Total Spent */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Spent {periodLabel}</Text>
            <Text style={styles.totalAmount}>
              ₹{periodTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Budget Card */}
          <View style={styles.budgetSection}>
            <BudgetCard budget={budget} spent={periodTotal} label={budgetLabel} />
          </View>

          {/* Recent Transactions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllTransactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color={Colors.slate700} />
              <Text style={styles.emptyText}>No transactions today</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
            </View>
          ) : (
            <View style={styles.txnList}>
              {recentTransactions.map((txn) => (
                <TransactionItem
                  key={txn.id}
                  transaction={txn}
                  onEdit={() => handleEdit(txn)}
                  onDelete={() => handleDelete(txn)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* FAB removed — using tab bar + button instead */}
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.slate800,
    borderWidth: 2,
    borderColor: 'rgba(19, 127, 236, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  welcomeText: {
    color: Colors.slate400,
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    color: Colors.slate100,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  totalSection: {
    paddingVertical: 24,
  },
  totalLabel: {
    color: Colors.slate400,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    color: Colors.slate100,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  budgetSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.slate100,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAll: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  txnList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    color: Colors.slate400,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.slate500,
    fontSize: 13,
  },
});
