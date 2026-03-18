import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { showConfirm } from '../components/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Elevation } from '../theme';
import { Transaction, Category } from '../models/Transaction';
import {
  getTransactions,
  deleteTransaction,
  searchTransactions,
  SearchFilters,
} from '../storage/transactionStorage';
import TransactionItem from '../components/TransactionItem';
import { TransactionSkeleton } from '../components/Skeleton';

const ALL_CATEGORIES: Category[] = [
  'Food', 'Transport', 'Groceries', 'Bills',
  'Shopping', 'Health', 'Transfer', 'Entertainment', 'Others',
];

type DatePreset = 'all' | 'today' | 'week' | 'month';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

interface GroupedTransactions {
  date: string;
  dateLabel: string;
  transactions: Transaction[];
  total: number;
}

function getDateRange(preset: DatePreset): { start?: Date; end?: Date } {
  const now = new Date();
  if (preset === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start };
  }
  if (preset === 'week') {
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return { start: monday };
  }
  if (preset === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    return { start: monthStart };
  }
  return {};
}

function groupByDate(transactions: Transaction[]): GroupedTransactions[] {
  const groups: Record<string, Transaction[]> = {};

  for (const txn of transactions) {
    const date = new Date(txn.timestamp).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  return Object.entries(groups).map(([dateStr, txns]) => {
    const date = new Date(dateStr);
    let dateLabel: string;

    if (date.toDateString() === now.toDateString()) {
      dateLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });
    }

    return {
      date: dateStr,
      dateLabel,
      transactions: txns,
      total: txns.reduce((sum, t) => sum + t.amount, 0),
    };
  });
}

export default function AllTransactionsScreen() {
  const navigation = useNavigation<any>();
  const [groups, setGroups] = useState<GroupedTransactions[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const searchInputRef = useRef<TextInput>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategories.length > 0 || datePreset !== 'all';
  const [totalResults, setTotalResults] = useState(0);

  const runSearch = useCallback((query: string, cats: Category[], preset: DatePreset) => {
    const dateRange = getDateRange(preset);
    const filters: SearchFilters = {};
    if (cats.length > 0) filters.categories = cats;
    if (dateRange.start) filters.startDate = dateRange.start;
    if (dateRange.end) filters.endDate = dateRange.end;

    const hasQuery = query.trim().length > 0;
    const hasFilters = cats.length > 0 || preset !== 'all';

    let results: Transaction[];
    if (hasQuery || hasFilters) {
      results = searchTransactions(query, filters);
    } else {
      results = getTransactions();
    }

    setTotalResults(results.length);
    setGroups(groupByDate(results));
  }, []);

  const loadData = useCallback(() => {
    runSearch(searchQuery, selectedCategories, datePreset);
    setIsFirstLoad(false);
  }, [runSearch, searchQuery, selectedCategories, datePreset]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      runSearch(text, selectedCategories, datePreset);
    }, 200);
  };

  const toggleCategory = (cat: Category) => {
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(updated);
    runSearch(searchQuery, updated, datePreset);
  };

  const handleDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    runSearch(searchQuery, selectedCategories, preset);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setDatePreset('all');
    runSearch('', [], 'all');
  };

  const handleDelete = (txn: Transaction) => {
    showConfirm({
      title: 'Delete Transaction',
      message: `Delete "${txn.merchant}" — ₹${txn.amount.toLocaleString('en-IN')}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        deleteTransaction(txn.id);
        loadData();
      },
    });
  };

  const handleEdit = (txn: Transaction) => {
    navigation.navigate('AddExpense', { transaction: txn });
  };

  const renderGroup = ({ item }: { item: GroupedTransactions }) => (
    <View style={styles.group}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{item.dateLabel}</Text>
        <Text style={styles.dateTotal}>
          -₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.txnList}>
        {item.transactions.map((txn, index) => (
          <Animated.View
            key={txn.id}
            entering={FadeInDown.delay(index * 50).springify().damping(18).stiffness(200)}
          >
            <TransactionItem
              transaction={txn}
              onEdit={() => handleEdit(txn)}
              onDelete={() => handleDelete(txn)}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Transactions</Text>
          <TouchableOpacity
            style={[styles.searchToggle, showSearch && styles.searchToggleActive]}
            onPress={() => {
              setShowSearch(!showSearch);
              if (!showSearch) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              } else {
                clearFilters();
              }
            }}
          >
            <MaterialIcons
              name={showSearch ? 'close' : 'search'}
              size={22}
              color={showSearch ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar + Filters */}
        {showSearch && (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={Colors.textTertiary} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search merchant, category, or note..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearchChange('')}>
                  <MaterialIcons name="clear" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Date Preset Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {DATE_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.filterChip,
                    datePreset === p.key && styles.filterChipActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleDatePreset(p.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      datePreset === p.key && styles.filterChipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {ALL_CATEGORIES.map((cat) => {
                const isActive = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => toggleCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Results count + clear */}
            {hasActiveFilters && (
              <View style={styles.resultsRow}>
                <Text style={styles.resultsText}>
                  {totalResults} result{totalResults !== 1 ? 's' : ''}
                </Text>
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {isFirstLoad ? (
          <View style={styles.listContent}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 12 }}>
                <TransactionSkeleton />
              </View>
            ))}
          </View>
        ) : groups.length === 0 ? (
          <Animated.View style={styles.emptyState} entering={FadeInDown.springify().damping(18)}>
            <Image
              source={require('../../assets/mascot/mascot-idle.png')}
              style={styles.emptyMascot}
            />
            <Text style={styles.emptyText}>
              {hasActiveFilters ? 'No matches found' : 'No transactions yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Start tracking your expenses'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <FlashList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.elevation1,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  searchToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.elevation1,
  },
  searchToggleActive: {
    backgroundColor: Colors.primarySoft,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryMedium,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  resultsText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  clearText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  group: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  dateTotal: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  txnList: {
    gap: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyMascot: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  clearButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
  },
  clearButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
