import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../theme';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.borderSubtle,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <View style={skeletonStyles.txnRow}>
      <Skeleton width={48} height={48} borderRadius={14} />
      <View style={skeletonStyles.txnInfo}>
        <Skeleton width={120} height={14} />
        <Skeleton width={80} height={10} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={60} height={14} />
    </View>
  );
}

export function BudgetSkeleton() {
  return (
    <View style={skeletonStyles.budgetCard}>
      <View style={skeletonStyles.budgetAccent} />
      <View style={skeletonStyles.budgetInner}>
        <Skeleton width={100} height={10} />
        <Skeleton width={140} height={22} style={{ marginTop: 8 }} />
        <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 14 }} />
      </View>
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <Skeleton width={160} height={12} />
      <Skeleton width={200} height={36} style={{ marginTop: 8 }} />
      <View style={{ marginTop: 24 }}>
        <BudgetSkeleton />
      </View>
      <View style={{ marginTop: 28 }}>
        <View style={skeletonStyles.sectionHeader}>
          <Skeleton width={150} height={16} />
          <Skeleton width={50} height={12} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ marginTop: 12 }}>
            <TransactionSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}

export function AnalyticsSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <Skeleton width={100} height={12} />
      <Skeleton width={180} height={32} style={{ marginTop: 8 }} />
      <Skeleton width={120} height={12} style={{ marginTop: 8 }} />
      <View style={skeletonStyles.chartSkeleton}>
        <View style={skeletonStyles.chartBars}>
          {[0.4, 0.7, 0.5, 0.9, 0.3, 0.6, 0.8].map((h, i) => (
            <View key={i} style={skeletonStyles.chartBarCol}>
              <Skeleton width={28} height={Math.round(h * 100)} borderRadius={6} />
              <Skeleton width={16} height={10} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={skeletonStyles.categoryRow}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width={80} height={14} />
            <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 10 }} />
          </View>
          <Skeleton width={40} height={14} style={{ marginLeft: 12 }} />
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  txnInfo: {
    flex: 1,
  },
  budgetCard: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  budgetAccent: {
    width: 4,
    backgroundColor: Colors.borderSubtle,
  },
  budgetInner: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
});

export default Skeleton;
