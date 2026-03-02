import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../theme';

interface Props {
  value: string;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function NumPad({ value, onKeyPress, onBackspace }: Props) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫'],
  ];

  const handlePress = (key: string) => {
    if (key === '⌫') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.key}
              activeOpacity={0.5}
              onPress={() => handlePress(key)}
            >
              {key === '⌫' ? (
                <Text style={styles.backspaceText}>⌫</Text>
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </TouchableOpacity>
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
    color: Colors.slate100,
    fontSize: 24,
    fontWeight: '600',
  },
  backspaceText: {
    color: Colors.slate400,
    fontSize: 22,
  },
});
