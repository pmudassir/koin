import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';

interface Props {
  budget: number;
  spent: number;
}

export default function BudgetCard({ budget, spent }: Props) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = spent > budget;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>DAILY BUDGET</Text>
      <Text style={styles.amount}>
        ₹{budget.toLocaleString('en-IN')}
      </Text>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: isOverBudget ? '#ef4444' : Colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(19, 127, 236, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  label: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  amount: {
    color: Colors.slate100,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.slate700,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
