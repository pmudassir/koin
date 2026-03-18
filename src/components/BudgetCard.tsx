import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Elevation } from '../theme';

interface Props {
  budget: number;
  spent: number;
  label?: string;
}

export default function BudgetCard({ budget, spent, label = 'Daily Budget' }: Props) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = spent > budget;
  const remaining = budget - spent;

  return (
    <View style={styles.container}>
      {/* Violet left accent bar */}
      <View style={[
        styles.accentBar,
        isOverBudget && styles.accentBarOver,
      ]} />
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Text style={styles.label}>{label.toUpperCase()}</Text>
          {isOverBudget && (
            <Text style={styles.overBudget}>Over budget!</Text>
          )}
        </View>
        <View style={styles.amountRow}>
          <Text style={[styles.amount, isOverBudget && styles.overBudgetAmount]}>
            {isOverBudget ? '-' : ''}₹{Math.abs(remaining).toLocaleString('en-IN')}
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
                backgroundColor: isOverBudget
                  ? Colors.expense
                  : percentage > 80
                    ? Colors.warning
                    : Colors.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Elevation.elevation2,
  },
  accentBar: {
    width: 4,
    backgroundColor: Colors.primary,
  },
  accentBarOver: {
    backgroundColor: Colors.expense,
  },
  inner: {
    flex: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  overBudget: {
    color: Colors.expense,
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
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  overBudgetAmount: {
    color: Colors.expense,
  },
  totalBudget: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.borderSubtle,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
