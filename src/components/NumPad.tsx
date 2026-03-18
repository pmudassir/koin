import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';

interface Props {
  value: string;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NumKey({ keyLabel, onPress }: { keyLabel: string; onPress: (key: string) => void }) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: `rgba(124, 58, 237, ${bgOpacity.value})`,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
    bgOpacity.value = withTiming(0.08, { duration: 80 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    bgOpacity.value = withTiming(0, { duration: 200 });
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(keyLabel);
  }, [keyLabel, onPress]);

  const isBackspace = keyLabel === 'backspace';

  return (
    <AnimatedPressable
      style={[styles.key, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      {isBackspace ? (
        <MaterialIcons name="backspace" size={22} color={Colors.textTertiary} />
      ) : (
        <Text style={styles.keyText}>{keyLabel}</Text>
      )}
    </AnimatedPressable>
  );
}

export default function NumPad({ value, onKeyPress, onBackspace }: Props) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  const handlePress = useCallback((key: string) => {
    if (key === 'backspace') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  }, [onKeyPress, onBackspace]);

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <NumKey key={key} keyLabel={key} onPress={handlePress} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  key: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  keyText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
  },
});
