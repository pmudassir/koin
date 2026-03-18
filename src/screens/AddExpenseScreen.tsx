import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import AnimatedRN, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { showToast } from "../components/Toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Colors, Elevation } from "../theme";
import { Category, TransactionType } from "../models/Transaction";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../storage/transactionStorage";
import { recordCategoryOverride, smartCategorize } from "../services/smartCategorizer";
import { getCombinedSuggestions, Suggestion, getAmountForMerchant } from "../services/suggestions";
import { categorize } from "../utils/categorization";
import { getCustomCategories } from "../storage/categoryStorage";
import NumPad from "../components/NumPad";
import CategoryChip from "../components/CategoryChip";

const EXPENSE_CATEGORIES: Category[] = [
  "Food",
  "Transport",
  "Groceries",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Others",
];

const INCOME_CATEGORIES: Category[] = [
  "Transfer",
  "Others",
];

const AnimatedPressable = AnimatedRN.createAnimatedComponent(Pressable);

function SaveButton({ label, onPress, color }: { label: string; onPress: () => void; color?: string }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.saveButton, color ? { backgroundColor: color } : undefined, animatedStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
    >
      <Text style={styles.saveButtonText}>{label}</Text>
      <MaterialIcons name="check-circle" size={22} color={Colors.white} />
    </AnimatedPressable>
  );
}

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const editingTxn = route.params?.transaction;
  const isEditing = !!editingTxn;

  const [amount, setAmount] = useState(
    editingTxn ? editingTxn.amount.toString() : "0",
  );
  const [merchant, setMerchant] = useState(editingTxn?.merchant || "");
  const [category, setCategory] = useState<Category>(
    editingTxn?.category || "Food",
  );
  const [note, setNote] = useState(editingTxn?.note || "");
  const [txnType, setTxnType] = useState<TransactionType>(
    editingTxn?.type || "expense",
  );
  const [suggestions] = useState<Suggestion[]>(() => getCombinedSuggestions());
  const [autoLabel, setAutoLabel] = useState<string | null>(null);
  const merchantDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userChangedCategory, setUserChangedCategory] = useState(false);

  // Auto-categorize on merchant input change
  useEffect(() => {
    if (isEditing || !merchant.trim() || userChangedCategory) return;
    if (merchantDebounce.current) clearTimeout(merchantDebounce.current);

    merchantDebounce.current = setTimeout(() => {
      const result = smartCategorize(merchant.trim());
      if (result.confidence === "high" || result.confidence === "medium") {
        setCategory(result.category);
        setAutoLabel(`Auto: ${result.category}`);
        setTimeout(() => setAutoLabel(null), 2000);
      }

      // Smart amount pre-fill: if amount is still 0, suggest average
      if (amount === "0") {
        const suggestedAmount = getAmountForMerchant(merchant.trim());
        if (suggestedAmount) {
          setAmount(suggestedAmount.toString());
        }
      }
    }, 300);

    return () => {
      if (merchantDebounce.current) clearTimeout(merchantDebounce.current);
    };
  }, [merchant]);

  // Amount shortcut chips
  const amountShortcuts = [50, 100, 200, 500, 1000];

  // Load custom categories
  const customCategories = getCustomCategories();
  const baseCategories = txnType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const allCategories = [
    ...baseCategories,
    ...customCategories.map((c: { name: string }) => c.name as Category),
  ];

  const isIncome = txnType === 'income';

  const handleKeyPress = (key: string) => {
    setAmount((prev: string) => {
      if (prev === "0" && key !== ".") return key;
      if (key === "." && prev.includes(".")) return prev;
      if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev;
      return prev + key;
    });
  };

  const handleBackspace = () => {
    setAmount((prev: string) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  };

  const handleSuggestionTap = (suggestion: Suggestion) => {
    setAmount(suggestion.amount.toString());
    setMerchant(suggestion.merchant);
    setCategory(suggestion.category);
  };

  const handleSave = () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) {
      showToast({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter an amount greater than zero.',
      });
      return;
    }

    const merchantName = merchant.trim() || category;

    if (isEditing) {
      // Learn from user's category choice for this merchant
      if (editingTxn.category !== category) {
        recordCategoryOverride(merchantName, category);
      }
      updateTransaction(editingTxn.id, {
        amount: numericAmount,
        merchant: merchantName,
        category,
        type: txnType,
        note: note.trim() || undefined,
      });
    } else {
      const saved = addTransaction({
        amount: numericAmount,
        merchant: merchantName,
        category,
        type: txnType,
        isAutoDetected: false,
        note: note.trim() || undefined,
      });

      // Show undo toast
      navigation.goBack();
      setTimeout(() => {
        showToast({
          type: "success",
          title: isIncome ? "Income Saved" : "Expense Saved",
          message: `${merchantName} — ₹${numericAmount.toLocaleString("en-IN")}`,
          duration: 5000,
          action: {
            label: "Undo",
            onPress: () => {
              deleteTransaction(saved.id);
            },
          },
        });
      }, 100);
      return;
    }

    navigation.goBack();
  };

  const displayAmount =
    amount === "0"
      ? "0"
      : parseFloat(amount).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
          useGrouping: true,
        });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing
              ? isIncome ? "Edit Income" : "Edit Expense"
              : isIncome ? "Add Income" : "Add Expense"}
          </Text>
          <TouchableOpacity style={styles.historyButton}>
            <MaterialIcons name="history" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Expense / Income Toggle */}
        {!isEditing && (
          <View style={styles.typeToggleRow}>
            <TouchableOpacity
              style={[styles.typeToggle, !isIncome && styles.typeToggleActive]}
              activeOpacity={0.7}
              onPress={() => {
                setTxnType('expense');
                setCategory('Food');
              }}
            >
              <MaterialIcons
                name="arrow-downward"
                size={16}
                color={!isIncome ? Colors.expense : Colors.textTertiary}
              />
              <Text style={[styles.typeToggleText, !isIncome && styles.typeToggleTextExpense]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeToggle, isIncome && styles.typeToggleActiveIncome]}
              activeOpacity={0.7}
              onPress={() => {
                setTxnType('income');
                setCategory('Transfer');
              }}
            >
              <MaterialIcons
                name="arrow-upward"
                size={16}
                color={isIncome ? Colors.income : Colors.textTertiary}
              />
              <Text style={[styles.typeToggleText, isIncome && styles.typeToggleTextIncome]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Amount Display */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>
            {isIncome ? "INCOME AMOUNT" : "SPENDING AMOUNT"}
          </Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.amountText}>
              {amount === "0" ? "0" : displayAmount}
            </Text>
          </View>

          {/* Merchant Name Input */}
          <View style={styles.inputRow}>
            <MaterialIcons name="store" size={18} color={Colors.textTertiary} />
            <TextInput
              style={styles.merchantInput}
              placeholder="Merchant name (e.g. Swiggy, Uber)"
              placeholderTextColor={Colors.textTertiary}
              value={merchant}
              onChangeText={setMerchant}
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>

          {/* Note Input */}
          <View style={styles.inputRow}>
            <MaterialIcons name="edit-note" size={18} color={Colors.textTertiary} />
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note (optional)"
              placeholderTextColor={Colors.textTertiary}
              value={note}
              onChangeText={setNote}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Smart Suggestions */}
        {!isEditing && suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsLabel}>SMART SUGGESTIONS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestions.slice(0, 5).map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.suggestionChip,
                    i === 0 && styles.suggestionChipActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSuggestionTap(s)}
                >
                  <MaterialIcons
                    name={getCategoryMaterialIcon(s.category)}
                    size={18}
                    color={i === 0 ? Colors.primary : Colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.suggestionText,
                      i === 0 && { color: Colors.textPrimary },
                    ]}
                  >
                    {s.merchant} ₹{s.amount.toLocaleString("en-IN")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category Chips */}
        <View style={styles.categorySection}>
          {autoLabel && (
            <Text style={styles.autoLabel}>{autoLabel}</Text>
          )}
          <ScrollView contentContainerStyle={styles.categoryScroll}>
            <View style={styles.categoryWrap}>
              {allCategories.map((cat) => (
                <CategoryChip
                  key={cat}
                  category={cat}
                  isActive={category === cat}
                  onPress={() => {
                    setCategory(cat);
                    setUserChangedCategory(true);
                    if (merchant.trim()) {
                      recordCategoryOverride(merchant.trim(), cat);
                    }
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Numpad + Save Button */}
        <View style={styles.bottomSection}>
          {/* Amount Shortcut Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.amountShortcutsScroll}
          >
            {amountShortcuts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.amountChip,
                  parseFloat(amount) === amt && styles.amountChipActive,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAmount(amt.toString());
                }}
              >
                <Text
                  style={[
                    styles.amountChipText,
                    parseFloat(amount) === amt && styles.amountChipTextActive,
                  ]}
                >
                  {amt >= 1000 ? `${amt / 1000}k` : `₹${amt}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <NumPad
            value={amount}
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
          />
          <View style={styles.saveButtonContainer}>
            <SaveButton
              label={isEditing
                ? isIncome ? "Update Income" : "Update Expense"
                : isIncome ? "Save Income" : "Save Expense"}
              onPress={handleSave}
              color={isIncome ? Colors.income : undefined}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function getCategoryMaterialIcon(
  category: Category,
): keyof typeof MaterialIcons.glyphMap {
  const map: Record<string, keyof typeof MaterialIcons.glyphMap> = {
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
  return map[category] || "more-horiz";
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Elevation.elevation1,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  amountSection: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 24,
  },
  amountLabel: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  currencySymbol: {
    color: Colors.textTertiary,
    fontSize: 32,
    fontWeight: "300",
  },
  amountText: {
    color: Colors.textPrimary,
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  merchantInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
    padding: 0,
  },
  noteInput: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    padding: 0,
  },
  suggestionsSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  suggestionsLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 10,
  },
  suggestionsScroll: {
    paddingHorizontal: 24,
    gap: 10,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  suggestionChipActive: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryMedium,
  },
  suggestionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  categorySection: {
    marginBottom: 4,
  },
  categoryScroll: {
    paddingHorizontal: 24,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  bottomSection: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    ...Elevation.elevation3,
  },
  saveButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Elevation.elevationBrand,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  autoLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  amountShortcutsScroll: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 12,
  },
  amountChip: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  amountChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryMedium,
  },
  amountChipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  amountChipTextActive: {
    color: Colors.primary,
  },
  typeToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  typeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  typeToggleActive: {
    backgroundColor: Colors.expenseBg,
    borderColor: Colors.expense,
  },
  typeToggleActiveIncome: {
    backgroundColor: Colors.incomeBg,
    borderColor: Colors.income,
  },
  typeToggleText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: "600",
  },
  typeToggleTextExpense: {
    color: Colors.expense,
  },
  typeToggleTextIncome: {
    color: Colors.income,
  },
});
