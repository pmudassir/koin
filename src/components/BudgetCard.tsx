import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';

interface Props {
  budget: number;
  spent: number;
  label?: string;
}

export default function BudgetCard({ budget, spent, label = 'Daily Budget' }: Props) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = spent > budget;
  const remaining = Math.max(budget - spent, 0);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        {isOverBudget && (
          <Text style={styles.overBudget}>Over budget!</Text>
        )}
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>
          ₹{remaining.toLocaleString('en-IN')}
        </Text>
        <Text style={styles.totalBudget}>
          / ₹{budget.toLocaleString('en-IN')}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: isOverBudget ? '#ef4444' : percentage > 80 ? '#f59e0b' : Colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(19, 127, 236, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(19, 127, 236, 0.15)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  overBudget: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 6,
  },
  amount: {
    color: Colors.slate100,
    fontSize: 22,
    fontWeight: '700',
  },
  totalBudget: {
    color: Colors.slate500,
    fontSize: 14,
    fontWeight: '500',
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.slate700,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
