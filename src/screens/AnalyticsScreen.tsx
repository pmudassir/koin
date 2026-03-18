import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Elevation } from "../theme";
import {
  getWeeklyData,
  getCategoryBreakdown,
  getTransactions,
} from "../storage/transactionStorage";
import { CATEGORY_COLORS, Category } from "../models/Transaction";
import { getCustomCategories, onCustomCategoriesChange } from "../storage/categoryStorage";
import {
  getMonthOverMonthChange,
  getSpendingTrend,
  generateInsights,
  InsightCard,
  MonthTrend,
} from "../services/insightsEngine";
import { AnalyticsSkeleton } from "../components/Skeleton";
import SpendingHeatmap from "../components/SpendingHeatmap";

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

// Cache custom categories to avoid re-reading MMKV on every render
let _cachedCustomCategories: ReturnType<typeof getCustomCategories> | null = null;
function getCachedCustomCategories() {
  if (!_cachedCustomCategories) _cachedCustomCategories = getCustomCategories();
  return _cachedCustomCategories;
}
onCustomCategoriesChange(() => { _cachedCustomCategories = null; });

function getCategoryIcon(category: string): keyof typeof MaterialIcons.glyphMap {
  if (CATEGORY_ICON_MAP[category]) return CATEGORY_ICON_MAP[category];
  const custom = getCachedCustomCategories().find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );
  if (custom) return custom.icon as keyof typeof MaterialIcons.glyphMap;
  return "more-horiz";
}

function getCategoryBarColor(category: string): string {
  const colors = CATEGORY_COLORS[category as Category];
  if (colors?.text) return colors.text;
  const custom = getCachedCustomCategories().find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );
  if (custom) return custom.color;
  return "#60a5fa";
}

const INSIGHT_TINTS = {
  red: {
    bg: "#FEF2F2",
    border: "#FECACA",
    text: "#DC2626",
    icon: "#ef4444",
  },
  green: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#059669",
    icon: "#10b981",
  },
  blue: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#2563EB",
    icon: "#3b82f6",
  },
  amber: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    text: "#D97706",
    icon: "#f59e0b",
  },
  purple: {
    bg: "#F5F3FF",
    border: "#DDD6FE",
    text: "#7C3AED",
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
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const loadData = useCallback(() => {
    setWeeklyData(getWeeklyData());
    setCategoryData(getCategoryBreakdown());
    const txns = getTransactions();
    setTotalSpent(txns.reduce((sum, t) => sum + t.amount, 0));
    const { totalChange } = getMonthOverMonthChange();
    setMonthChange(totalChange);
    setTrendData(getSpendingTrend(6));
    setInsights(generateInsights());
    setIsFirstLoad(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const maxDayAmount = Math.max(...weeklyData.map((d) => d.amount), 1);
  const maxTrendAmount = Math.max(...trendData.map((d) => d.amount), 1);


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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {isFirstLoad ? (
            <AnalyticsSkeleton />
          ) : (
          <>
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
                  <View style={styles.aiIconBadge}>
                    <MaterialIcons
                      name="auto-awesome"
                      size={14}
                      color="#fbbf24"
                    />
                  </View>
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
                        {
                          borderColor: tint.border,
                        },
                      ]}
                    >
                      {/* Accent bar at top */}
                      <View
                        style={[
                          styles.insightAccent,
                          { backgroundColor: tint.icon },
                        ]}
                      />
                      <View style={styles.insightHeader}>
                        <View
                          style={[
                            styles.insightIconBg,
                            { backgroundColor: tint.bg },
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
                          <View
                            style={[
                              styles.insightValueBadge,
                              { backgroundColor: tint.bg },
                            ]}
                          >
                            <Text
                              style={[styles.insightValue, { color: tint.text }]}
                            >
                              {insight.value}
                            </Text>
                          </View>
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
                                : Colors.primaryMedium,
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

          {/* Spending Heatmap */}
          <View style={styles.heatmapSection}>
            <Text style={styles.sectionTitle}>Spending Calendar</Text>
            <View style={styles.heatmapCard}>
              <SpendingHeatmap
                year={new Date().getFullYear()}
                month={new Date().getMonth()}
              />
            </View>
          </View>

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
                                Colors.other.bg,
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
                  color={Colors.textTertiary}
                />
                <Text style={styles.emptyText}>
                  Add expenses to see your spending breakdown
                </Text>
              </View>
            )}
          </View>
          </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  periodToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    color: Colors.textSecondary,
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  summary: {
    marginTop: 16,
    marginBottom: 24,
  },
  summaryLabel: {
    color: Colors.textSecondary,
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
    color: Colors.textPrimary,
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
    backgroundColor: Colors.expenseBg,
  },
  changeBadgeDown: {
    backgroundColor: Colors.incomeBg,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateRange: {
    color: Colors.textTertiary,
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
    gap: 8,
  },
  aiIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.warningBg,
    alignItems: "center",
    justifyContent: "center",
  },
  insightsScroll: {
    gap: 12,
    paddingRight: 24,
  },
  insightCard: {
    width: SCREEN_WIDTH * 0.62,
    borderRadius: 18,
    padding: 18,
    paddingTop: 22,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    overflow: "hidden",
    ...Elevation.elevation1,
  },
  insightAccent: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    opacity: 0.8,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  insightIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  insightValueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  insightValue: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  insightTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },
  insightDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  // Charts
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Elevation.elevation2,
  },
  chartTitle: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primarySoft,
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
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 8,
  },
  barAmount: {
    color: Colors.textTertiary,
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  categoryAmount: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  categoryPercent: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  progressBg: {
    height: 6,
    backgroundColor: Colors.borderSubtle,
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
    color: Colors.textTertiary,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 240,
  },

  // Heatmap
  heatmapSection: {
    marginBottom: 24,
    gap: 12,
  },
  heatmapCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    ...Elevation.elevation1,
  },
});
