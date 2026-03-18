import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { showToast } from "../components/Toast";
import { showConfirm } from "../components/Toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Colors, Elevation } from "../theme";
import { Transaction } from "../models/Transaction";
import {
  getTransactionsForDay,
  getTodayTotal,
  getDailyBudget,
  deleteTransaction,
  getBudgetPeriod,
  getPeriodTotal,
  getWeeklyTotal,
  getMonthlyTotal,
  addTransaction,
} from "../storage/transactionStorage";
import TransactionItem from "../components/TransactionItem";
import BudgetCard from "../components/BudgetCard";
import { HomeSkeleton } from "../components/Skeleton";
import SyncStatusBadge from "../components/SyncStatusBadge";
import { runSync } from "../services/syncManager";
import { syncTransactions } from "../services/firebase";
import { getCombinedSuggestions, Suggestion } from "../services/suggestions";
import { SuggestionPill } from "../components/SuggestionPill";
import { setupShareListener } from "../services/shareExtensionBridge";
import {
  transactionDetector,
  DetectedTransaction,
} from "../services/transactionDetector";
import { smartCategorize } from "../services/smartCategorizer";
import { getStreakData, updateStreak, StreakData } from "../services/streakService";
import StreakBadge from "../components/StreakBadge";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [periodTotal, setPeriodTotal] = useState(0);
  const [budget, setBudget] = useState(2500);
  const [budgetPeriod, setBudgetPeriodState] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [streak, setStreak] = useState<StreakData>(getStreakData());

  const loadData = useCallback(() => {
    const period = getBudgetPeriod();
    setBudgetPeriodState(period);
    setPeriodTotal(getPeriodTotal());
    setBudget(getDailyBudget());
    setRecentTransactions(getTransactionsForDay(new Date()).slice(0, 5));
    setSuggestions(getCombinedSuggestions().slice(0, 4));
    setStreak(getStreakData());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      if (isFirstLoad) setIsFirstLoad(false);
      // Trigger background sync
      runSync(syncTransactions);
    }, [loadData]),
  );

  // Listen for share extension data when app comes to foreground
  useEffect(() => {
    const cleanup = setupShareListener(() => {
      loadData();
      showToast({
        type: "success",
        title: "Transaction Added",
        message: "A shared transaction was automatically added.",
      });
    });
    return cleanup;
  }, [loadData]);

  // Android: Listen for auto-detected SMS/notification transactions
  useEffect(() => {
    if (!transactionDetector.isAvailable()) return;

    transactionDetector.startListening((detected: DetectedTransaction) => {
      // Auto-categorize the detected transaction
      const result = smartCategorize(detected.merchant, detected.smsBody || "");

      // Save the transaction
      addTransaction({
        amount: detected.amount,
        merchant: detected.merchant,
        category: result.category,
        note: `Auto-detected from ${detected.source}: ${detected.sender}`,
        isAutoDetected: true,
      });

      loadData();
      showToast({
        type: "success",
        title: "Transaction Auto-Added",
        message: `${detected.merchant} — ₹${detected.amount.toLocaleString("en-IN")}`,
      });
    });

    return () => {
      transactionDetector.stopListening();
    };
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleDelete = (txn: Transaction) => {
    showConfirm({
      title: "Delete Transaction",
      message: `Delete "${txn.merchant}" — ₹${txn.amount.toLocaleString("en-IN")}?`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        deleteTransaction(txn.id);
        loadData();
        showToast({
          type: "success",
          title: "Transaction Deleted",
          duration: 5000,
          action: {
            label: "Undo",
            onPress: () => {
              addTransaction({
                amount: txn.amount,
                merchant: txn.merchant,
                category: txn.category,
                isAutoDetected: txn.isAutoDetected,
                note: txn.note,
              });
              loadData();
            },
          },
        });
      },
    });
  };

  const handleEdit = (txn: Transaction) => {
    navigation.navigate("AddExpense", { transaction: txn });
  };

  const handleQuickLog = (suggestion: Suggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const saved = addTransaction({
      amount: suggestion.amount,
      merchant: suggestion.merchant,
      category: suggestion.category,
      isAutoDetected: false,
    });
    updateStreak();
    loadData();
    showToast({
      type: "success",
      title: "Expense Saved",
      message: `${suggestion.merchant} — ₹${suggestion.amount.toLocaleString("en-IN")}`,
      duration: 5000,
      action: {
        label: "Undo",
        onPress: () => {
          deleteTransaction(saved.id);
          loadData();
        },
      },
    });
  };

  const periodLabel =
    budgetPeriod === "daily"
      ? "Today"
      : budgetPeriod === "weekly"
        ? "This Week"
        : "This Month";
  const budgetLabel =
    budgetPeriod.charAt(0).toUpperCase() + budgetPeriod.slice(1) + " Budget";

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.canvas}
      />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/mascot/mascot-idle.png')}
              style={styles.mascotAvatar}
            />
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.dateText}>{periodLabel}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <SyncStatusBadge />
            <TouchableOpacity style={styles.notifButton}>
              <MaterialIcons
                name="notifications-none"
                size={24}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {isFirstLoad ? (
            <HomeSkeleton />
          ) : (
          <>
          {/* Total Spent + Streak */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Spent {periodLabel}</Text>
              {streak.loggingStreak > 0 && (
                <StreakBadge count={streak.loggingStreak} />
              )}
            </View>
            <Text style={styles.totalAmount}>
              ₹
              {periodTotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* Budget Card */}
          <View style={styles.budgetSection}>
            <BudgetCard
              budget={budget}
              spent={periodTotal}
              label={budgetLabel}
            />
          </View>

          {/* Quick Log */}
          {suggestions.length > 0 && (
            <View style={styles.quickLogSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.quickLogTitleRow}>
                  <MaterialIcons name="bolt" size={18} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Quick Log</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickLogScroll}
              >
                {suggestions.map((s, i) => (
                  <Animated.View
                    key={`${s.merchant}-${i}`}
                    entering={FadeInDown.delay(i * 80).springify().damping(18).stiffness(200)}
                  >
                    <SuggestionPill
                      suggestion={s}
                      onPress={handleQuickLog}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recent Transactions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AllTransactions")}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Image
                source={require('../../assets/mascot/mascot-idle.png')}
                style={styles.emptyMascot}
              />
              <Text style={styles.emptyText}>No transactions today</Text>
              <Text style={styles.emptySubtext}>
                Tap + to add your first expense
              </Text>
            </View>
          ) : (
            <View style={styles.txnList}>
              {recentTransactions.map((txn, index) => (
                <Animated.View
                  key={txn.id}
                  entering={FadeInDown.delay(index * 60).springify().damping(18).stiffness(200)}
                >
                  <TransactionItem
                    transaction={txn}
                    onEdit={() => handleEdit(txn)}
                    onDelete={() => handleDelete(txn)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
          </>
          )}
        </ScrollView>

        {/* FAB removed — using tab bar + button instead */}
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mascotAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  emptyMascot: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  welcomeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  dateText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Elevation.elevation1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  totalSection: {
    paddingVertical: 24,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  totalAmount: {
    color: Colors.textPrimary,
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -1,
  },
  budgetSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  seeAll: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  txnList: {
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: Colors.textTertiary,
    fontSize: 13,
  },
  quickLogSection: {
    marginBottom: 24,
  },
  quickLogTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickLogScroll: {
    gap: 10,
  },
});
