import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../theme";
import {
  getWeeklyData,
  getCategoryBreakdown,
  getTransactions,
} from "../storage/transactionStorage";
import { CATEGORY_COLORS, Category } from "../models/Transaction";
import {
  getMonthOverMonthChange,
  getSpendingTrend,
  generateInsights,
  InsightCard,
  MonthTrend,
} from "../services/insightsEngine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Period = "week" | "month";

const CATEGORY_ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Food: "restaurant",
  Transport: "directions-car",
  Groceries: "shopping-cart",
  Bills: "receipt-long",
  Shopping: "shopping-bag",
  Health: "favorite",
  Transfer: "swap-horiz",
  Entertainment: "movie",
  Others: "more-horiz",
};

function getCategoryIcon(category: string): keyof typeof MaterialIcons.glyphMap {
  return CATEGORY_ICON_MAP[category] || "more-horiz";
}

function getCategoryBarColor(category: string): string {
  const colors = CATEGORY_COLORS[category as Category];
  return colors?.text || "#60a5fa";
}

const INSIGHT_TINTS = {
  red: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.2)",
    text: "#f87171",
    icon: "#ef4444",
  },
  green: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.2)",
    text: "#34d399",
    icon: "#10b981",
  },
  blue: {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.2)",
    text: "#60a5fa",
    icon: "#3b82f6",
  },
  amber: {
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.2)",
    text: "#fbbf24",
    icon: "#f59e0b",
  },
  purple: {
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.2)",
    text: "#a78bfa",
    icon: "#8b5cf6",
  },
};

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>("week");
  const [weeklyData, setWeeklyData] = useState<
    { day: string; amount: number }[]
  >([]);
  const [categoryData, setCategoryData] = useState<
    { category: string; amount: number; percentage: number }[]
  >([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [monthChange, setMonthChange] = useState(0);
  const [trendData, setTrendData] = useState<MonthTrend[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);

  useFocusEffect(
    useCallback(() => {
      setWeeklyData(getWeeklyData());
      setCategoryData(getCategoryBreakdown());
      const txns = getTransactions();
      setTotalSpent(txns.reduce((sum, t) => sum + t.amount, 0));

      // New data
      const { totalChange } = getMonthOverMonthChange();
      setMonthChange(totalChange);
      setTrendData(getSpendingTrend(6));
      setInsights(generateInsights());
    }, []),
  );

  const maxDayAmount = Math.max(...weeklyData.map((d) => d.amount), 1);
  const maxTrendAmount = Math.max(...trendData.map((d) => d.amount), 1);

  const getCategoryIcon = (
    category: string,
  ): keyof typeof MaterialIcons.glyphMap => {
    const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
      Food: "restaurant",
      Transport: "directions-car",
      Groceries: "shopping-cart",
      Bills: "receipt-long",
      Shopping: "shopping-bag",
      Health: "favorite",
      Transfer: "swap-horiz",
      Entertainment: "movie",
      Others: "more-horiz",
    };
    return icons[category] || "more-horiz";
  };

  const getCategoryBarColor = (category: string): string => {
    const colors = CATEGORY_COLORS[category as Category];
    if (colors) return colors.text;
    return Colors.primary;
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.periodToggle}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                period === "week" && styles.toggleActive,
              ]}
              onPress={() => setPeriod("week")}
            >
              <Text
                style={[
                  styles.toggleText,
                  period === "week" && styles.toggleTextActive,
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                period === "month" && styles.toggleActive,
              ]}
              onPress={() => setPeriod("month")}
            >
              <Text
                style={[
                  styles.toggleText,
                  period === "month" && styles.toggleTextActive,
                ]}
              >
                Month
              </Text>
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
                ₹
                {totalSpent.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </Text>
              {totalSpent > 0 && monthChange !== 0 && (
                <View
                  style={[
                    styles.changeBadge,
                    monthChange > 0
                      ? styles.changeBadgeUp
                      : styles.changeBadgeDown,
                  ]}
                >
                  <MaterialIcons
                    name={monthChange > 0 ? "arrow-upward" : "arrow-downward"}
                    size={14}
                    color={monthChange > 0 ? "#ef4444" : "#10b981"}
                  />
                  <Text
                    style={[
                      styles.changeText,
                      { color: monthChange > 0 ? "#ef4444" : "#10b981" },
                    ]}
                  >
                    {Math.abs(monthChange)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.dateRange}>
              {period === "week" ? "This Week" : "This Month"} • vs last month
            </Text>
          </View>

          {/* AI Insights */}
          {insights.length > 0 && (
            <View style={styles.insightsSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={18}
                    color="#fbbf24"
                  />
                  <Text style={styles.sectionTitle}>AI Insights</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.insightsScroll}
              >
                {insights.map((insight) => {
                  const tint = INSIGHT_TINTS[insight.tint];
                  return (
                    <View
                      key={insight.id}
                      style={[
                        styles.insightCard,
                        { backgroundColor: tint.bg, borderColor: tint.border },
                      ]}
                    >
                      <View style={styles.insightHeader}>
                        <View
                          style={[
                            styles.insightIconBg,
                            { backgroundColor: tint.border },
                          ]}
                        >
                          <MaterialIcons
                            name={
                              insight.icon as keyof typeof MaterialIcons.glyphMap
                            }
                            size={18}
                            color={tint.icon}
                          />
                        </View>
                        {insight.value && (
                          <Text
                            style={[styles.insightValue, { color: tint.text }]}
                          >
                            {insight.value}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                      <Text style={styles.insightDesc}>
                        {insight.description}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Chart Section */}
          {period === "week" ? (
            // Weekly Chart
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Weekly Spending</Text>
              <View style={styles.chartBars}>
                {weeklyData.map((day, i) => {
                  const barHeight =
                    maxDayAmount > 0
                      ? Math.max((day.amount / maxDayAmount) * 120, 4)
                      : 4;
                  return (
                    <View key={i} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.barFill,
                            { height: barHeight },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{day.day}</Text>
                      <Text style={styles.barAmount}>
                        {day.amount > 0
                          ? day.amount >= 1000
                            ? `${(day.amount / 1000).toFixed(1)}k`
                            : `₹${Math.round(day.amount)}`
                          : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            // Monthly Trend Chart
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Trend</Text>
              <View style={styles.chartBars}>
                {trendData.map((month, i) => {
                  const barHeight =
                    maxTrendAmount > 0
                      ? Math.max((month.amount / maxTrendAmount) * 120, 4)
                      : 4;
                  const isCurrentMonth = i === trendData.length - 1;
                  return (
                    <View key={i} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: barHeight,
                              backgroundColor: isCurrentMonth
                                ? Colors.primary
                                : "rgba(19, 127, 236, 0.4)",
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.barLabel,
                          isCurrentMonth && {
                            color: Colors.primary,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {month.label}
                      </Text>
                      <Text style={styles.barAmount}>
                        {month.amount > 0
                          ? month.amount >= 1000
                            ? `${(month.amount / 1000).toFixed(1)}k`
                            : `₹${Math.round(month.amount)}`
                          : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Category Split */}
          <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Split</Text>
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
                                CATEGORY_COLORS[cat.category as Category]?.bg ||
                                "rgba(30, 41, 59, 0.5)",
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={getCategoryIcon(cat.category)}
                            size={20}
                            color={getCategoryBarColor(cat.category)}
                          />
                        </View>
                        <View>
                          <Text style={styles.categoryName}>
                            {cat.category}
                          </Text>
                          <Text style={styles.categoryAmount}>
                            ₹
                            {cat.amount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.categoryPercent}>
                        {cat.percentage}%
                      </Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${cat.percentage}%`,
                            backgroundColor: getCategoryBarColor(cat.category),
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="bar-chart"
                  size={48}
                  color={Colors.slate700}
                />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: Colors.slate100,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  periodToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    color: Colors.slate400,
    fontSize: 13,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#fff",
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
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 4,
  },
  summaryAmount: {
    color: Colors.slate100,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  changeBadgeUp: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  changeBadgeDown: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  changeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateRange: {
    color: Colors.slate400,
    fontSize: 14,
    marginTop: 4,
  },

  // Insights
  insightsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  insightsScroll: {
    gap: 12,
    paddingRight: 24,
  },
  insightCard: {
    width: SCREEN_WIDTH * 0.6,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  insightIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  insightValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  insightTitle: {
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  insightDesc: {
    color: Colors.slate400,
    fontSize: 12,
    lineHeight: 17,
  },

  // Charts
  chartCard: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  chartTitle: {
    color: Colors.slate300,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
    paddingTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    width: "100%",
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(19, 127, 236, 0.06)",
    borderRadius: 8,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    color: Colors.slate400,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 8,
  },
  barAmount: {
    color: Colors.slate500,
    fontSize: 9,
    fontWeight: "600",
    height: 14,
    marginTop: 2,
  },

  // Categories
  categorySection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: Colors.slate100,
    fontSize: 18,
    fontWeight: "700",
  },
  categoryList: {
    gap: 20,
  },
  categoryItem: {
    gap: 10,
  },
  categoryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: "600",
  },
  categoryAmount: {
    color: Colors.slate400,
    fontSize: 12,
    marginTop: 2,
  },
  categoryPercent: {
    color: Colors.slate100,
    fontSize: 14,
    fontWeight: "700",
  },
  progressBg: {
    height: 6,
    backgroundColor: Colors.slate800,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: Colors.slate500,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 240,
  },
});
