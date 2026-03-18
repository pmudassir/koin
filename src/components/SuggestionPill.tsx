import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation } from '../theme';
import { Suggestion } from '../services/suggestions';

// Opaque Tailwind 100-shade backgrounds + 600-shade icons for light theme
const SUGGESTION_ICON_MAP: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; bg: string; text: string; border: string }> = {
  Food: { icon: 'restaurant', bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' },
  Transport: { icon: 'directions-car', bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
  Groceries: { icon: 'shopping-cart', bg: '#FEF9C3', text: '#CA8A04', border: '#FEF08A' },
  Bills: { icon: 'receipt-long', bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
  Shopping: { icon: 'shopping-bag', bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF' },
  Health: { icon: 'favorite', bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  Others: { icon: 'more-horiz', bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' },
  Transfer: { icon: 'swap-horiz', bg: '#CFFAFE', text: '#0891B2', border: '#A5F3FC' },
  Entertainment: { icon: 'movie', bg: '#FDF4FF', text: '#C026D3', border: '#F5D0FE' },
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
        style={[styles.card, { backgroundColor: style.bg, borderColor: style.border }]}
        activeOpacity={0.7}
        onPress={() => onPress(suggestion)}
      >
        <MaterialIcons name={style.icon} size={22} color={style.text} />
        <View>
          <Text style={styles.cardMerchant}>{suggestion.merchant}</Text>
          <Text style={styles.cardAmount}>
            Avg. ₹{suggestion.amount.toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.pill, { backgroundColor: style.bg, borderColor: style.border }]}
      activeOpacity={0.7}
      onPress={() => onPress(suggestion)}
    >
      <MaterialIcons name={style.icon} size={18} color={style.text} />
      <View>
        <Text style={styles.pillMerchant}>{suggestion.merchant}</Text>
        <Text style={[styles.pillAmount, { color: style.text }]}>
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
    color: Colors.textPrimary,
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
    ...Elevation.elevation1,
  },
  cardMerchant: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  cardAmount: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
