import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Elevation } from '../theme';
import { Category } from '../models/Transaction';

interface Props {
  category: Category | string;
  isActive: boolean;
  onPress: () => void;
}

function CategoryChip({ category, isActive, onPress }: Props) {
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
          { color: isActive ? Colors.textOnPrimary : Colors.textSecondary },
        ]}
      >
        {category}
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
    ...Elevation.elevation1,
  },
  inactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderMedium,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default React.memo(CategoryChip);
