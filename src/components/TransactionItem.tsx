import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Transaction, CATEGORY_COLORS, Category } from '../models/Transaction';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

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

const SWIPE_THRESHOLD = 80;

interface Props {
  transaction: Transaction;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TransactionItem({ transaction, onPress, onEdit, onDelete }: Props) {
  const categoryColor = CATEGORY_COLORS[transaction.category as Category] || CATEGORY_COLORS.Others;
  const iconName = ICON_MAP[transaction.category] || 'more-horiz';
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        if (isAnimating.current) return;
        // Clamp between -120 and 120
        const dx = Math.max(-120, Math.min(120, gestureState.dx));
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating.current) return;
        isAnimating.current = true;

        if (gestureState.dx < -SWIPE_THRESHOLD && onDelete) {
          // Swipe left → Delete
          Animated.spring(translateX, {
            toValue: -120,
            useNativeDriver: true,
            friction: 8,
          }).start(() => {
            isAnimating.current = false;
          });
          setTimeout(() => {
            onDelete();
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }).start(() => {
              isAnimating.current = false;
            });
          }, 300);
        } else if (gestureState.dx > SWIPE_THRESHOLD && onEdit) {
          // Swipe right → Edit
          Animated.spring(translateX, {
            toValue: 120,
            useNativeDriver: true,
            friction: 8,
          }).start(() => {
            isAnimating.current = false;
          });
          setTimeout(() => {
            onEdit();
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }).start(() => {
              isAnimating.current = false;
            });
          }, 300);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start(() => {
            isAnimating.current = false;
          });
        }
      },
    })
  ).current;

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

  // Background actions opacity
  const editOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const deleteOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      {/* Edit action (left swipe reveal) */}
      <Animated.View style={[styles.actionLeft, { opacity: editOpacity }]}>
        <MaterialIcons name="edit" size={22} color={Colors.white} />
        <Text style={styles.actionText}>Edit</Text>
      </Animated.View>

      {/* Delete action (right swipe reveal) */}
      <Animated.View style={[styles.actionRight, { opacity: deleteOpacity }]}>
        <Text style={styles.actionText}>Delete</Text>
        <MaterialIcons name="delete" size={22} color={Colors.white} />
      </Animated.View>

      {/* Main content */}
      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.inner}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
  },
  actionRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
  },
  actionText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  container: {
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
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
