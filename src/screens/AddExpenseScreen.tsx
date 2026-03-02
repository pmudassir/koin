import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../theme';
import { Category } from '../models/Transaction';
import { addTransaction, updateTransaction } from '../storage/transactionStorage';
import { getCombinedSuggestions, Suggestion } from '../services/suggestions';
import { categorize } from '../utils/categorization';
import { getCustomCategories } from '../storage/categoryStorage';
import NumPad from '../components/NumPad';
import CategoryChip from '../components/CategoryChip';

const DEFAULT_CATEGORIES: Category[] = ['Food', 'Transport', 'Groceries', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Others'];

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const editingTxn = route.params?.transaction;
  const isEditing = !!editingTxn;

  const [amount, setAmount] = useState(editingTxn ? editingTxn.amount.toString() : '0');
  const [merchant, setMerchant] = useState(editingTxn?.merchant || '');
  const [category, setCategory] = useState<Category>(editingTxn?.category || 'Food');
  const [note, setNote] = useState(editingTxn?.note || '');
  const [suggestions] = useState<Suggestion[]>(() => getCombinedSuggestions());

  // Load custom categories
  const customCategories = getCustomCategories();
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories.map((c: { name: string }) => c.name as Category)];

  const handleKeyPress = (key: string) => {
    setAmount((prev: string) => {
      if (prev === '0' && key !== '.') return key;
      if (key === '.' && prev.includes('.')) return prev;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      return prev + key;
    });
  };

  const handleBackspace = () => {
    setAmount((prev: string) => {
      if (prev.length <= 1) return '0';
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
      Alert.alert('Invalid Amount', 'Please enter an amount greater than zero.');
      return;
    }

    const merchantName = merchant.trim() || category;

    if (isEditing) {
      updateTransaction(editingTxn.id, {
        amount: numericAmount,
        merchant: merchantName,
        category,
        note: note.trim() || undefined,
      });
    } else {
      addTransaction({
        amount: numericAmount,
        merchant: merchantName,
        category,
        isAutoDetected: false,
        note: note.trim() || undefined,
      });
    }

    navigation.goBack();
  };

  const displayAmount = amount === '0' ? '0' :
    parseFloat(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      useGrouping: true,
    });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="close" size={24} color={Colors.slate100} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </Text>
          <TouchableOpacity style={styles.historyButton}>
            <MaterialIcons name="history" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Amount Display */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>SPENDING AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.amountText}>{amount === '0' ? '0' : displayAmount}</Text>
          </View>

          {/* Merchant Name Input */}
          <View style={styles.inputRow}>
            <MaterialIcons name="store" size={18} color={Colors.slate500} />
            <TextInput
              style={styles.merchantInput}
              placeholder="Merchant name (e.g. Swiggy, Uber)"
              placeholderTextColor={Colors.slate600}
              value={merchant}
              onChangeText={setMerchant}
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>

          {/* Note Input */}
          <View style={styles.inputRow}>
            <MaterialIcons name="edit-note" size={18} color={Colors.slate500} />
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note (optional)"
              placeholderTextColor={Colors.slate600}
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
                    color={i === 0 ? Colors.primary : Colors.slate400}
                  />
                  <Text
                    style={[
                      styles.suggestionText,
                      i === 0 && { color: Colors.slate100 },
                    ]}
                  >
                    {s.merchant} ₹{s.amount.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category Chips */}
        <View style={styles.categorySection}>
          <ScrollView contentContainerStyle={styles.categoryScroll}>
            <View style={styles.categoryWrap}>
              {allCategories.map((cat) => (
                <CategoryChip
                  key={cat}
                  category={cat}
                  isActive={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Numpad + Save Button */}
        <View style={styles.bottomSection}>
          <NumPad
            value={amount}
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
          />
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Expense' : 'Save Expense'}
              </Text>
              <MaterialIcons name="check-circle" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function getCategoryMaterialIcon(category: Category): keyof typeof MaterialIcons.glyphMap {
  const map: Record<string, keyof typeof MaterialIcons.glyphMap> = {
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
  return map[category] || 'more-horiz';
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.slate100,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 24,
  },
  amountLabel: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  currencySymbol: {
    color: Colors.slate400,
    fontSize: 32,
    fontWeight: '300',
  },
  amountText: {
    color: Colors.slate100,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
  },
  merchantInput: {
    flex: 1,
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  noteInput: {
    flex: 1,
    color: Colors.slate300,
    fontSize: 14,
    padding: 0,
  },
  suggestionsSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  suggestionsLabel: {
    color: Colors.slate400,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  suggestionsScroll: {
    paddingHorizontal: 24,
    gap: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.slate800,
  },
  suggestionChipActive: {
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(19, 127, 236, 0.2)',
  },
  suggestionText: {
    color: Colors.slate300,
    fontSize: 14,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 4,
  },
  categoryScroll: {
    paddingHorizontal: 24,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.8)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
