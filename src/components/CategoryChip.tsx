import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme';
import { Category } from '../models/Transaction';

interface Props {
  category: Category | string;
  isActive: boolean;
  onPress: () => void;
}

export default function CategoryChip({ category, isActive, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive ? styles.active : styles.inactive,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          { color: isActive ? Colors.white : Colors.slate400 },
        ]}
      >
        {category.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  active: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  inactive: {
    backgroundColor: 'transparent',
    borderColor: Colors.slate700,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
});
