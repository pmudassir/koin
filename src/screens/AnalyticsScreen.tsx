import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../theme';
import { getWeeklyData, getCategoryBreakdown, getTransactions } from '../storage/transactionStorage';
import { CATEGORY_COLORS, Category } from '../models/Transaction';

export default function AnalyticsScreen() {
  const [weeklyData, setWeeklyData] = useState<{ day: string; amount: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ category: string; amount: number; percentage: number }[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setWeeklyData(getWeeklyData());
      setCategoryData(getCategoryBreakdown());
      const txns = getTransactions();
      setTotalSpent(txns.reduce((sum, t) => sum + t.amount, 0));
    }, [])
  );

  const maxDayAmount = Math.max(...weeklyData.map((d) => d.amount), 1);

  const getCategoryBarColor = (category: string): string => {
    const colors = CATEGORY_COLORS[category as Category];
    if (colors) return colors.text;
    return Colors.primary;
  };

  const getCategoryIcon = (category: string): keyof typeof MaterialIcons.glyphMap => {
    const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
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
    return icons[category] || 'more-horiz';
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <MaterialIcons name="search" size={22} color={Colors.slate100} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <MaterialIcons name="calendar-today" size={20} color={Colors.slate100} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryAmount}>
                ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              {totalSpent > 0 && (
                <View style={styles.changeBadge}>
                  <MaterialIcons name="arrow-downward" size={14} color="#10b981" />
                  <Text style={styles.changeText}>12%</Text>
                </View>
              )}
            </View>
            <Text style={styles.dateRange}>This Week</Text>
          </View>

          {/* Weekly Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {weeklyData.map((day, i) => {
                const barHeight = maxDayAmount > 0
                  ? Math.max((day.amount / maxDayAmount) * 140, 8)
                  : 8;
                return (
                  <View key={i} style={styles.barColumn}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.barBg,
                          { height: 140 },
                        ]}
                      >
                        <View
                          style={[
                            styles.barFill,
                            { height: barHeight },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.barLabel}>{day.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Category Split */}
          <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Split</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {categoryData.length > 0 ? (
              <View style={styles.categoryList}>
                {categoryData.map((cat, i) => (
                  <View key={i} style={styles.categoryItem}>
                    <View style={styles.categoryTop}>
                      <View style={styles.categoryLeft}>
                        <View
                          style={[
                            styles.categoryIcon,
                            {
                              backgroundColor:
                                i === 0
                                  ? 'rgba(19, 127, 236, 0.1)'
                                  : 'rgba(30, 41, 59, 0.5)',
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={getCategoryIcon(cat.category)}
                            size={20}
                            color={i === 0 ? Colors.primary : Colors.slate300}
                          />
                        </View>
                        <View>
                          <Text style={styles.categoryName}>{cat.category}</Text>
                          <Text style={styles.categoryAmount}>
                            ₹{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${cat.percentage}%`,
                            backgroundColor: i === 0 ? Colors.primary : Colors.slate400,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="bar-chart" size={48} color={Colors.slate700} />
                <Text style={styles.emptyText}>
                  Add expenses to see your spending breakdown
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: Colors.slate100,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  summary: {
    marginTop: 16,
    marginBottom: 24,
  },
  summaryLabel: {
    color: Colors.slate400,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  summaryAmount: {
    color: Colors.slate100,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  dateRange: {
    color: Colors.slate400,
    fontSize: 14,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  barBg: {
    width: '100%',
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  barLabel: {
    color: Colors.slate400,
    fontSize: 12,
    fontWeight: '500',
  },
  categorySection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.slate100,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryList: {
    gap: 24,
  },
  categoryItem: {
    gap: 10,
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: '600',
  },
  categoryAmount: {
    color: Colors.slate400,
    fontSize: 12,
    marginTop: 2,
  },
  categoryPercent: {
    color: Colors.slate100,
    fontSize: 14,
    fontWeight: '700',
  },
  progressBg: {
    height: 6,
    backgroundColor: Colors.slate800,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: Colors.slate500,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  },
});
