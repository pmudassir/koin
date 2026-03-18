import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeInDown,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Elevation } from '../theme';
import { Category } from '../models/Transaction';
import { updateTransaction } from '../storage/transactionStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface PendingItem {
  transactionId: string;
  amount: number;
  merchant: string;
  timestamp: number;
  suggestedCategory?: Category;
}

interface CategoryOption {
  name: Category;
  icon: keyof typeof MaterialIcons.glyphMap;
  bg: string;
  iconColor: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { name: 'Food', icon: 'restaurant', bg: '#FFEDD5', iconColor: '#EA580C' },
  { name: 'Transport', icon: 'directions-car', bg: '#DBEAFE', iconColor: '#2563EB' },
  { name: 'Shopping', icon: 'shopping-bag', bg: '#F3E8FF', iconColor: '#9333EA' },
  { name: 'Bills', icon: 'receipt-long', bg: '#DCFCE7', iconColor: '#16A34A' },
  { name: 'Groceries', icon: 'shopping-cart', bg: '#FEF3C7', iconColor: '#D97706' },
  { name: 'Health', icon: 'favorite', bg: '#FEE2E2', iconColor: '#DC2626' },
  { name: 'Entertainment', icon: 'movie', bg: '#E0E7FF', iconColor: '#4F46E5' },
  { name: 'Transfer', icon: 'swap-horiz', bg: '#CCFBF1', iconColor: '#0D9488' },
  { name: 'Others', icon: 'more-horiz', bg: '#F1F5F9', iconColor: '#64748B' },
];

function SwipeableCard({
  item,
  onCategorize,
  onSkip,
  isTop,
}: {
  item: PendingItem;
  onCategorize: (id: string, category: Category) => void;
  onSkip: (id: string) => void;
  isTop: boolean;
}) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(isTop ? 1 : 0.95);
  const [showGrid, setShowGrid] = useState(false);

  const onSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right' && item.suggestedCategory) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onCategorize(item.transactionId, item.suggestedCategory);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSkip(item.transactionId);
      }
    },
    [item, onCategorize, onSkip],
  );

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotate.value = (e.translationX / SCREEN_WIDTH) * 15;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        rotate.value = withTiming(30, { duration: 300 });
        runOnJS(onSwipeComplete)('right');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        rotate.value = withTiming(-30, { duration: 300 });
        runOnJS(onSwipeComplete)('left');
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
        rotate.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  const rightOverlay = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / SWIPE_THRESHOLD, 1),
  }));

  const leftOverlay = useAnimatedStyle(() => ({
    opacity: Math.min(-translateX.value / SWIPE_THRESHOLD, 1),
  }));

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isTop) {
    return (
      <Animated.View style={[styles.card, styles.cardBehind, cardStyle]}>
        <View style={styles.cardContent}>
          <Text style={styles.merchantText} numberOfLines={1}>
            {item.merchant}
          </Text>
          <Text style={styles.amountText}>
            ₹{item.amount.toLocaleString('en-IN')}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Swipe overlays */}
        <Animated.View style={[styles.swipeOverlay, styles.acceptOverlay, rightOverlay]}>
          <MaterialIcons name="check-circle" size={48} color="#16A34A" />
          <Text style={styles.overlayText}>Accept</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeOverlay, styles.skipOverlay, leftOverlay]}>
          <MaterialIcons name="skip-next" size={48} color="#EF4444" />
          <Text style={[styles.overlayText, { color: '#EF4444' }]}>Skip</Text>
        </Animated.View>

        <View style={styles.cardContent}>
          <View style={styles.merchantIcon}>
            <MaterialIcons name="receipt-long" size={32} color={Colors.primary} />
          </View>

          <Text style={styles.questionText}>
            What was ₹{item.amount.toLocaleString('en-IN')} for?
          </Text>
          <Text style={styles.merchantInfo}>
            {item.merchant} {'\u2022'} {formatTime(item.timestamp)}
          </Text>

          {item.suggestedCategory && !showGrid && (
            <View style={styles.suggestion}>
              <Text style={styles.suggestionLabel}>Suggested:</Text>
              <View style={styles.suggestionChip}>
                <Text style={styles.suggestionText}>{item.suggestedCategory}</Text>
              </View>
              <Text style={styles.swipeHint}>Swipe right to accept</Text>
            </View>
          )}

          {/* Category grid toggle */}
          {!showGrid ? (
            <TouchableOpacity
              style={styles.showGridButton}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowGrid(true);
              }}
            >
              <MaterialIcons name="grid-view" size={20} color={Colors.primary} />
              <Text style={styles.showGridText}>Choose Category</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={styles.categoryCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onCategorize(item.transactionId, cat.name);
                  }}
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: cat.bg }]}>
                    <MaterialIcons name={cat.icon} size={20} color={cat.iconColor} />
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function PendingScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const params = route.params || {};

  // Support single item or batch
  const initialItems: PendingItem[] = params.items || [
    {
      transactionId: params.transactionId,
      amount: params.amount || 0,
      merchant: params.merchant || 'Unknown',
      timestamp: params.timestamp || Date.now(),
      suggestedCategory: params.suggestedCategory,
    },
  ];

  const [items, setItems] = useState<PendingItem[]>(initialItems);
  const [completedCount, setCompletedCount] = useState(0);
  const totalCount = initialItems.length;

  const handleCategorize = useCallback(
    (id: string, category: Category) => {
      updateTransaction(id, { category });
      setItems((prev) => prev.filter((item) => item.transactionId !== id));
      setCompletedCount((prev) => prev + 1);
    },
    [],
  );

  const handleSkip = useCallback(
    (id: string) => {
      updateTransaction(id, { category: 'Others' });
      setItems((prev) => prev.filter((item) => item.transactionId !== id));
      setCompletedCount((prev) => prev + 1);
    },
    [],
  );

  // Auto-close when all items are done
  if (items.length === 0) {
    setTimeout(() => navigation.goBack(), 300);
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categorize</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        </View>

        {/* Card Stack */}
        <View style={styles.cardStack}>
          {items.length > 0 ? (
            items
              .slice(0, 3)
              .reverse()
              .map((item, index) => {
                const isTop = index === Math.min(items.length, 3) - 1;
                return (
                  <SwipeableCard
                    key={item.transactionId}
                    item={item}
                    onCategorize={handleCategorize}
                    onSkip={handleSkip}
                    isTop={isTop}
                  />
                );
              })
          ) : (
            <Animated.View entering={FadeInDown.springify()} style={styles.doneContainer}>
              <MaterialIcons name="check-circle" size={64} color={Colors.primary} />
              <Text style={styles.doneTitle}>All done!</Text>
              <Text style={styles.doneSubtitle}>
                {totalCount} transaction{totalCount !== 1 ? 's' : ''} categorized
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Swipe hints */}
        {items.length > 0 && (
          <View style={styles.hintRow}>
            <View style={styles.hint}>
              <MaterialIcons name="chevron-left" size={16} color={Colors.textTertiary} />
              <Text style={styles.hintText}>Skip</Text>
            </View>
            <View style={styles.hint}>
              <Text style={styles.hintText}>Accept</Text>
              <MaterialIcons name="chevron-right" size={16} color={Colors.textTertiary} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.elevation1,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
  },
  progressText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Elevation.elevation2,
    overflow: 'hidden',
  },
  cardBehind: {
    opacity: 0.7,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  swipeOverlay: {
    position: 'absolute',
    top: 16,
    zIndex: 10,
    alignItems: 'center',
    gap: 4,
  },
  acceptOverlay: {
    right: 20,
  },
  skipOverlay: {
    left: 20,
  },
  overlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  merchantIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  merchantInfo: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  suggestion: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  suggestionLabel: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
  },
  suggestionText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  swipeHint: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  showGridButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.canvas,
    marginTop: 8,
  },
  showGridText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  categoryCard: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.canvas,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  doneContainer: {
    alignItems: 'center',
    gap: 12,
  },
  doneTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  doneSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  merchantText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  amountText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});
