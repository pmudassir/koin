import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Transaction, CATEGORY_COLORS, Category } from '../models/Transaction';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation } from '../theme';
import { getCustomCategories, CustomCategory, onCustomCategoriesChange } from '../storage/categoryStorage';

// Module-level cache to avoid repeated MMKV reads on every render
let _cachedCustomCategories: CustomCategory[] | null = null;
function getCachedCustomCategories(): CustomCategory[] {
  if (!_cachedCustomCategories) {
    _cachedCustomCategories = getCustomCategories();
  }
  return _cachedCustomCategories;
}
// Auto-invalidate when categories change
onCustomCategoriesChange(() => { _cachedCustomCategories = null; });

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
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

function getCategoryIcon(category: string): keyof typeof MaterialIcons.glyphMap {
  if (ICON_MAP[category]) return ICON_MAP[category];
  const custom = getCachedCustomCategories().find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );
  if (custom) return custom.icon as keyof typeof MaterialIcons.glyphMap;
  return 'more-horiz';
}

function getCategoryColor(category: string): { bg: string; text: string } {
  if (CATEGORY_COLORS[category as Category]) {
    return CATEGORY_COLORS[category as Category];
  }
  const custom = getCachedCustomCategories().find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );
  if (custom) return { bg: `${custom.color}30`, text: custom.color };
  return CATEGORY_COLORS.Others;
}

interface Props {
  transaction: Transaction;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMerchantPress?: (merchant: string) => void;
}

function TransactionItem({ transaction, onPress, onEdit, onDelete, onMerchantPress }: Props) {
  const categoryColor = getCategoryColor(transaction.category);
  const iconName = getCategoryIcon(transaction.category);
  const swipeableRef = useRef<Swipeable>(null);

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

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete?.();
        }}
        style={styles.actionRightWrapper}
      >
        <Animated.View style={[styles.actionRight, { transform: [{ scale }] }]}>
          <MaterialIcons name="delete-outline" size={22} color={Colors.white} />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          swipeableRef.current?.close();
          onEdit?.();
        }}
        style={styles.actionLeftWrapper}
      >
        <Animated.View style={[styles.actionLeft, { transform: [{ scale }] }]}>
          <MaterialIcons name="edit" size={22} color={Colors.white} />
          <Text style={styles.actionText}>Edit</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      renderLeftActions={onEdit ? renderLeftActions : undefined}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      onSwipeableWillOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={[styles.iconCircle, { backgroundColor: categoryColor.bg }]}>
          <MaterialIcons name={iconName} size={22} color={categoryColor.text} />
        </View>
        <View style={styles.info}>
          <Text
            style={styles.merchant}
            numberOfLines={1}
            onPress={onMerchantPress ? () => onMerchantPress(transaction.merchant) : undefined}
          >
            {transaction.merchant}
          </Text>
          <Text style={styles.subtitle}>
            {transaction.category} • {formatTime(transaction.timestamp)}
          </Text>
        </View>
        <Text style={[
          styles.amount,
          transaction.type === 'income' && styles.amountIncome,
        ]}>
          {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionLeftWrapper: {
    width: 85,
  },
  actionRightWrapper: {
    width: 85,
  },
  actionLeft: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginRight: 6,
    gap: 4,
  },
  actionRight: {
    flex: 1,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginLeft: 6,
    gap: 4,
  },
  actionText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Elevation.elevation1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  merchant: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  amountIncome: {
    color: Colors.income,
  },
});

export default React.memo(TransactionItem);
