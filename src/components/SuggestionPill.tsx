import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { Suggestion } from '../services/suggestions';

const SUGGESTION_ICON_MAP: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; bg: string; text: string }> = {
  Food: { icon: 'restaurant', bg: 'rgba(234, 88, 12, 0.2)', text: '#fb923c' },
  Transport: { icon: 'directions-car', bg: 'rgba(37, 99, 235, 0.2)', text: '#60a5fa' },
  Groceries: { icon: 'shopping-cart', bg: 'rgba(5, 150, 105, 0.2)', text: '#34d399' },
  Bills: { icon: 'receipt-long', bg: 'rgba(5, 150, 105, 0.2)', text: '#34d399' },
  Shopping: { icon: 'shopping-bag', bg: 'rgba(147, 51, 234, 0.2)', text: '#c084fc' },
  Health: { icon: 'favorite', bg: 'rgba(220, 38, 38, 0.2)', text: '#f87171' },
  Others: { icon: 'more-horiz', bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8' },
  Transfer: { icon: 'swap-horiz', bg: 'rgba(6, 182, 212, 0.2)', text: '#22d3ee' },
  Entertainment: { icon: 'movie', bg: 'rgba(219, 39, 119, 0.2)', text: '#f472b6' },
};

interface Props {
  suggestion: Suggestion;
  onPress: (suggestion: Suggestion) => void;
  variant?: 'pill' | 'card';
}

export function SuggestionPill({ suggestion, onPress, variant = 'pill' }: Props) {
  const style = SUGGESTION_ICON_MAP[suggestion.category] || SUGGESTION_ICON_MAP.Others;

  if (variant === 'card') {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: style.bg, borderColor: `${style.text}30` }]}
        activeOpacity={0.7}
        onPress={() => onPress(suggestion)}
      >
        <MaterialIcons name={style.icon} size={22} color={style.text} />
        <View>
          <Text style={styles.cardMerchant}>{suggestion.merchant}</Text>
          <Text style={[styles.cardAmount, { color: Colors.slate400 }]}>
            Avg. ₹{suggestion.amount.toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.pill, { backgroundColor: style.bg, borderColor: `${style.text}30` }]}
      activeOpacity={0.7}
      onPress={() => onPress(suggestion)}
    >
      <MaterialIcons name={style.icon} size={18} color={style.text} />
      <View>
        <Text style={styles.pillMerchant}>{suggestion.merchant}</Text>
        <Text style={[styles.pillAmount, { color: `${style.text}CC` }]}>
          ₹{suggestion.amount.toLocaleString('en-IN')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillMerchant: {
    color: Colors.slate100,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  pillAmount: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardMerchant: {
    color: Colors.slate100,
    fontSize: 14,
    fontWeight: '600',
  },
  cardAmount: {
    fontSize: 12,
  },
});
