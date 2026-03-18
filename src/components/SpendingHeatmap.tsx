import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Elevation } from '../theme';
import { getTransactionsForDay, getDailyBudget } from '../storage/transactionStorage';

interface Props {
  year: number;
  month: number; // 0-indexed
  onDayPress?: (date: Date) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getIntensityColor(spent: number, budget: number): string {
  if (spent === 0) return Colors.canvas;
  const ratio = spent / budget;
  if (ratio > 1) return '#EF4444'; // Over budget — red
  if (ratio > 0.8) return '#8B5CF6'; // 80-100% — dark violet
  if (ratio > 0.5) return '#A78BFA'; // 50-80% — medium violet
  if (ratio > 0.2) return '#C4B5FD'; // 20-50% — light violet
  return '#DDD6FE'; // 0-20% — very light violet
}

export default function SpendingHeatmap({ year, month, onDayPress }: Props) {
  const budget = getDailyBudget();

  const { weeks, dailyData } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const data: { date: Date; spent: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const txns = getTransactionsForDay(date);
      const spent = txns
        .filter((t) => t.type !== 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      data.push({ date, spent });
    }

    // Build weeks grid
    const grid: (typeof data[0] | null)[][] = [];
    let currentWeek: (typeof data[0] | null)[] = [];

    // Fill leading blanks
    for (let i = 0; i < startDow; i++) {
      currentWeek.push(null);
    }

    for (const day of data) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill trailing blanks
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      grid.push(currentWeek);
    }

    return { weeks: grid, dailyData: data };
  }, [year, month]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <View style={styles.container}>
      {/* Day labels */}
      <View style={styles.headerRow}>
        {DAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.dayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={di} style={styles.emptyCell} />;
            }

            const isToday =
              isCurrentMonth && day.date.getDate() === today.getDate();
            const color = getIntensityColor(day.spent, budget);

            return (
              <TouchableOpacity
                key={di}
                style={[
                  styles.cell,
                  { backgroundColor: color },
                  isToday && styles.todayCell,
                ]}
                activeOpacity={0.7}
                onPress={() => onDayPress?.(day.date)}
              >
                <Text
                  style={[
                    styles.cellText,
                    day.spent > 0 && styles.cellTextActive,
                    isToday && styles.todayText,
                  ]}
                >
                  {day.date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        {['#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6', '#EF4444'].map((c, i) => (
          <View key={i} style={[styles.legendDot, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

const CELL_SIZE = 38;

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 4,
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  cellText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  cellTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  todayText: {
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
  },
});
