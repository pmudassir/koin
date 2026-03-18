import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';
import {
  SyncStatus,
  getSyncStatus,
  onSyncStatusChange,
} from '../services/syncManager';

const STATUS_CONFIG: Record<
  SyncStatus,
  { icon: keyof typeof MaterialIcons.glyphMap; color: string }
> = {
  idle: { icon: 'cloud-done', color: Colors.income },
  syncing: { icon: 'cloud-sync', color: Colors.primary },
  success: { icon: 'cloud-done', color: Colors.income },
  error: { icon: 'cloud-off', color: Colors.expense },
  offline: { icon: 'cloud-off', color: Colors.textTertiary },
};

export default function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const unsubscribe = onSyncStatusChange(setStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (status === 'syncing') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1500 }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const config = STATUS_CONFIG[status];

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MaterialIcons name={config.icon} size={16} color={config.color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
