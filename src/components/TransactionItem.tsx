import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Transaction, CATEGORY_COLORS, Category } from '../models/Transaction';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

const ICON_MAP: Record<Category, keyof typeof MaterialIcons.glyphMap> = {
  Food: 'restaurant',
  Transport: 'directions-car',
  Groceries: 'shopping-cart',
  Bills: 'receipt-long',
  Shopping: 'shopping-bag',
  Health: 'favorite',
  Transfer: 'swap-horiz',
  Entertainment: 'movie',
  Others: 'more-horiz',
};

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

export default function TransactionItem({ transaction, onPress }: Props) {
  const categoryColor = CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS.Others;
  const iconName = ICON_MAP[transaction.category] || 'more-horiz';

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return time;
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: categoryColor.bg }]}>
        <MaterialIcons name={iconName} size={22} color={categoryColor.text} />
      </View>
      <View style={styles.info}>
        <Text style={styles.merchant} numberOfLines={1}>
          {transaction.merchant}
        </Text>
        <Text style={styles.subtitle}>
          {transaction.category} • {formatTime(transaction.timestamp)}
        </Text>
      </View>
      <Text style={styles.amount}>
        -₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  merchant: {
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.slate400,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: '700',
  },
});
