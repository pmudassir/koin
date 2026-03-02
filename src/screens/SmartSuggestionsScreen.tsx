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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../theme';
import { Category } from '../models/Transaction';
import {
  getCombinedSuggestions,
  getFrequencyBasedSuggestions,
  Suggestion,
} from '../services/suggestions';
import { addTransaction, getTransactionsForDay } from '../storage/transactionStorage';
import { Transaction } from '../models/Transaction';
import { SuggestionPill } from '../components/SuggestionPill';

export default function SmartSuggestionsScreen() {
  const navigation = useNavigation<any>();
  const [quickSuggestions, setQuickSuggestions] = useState<Suggestion[]>([]);
  const [frequentSuggestions, setFrequentSuggestions] = useState<Suggestion[]>([]);
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      setQuickSuggestions(getCombinedSuggestions().slice(0, 5));
      setFrequentSuggestions(getFrequencyBasedSuggestions().slice(0, 4));
      setTodayTransactions(getTransactionsForDay(new Date()).slice(0, 3));
    }, [])
  );

  const handleQuickLog = (suggestion: Suggestion) => {
    addTransaction({
      amount: suggestion.amount,
      merchant: suggestion.merchant,
      category: suggestion.category,
      isAutoDetected: false,
    });
    // Refresh data
    setTodayTransactions(getTransactionsForDay(new Date()).slice(0, 3));
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="chevron-left" size={28} color={Colors.slate300} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Suggestions</Text>
          <TouchableOpacity style={styles.searchButton}>
            <MaterialIcons name="search" size={22} color={Colors.slate300} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Quick Log</Text>
            <Text style={styles.heroSubtext}>
              Based on your recent activity. One tap to record.
            </Text>
          </View>

          {/* Quick Suggestion Pills */}
          {quickSuggestions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsScroll}
              style={styles.pillsContainer}
            >
              {quickSuggestions.map((s, i) => (
                <SuggestionPill
                  key={`quick-${i}`}
                  suggestion={s}
                  onPress={handleQuickLog}
                  variant="pill"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPills}>
              <Text style={styles.emptyText}>
                Add some expenses to see suggestions here
              </Text>
            </View>
          )}

          {/* Frequently Logged Grid */}
          <View style={styles.gridSection}>
            <Text style={styles.sectionLabel}>FREQUENTLY LOGGED</Text>
            {frequentSuggestions.length > 0 ? (
              <View style={styles.grid}>
                {frequentSuggestions.map((s, i) => (
                  <SuggestionPill
                    key={`freq-${i}`}
                    suggestion={s}
                    onPress={handleQuickLog}
                    variant="card"
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyGrid}>
                <MaterialIcons name="lightbulb-outline" size={32} color={Colors.slate600} />
                <Text style={styles.emptyGridText}>
                  As you log expenses, frequently used merchants will appear here
                </Text>
              </View>
            )}
          </View>

          {/* Today's Transactions */}
          <View style={styles.todaySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {todayTransactions.length > 0 ? (
              <View style={styles.txnList}>
                {todayTransactions.map((txn) => (
                  <View key={txn.id} style={styles.txnItem}>
                    <View style={styles.txnIcon}>
                      <MaterialIcons name="payments" size={20} color={Colors.slate400} />
                    </View>
                    <View style={styles.txnInfo}>
                      <Text style={styles.txnMerchant}>{txn.merchant}</Text>
                      <Text style={styles.txnTime}>
                        {new Date(txn.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </Text>
                    </View>
                    <Text style={styles.txnAmount}>
                      -₹{txn.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noTxnText}>No transactions today yet</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.slate100,
    fontSize: 18,
    fontWeight: '600',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  heroTitle: {
    color: Colors.slate100,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroSubtext: {
    color: Colors.slate400,
    fontSize: 16,
    marginTop: 8,
    lineHeight: 22,
  },
  pillsContainer: {
    marginTop: 16,
  },
  pillsScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyPills: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  emptyText: {
    color: Colors.slate500,
    fontSize: 14,
    textAlign: 'center',
  },
  gridSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sectionLabel: {
    color: Colors.slate500,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyGrid: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyGridText: {
    color: Colors.slate500,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  todaySection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  txnList: {
    gap: 12,
  },
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.slate700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: {
    flex: 1,
  },
  txnMerchant: {
    color: Colors.slate100,
    fontSize: 14,
    fontWeight: '600',
  },
  txnTime: {
    color: Colors.slate400,
    fontSize: 12,
    marginTop: 2,
  },
  txnAmount: {
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: '700',
  },
  noTxnText: {
    color: Colors.slate500,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
