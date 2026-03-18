import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

interface Props {
  count: number;
  label?: string;
}

export default function StreakBadge({ count, label = 'day streak' }: Props) {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 200 }),
      withDelay(100, withSpring(1, { damping: 12, stiffness: 180 })),
    );
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MaterialIcons
        name="local-fire-department"
        size={18}
        color={count >= 7 ? '#F59E0B' : Colors.primary}
      />
      <Text style={styles.count}>{count}</Text>
      {label && <Text style={styles.label}>{label}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
  },
  count: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
