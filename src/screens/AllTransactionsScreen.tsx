import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { showConfirm } from '../components/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors } from '../theme';
import { Transaction } from '../models/Transaction';
import { getTransactions, deleteTransaction } from '../storage/transactionStorage';
import TransactionItem from '../components/TransactionItem';

interface GroupedTransactions {
  date: string;
  dateLabel: string;
  transactions: Transaction[];
  total: number;
}

function groupByDate(transactions: Transaction[]): GroupedTransactions[] {
  const groups: Record<string, Transaction[]> = {};

  for (const txn of transactions) {
    const date = new Date(txn.timestamp).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  return Object.entries(groups).map(([dateStr, txns]) => {
    const date = new Date(dateStr);
    let dateLabel: string;

    if (date.toDateString() === now.toDateString()) {
      dateLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });
    }

    return {
      date: dateStr,
      dateLabel,
      transactions: txns,
      total: txns.reduce((sum, t) => sum + t.amount, 0),
    };
  });
}

export default function AllTransactionsScreen() {
  const navigation = useNavigation<any>();
  const [groups, setGroups] = useState<GroupedTransactions[]>([]);

  const loadData = useCallback(() => {
    const all = getTransactions();
    setGroups(groupByDate(all));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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

  const renderGroup = ({ item }: { item: GroupedTransactions }) => (
    <View style={styles.group}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{item.dateLabel}</Text>
        <Text style={styles.dateTotal}>
          -₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.txnList}>
        {item.transactions.map((txn) => (
          <TransactionItem
            key={txn.id}
            transaction={txn}
            onEdit={() => handleEdit(txn)}
            onDelete={() => handleDelete(txn)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.slate100} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Transactions</Text>
          <View style={{ width: 40 }} />
        </View>

        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={64} color={Colors.slate700} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your expenses</Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.slate100,
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  group: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    color: Colors.slate300,
    fontSize: 14,
    fontWeight: '600',
  },
  dateTotal: {
    color: Colors.slate500,
    fontSize: 13,
    fontWeight: '500',
  },
  txnList: {
    gap: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: Colors.slate400,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.slate500,
    fontSize: 14,
  },
});
