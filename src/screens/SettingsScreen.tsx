import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Platform,
  PermissionsAndroid,
  Linking,
  Image,
} from "react-native";
import { showToast, showConfirm } from "../components/Toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Elevation } from "../theme";
import {
  isBiometricsEnabled,
  setBiometricsEnabled,
} from "../services/security";
import {
  getDailyBudget,
  setDailyBudget,
  getBudgetPeriod,
  setBudgetPeriod,
  BudgetPeriod,
} from "../storage/transactionStorage";
import {
  getCustomCategories,
  addCustomCategory,
  removeCustomCategory,
  CustomCategory,
  AVAILABLE_ICONS,
} from "../storage/categoryStorage";
import {
  getCategoryBudgets,
  setCategoryBudget,
  removeCategoryBudget,
} from "../storage/budgetStorage";
import {
  getRecurringTransactions,
  deleteRecurring,
  updateRecurring,
  RecurringTransaction,
} from "../storage/recurringStorage";
import { formatLastSync } from "../services/syncManager";
import { exportToCSV, getExportPresets } from "../services/exportService";
import {
  getNotificationPreferences,
  updateNotificationPreference,
  NotificationPreferences,
  setupNotifications,
} from "../services/notificationService";

export default function SettingsScreen() {
  const [biometrics, setBiometrics] = useState(isBiometricsEnabled());
  const [cloudSync, setCloudSync] = useState(false);
  const [budget, setBudget] = useState(getDailyBudget());
  const [period, setPeriod] = useState<BudgetPeriod>(getBudgetPeriod());
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    getCustomCategories(),
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCatBudgetModal, setShowCatBudgetModal] = useState(false);
  const [catBudgetCategory, setCatBudgetCategory] = useState("");
  const [catBudgetInput, setCatBudgetInput] = useState("");
  const [categoryBudgets, setCategoryBudgetsState] = useState(getCategoryBudgets());
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(getRecurringTransactions());
  const [budgetInput, setBudgetInput] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("coffee");
  const [newCatColor, setNewCatColor] = useState("#60a5fa");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    getNotificationPreferences(),
  );

  const toggleNotifPref = (key: keyof NotificationPreferences) => {
    const newValue = !notifPrefs[key];
    updateNotificationPreference(key, newValue);
    setNotifPrefs((prev) => ({ ...prev, [key]: newValue }));
    // Re-schedule notifications when prefs change
    setupNotifications();
  };

  const toggleBiometrics = (value: boolean) => {
    setBiometrics(value);
    setBiometricsEnabled(value);
  };

  const handleBudgetChange = () => {
    setBudgetInput(budget.toString());
    setShowBudgetModal(true);
  };

  const handleBudgetSave = () => {
    const num = parseFloat(budgetInput || "0");
    if (num > 0) {
      setBudget(num);
      setDailyBudget(num);
      setShowBudgetModal(false);
    } else {
      showToast({
        type: "error",
        title: "Invalid Amount",
        message: "Please enter a valid budget amount",
      });
    }
  };

  const handlePeriodChange = (newPeriod: BudgetPeriod) => {
    setPeriod(newPeriod);
    setBudgetPeriod(newPeriod);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      showToast({
        type: "error",
        title: "Missing Name",
        message: "Please enter a category name",
      });
      return;
    }
    const cat: CustomCategory = {
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
    };
    addCustomCategory(cat);
    setCustomCategories(getCustomCategories());
    setShowCategoryModal(false);
    setNewCatName("");
    setNewCatIcon("coffee");
  };

  const handleDeleteCategory = (name: string) => {
    showConfirm({
      title: "Delete Category",
      message: `Remove "${name}" category?`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        removeCustomCategory(name);
        setCustomCategories(getCustomCategories());
      },
    });
  };

  const handleSetCategoryBudget = (category: string) => {
    setCatBudgetCategory(category);
    setCatBudgetInput(categoryBudgets[category]?.toString() || "");
    setShowCatBudgetModal(true);
  };

  const handleSaveCategoryBudget = () => {
    const num = parseFloat(catBudgetInput || "0");
    if (num > 0) {
      setCategoryBudget(catBudgetCategory, num);
      setCategoryBudgetsState(getCategoryBudgets());
      setShowCatBudgetModal(false);
    } else {
      // Remove budget if 0
      removeCategoryBudget(catBudgetCategory);
      setCategoryBudgetsState(getCategoryBudgets());
      setShowCatBudgetModal(false);
    }
  };

  const handleToggleRecurring = (id: string, enabled: boolean) => {
    updateRecurring(id, { enabled });
    setRecurring(getRecurringTransactions());
  };

  const handleDeleteRecurring = (item: RecurringTransaction) => {
    showConfirm({
      title: "Delete Recurring",
      message: `Remove "${item.merchant}" recurring ${item.frequency} expense?`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        deleteRecurring(item.id);
        setRecurring(getRecurringTransactions());
      },
    });
  };

  const ALL_CATS = ["Food", "Transport", "Groceries", "Bills", "Shopping", "Health", "Entertainment", "Others"];

  const COLORS = [
    "#60a5fa",
    "#4ade80",
    "#f59e0b",
    "#f87171",
    "#c084fc",
    "#22d3ee",
    "#fb923c",
    "#f472b6",
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Image
              source={require('../../assets/mascot/mascot-idle.png')}
              style={styles.profileMascot}
            />
            <Text style={styles.profileName}>Koin User</Text>
            <Text style={styles.profileEmail}>Personal Finance</Text>
          </View>

          {/* Security */}
          <Text style={styles.sectionLabel}>SECURITY</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.transport.bg },
                  ]}
                >
                  <MaterialIcons name="fingerprint" size={20} color={Colors.transport.icon} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Face ID / Biometrics</Text>
                  <Text style={styles.settingSubtitle}>Lock app on close</Text>
                </View>
              </View>
              <Switch
                value={biometrics}
                onValueChange={toggleBiometrics}
                trackColor={{ false: Colors.borderMedium, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* Budget */}
          <Text style={styles.sectionLabel}>BUDGET</Text>
          <View style={styles.settingsGroup}>
            {/* Period Selector */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.bills.bg },
                  ]}
                >
                  <MaterialIcons
                    name="calendar-today"
                    size={20}
                    color={Colors.bills.icon}
                  />
                </View>
                <Text style={styles.settingTitle}>Budget Period</Text>
              </View>
            </View>
            <View style={styles.periodSelector}>
              {(["daily", "weekly", "monthly"] as BudgetPeriod[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodPill,
                    period === p && styles.periodPillActive,
                  ]}
                  onPress={() => handlePeriodChange(p)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === p && styles.periodTextActive,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Budget Amount */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleBudgetChange}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.bills.bg },
                  ]}
                >
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color={Colors.bills.icon}
                  />
                </View>
                <View>
                  <Text style={styles.settingTitle}>
                    {period.charAt(0).toUpperCase() + period.slice(1)} Budget
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    ₹{budget.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <Text style={styles.sectionLabel}>CATEGORIES</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.shopping.bg },
                  ]}
                >
                  <MaterialIcons name="add-circle" size={20} color={Colors.shopping.icon} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Add Custom Category</Text>
                  <Text style={styles.settingSubtitle}>
                    {customCategories.length} custom categories
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>

            {customCategories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={styles.settingRow}
                onPress={() => handleDeleteCategory(cat.name)}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: `${cat.color}25` },
                    ]}
                  >
                    <MaterialIcons
                      name={cat.icon as any}
                      size={20}
                      color={cat.color}
                    />
                  </View>
                  <Text style={styles.settingTitle}>{cat.name}</Text>
                </View>
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Budgets */}
          <Text style={styles.sectionLabel}>CATEGORY BUDGETS</Text>
          <View style={styles.settingsGroup}>
            {ALL_CATS.map((cat) => {
              const budgetAmt = categoryBudgets[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.settingRow}
                  onPress={() => handleSetCategoryBudget(cat)}
                >
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingTitle}>{cat}</Text>
                  </View>
                  <Text style={[styles.settingSubtitle, budgetAmt ? { color: Colors.primary } : undefined]}>
                    {budgetAmt ? `₹${budgetAmt.toLocaleString("en-IN")}` : "Not set"}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recurring Expenses */}
          <Text style={styles.sectionLabel}>RECURRING</Text>
          <View style={styles.settingsGroup}>
            {recurring.length === 0 ? (
              <View style={styles.settingRow}>
                <Text style={styles.settingSubtitle}>
                  No recurring transactions. Add one from the expense screen.
                </Text>
              </View>
            ) : (
              recurring.map((item) => (
                <View key={item.id} style={styles.settingRow}>
                  <View style={[styles.settingLeft, { flex: 1 }]}>
                    <View>
                      <Text style={styles.settingTitle}>{item.merchant}</Text>
                      <Text style={styles.settingSubtitle}>
                        ₹{item.amount.toLocaleString("en-IN")} / {item.frequency}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={item.enabled}
                    onValueChange={(val) => handleToggleRecurring(item.id, val)}
                    trackColor={{ false: Colors.borderMedium, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                  <TouchableOpacity
                    style={{ marginLeft: 8 }}
                    onPress={() => handleDeleteRecurring(item)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Sync */}
          <Text style={styles.sectionLabel}>DATA</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.food.bg },
                  ]}
                >
                  <MaterialIcons
                    name="cloud-upload"
                    size={20}
                    color={Colors.food.icon}
                  />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Cloud Sync</Text>
                  <Text style={styles.settingSubtitle}>
                    {formatLastSync()} • Firebase backup
                  </Text>
                </View>
              </View>
              <Switch
                value={cloudSync}
                onValueChange={setCloudSync}
                trackColor={{ false: Colors.borderMedium, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Export Data */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                const presets = getExportPresets();
                Alert.alert(
                  "Export Transactions",
                  "Choose a date range to export as CSV:",
                  [
                    ...presets.map((p) => ({
                      text: p.label,
                      onPress: async () => {
                        try {
                          await exportToCSV(p.start, p.end);
                        } catch (err: any) {
                          showToast({
                            type: "error",
                            title: "Export Failed",
                            message: err.message || "Could not export data.",
                          });
                        }
                      },
                    })),
                    { text: "Cancel", style: "cancel" as const },
                  ],
                );
              }}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.groceries.bg },
                  ]}
                >
                  <MaterialIcons
                    name="file-download"
                    size={20}
                    color={Colors.groceries.icon}
                  />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Export Data</Text>
                  <Text style={styles.settingSubtitle}>Download as CSV</Text>
                </View>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Notifications */}
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialIcons name="warning" size={20} color="#D97706" />
                </View>
                <Text style={styles.settingTitle}>Budget Warning (80%)</Text>
              </View>
              <Switch
                value={notifPrefs.budgetWarning}
                onValueChange={() => toggleNotifPref('budgetWarning')}
                trackColor={{ true: Colors.primary }}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialIcons name="money-off" size={20} color="#DC2626" />
                </View>
                <Text style={styles.settingTitle}>Over Budget Alert</Text>
              </View>
              <Switch
                value={notifPrefs.overBudget}
                onValueChange={() => toggleNotifPref('overBudget')}
                trackColor={{ true: Colors.primary }}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialIcons name="notifications" size={20} color="#2563EB" />
                </View>
                <Text style={styles.settingTitle}>Daily Reminder (7pm)</Text>
              </View>
              <Switch
                value={notifPrefs.dailyReminder}
                onValueChange={() => toggleNotifPref('dailyReminder')}
                trackColor={{ true: Colors.primary }}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#F3E8FF' }]}>
                  <MaterialIcons name="summarize" size={20} color="#9333EA" />
                </View>
                <Text style={styles.settingTitle}>Weekly Summary</Text>
              </View>
              <Switch
                value={notifPrefs.weeklySummary}
                onValueChange={() => toggleNotifPref('weeklySummary')}
                trackColor={{ true: Colors.primary }}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialIcons name="category" size={20} color="#16A34A" />
                </View>
                <Text style={styles.settingTitle}>Category Budget Alerts</Text>
              </View>
              <Switch
                value={notifPrefs.categoryAlert}
                onValueChange={() => toggleNotifPref('categoryAlert')}
                trackColor={{ true: Colors.primary }}
              />
            </View>
          </View>

          {/* Auto-Detect (Android only) */}
          {Platform.OS === "android" && (
            <>
              <Text style={styles.sectionLabel}>AUTO-DETECT</Text>
              <View style={styles.settingsGroup}>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={async () => {
                    try {
                      const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
                        {
                          title: "SMS Permission",
                          message: "Koin needs SMS access to auto-detect bank transactions.",
                          buttonPositive: "Allow",
                          buttonNegative: "Deny",
                        }
                      );
                      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                        showToast({
                          type: "success",
                          title: "SMS Permission",
                          message: "Permission granted! Bank SMS will be auto-detected.",
                        });
                      } else {
                        // Permission denied or never_ask_again — open app settings
                        Alert.alert(
                          "SMS Permission Required",
                          "Please enable SMS permission in app settings to auto-detect bank transactions.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Open Settings",
                              onPress: () => Linking.openSettings(),
                            },
                          ]
                        );
                      }
                    } catch (e) {
                      // Fallback: open app settings directly
                      Linking.openSettings();
                    }
                  }}
                >
                  <View style={styles.settingLeft}>
                    <View
                      style={[
                        styles.settingIcon,
                        { backgroundColor: Colors.fuel.bg },
                      ]}
                    >
                      <MaterialIcons name="sms" size={20} color={Colors.fuel.icon} />
                    </View>
                    <View>
                      <Text style={styles.settingTitle}>SMS Detection</Text>
                      <Text style={styles.settingSubtitle}>
                        Auto-read bank SMS
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={Colors.textTertiary}
                  />
                </TouchableOpacity>

                <View style={styles.settingDivider} />

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => {
                    Alert.alert(
                      "Notification Access",
                      "You'll be taken to notification access settings. Find \"Koin\" in the list and enable it to auto-detect payment notifications.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Open Settings",
                          onPress: async () => {
                            try {
                              await Linking.sendIntent(
                                "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"
                              );
                            } catch (e) {
                              Linking.openSettings();
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <View style={styles.settingLeft}>
                    <View
                      style={[
                        styles.settingIcon,
                        { backgroundColor: Colors.transport.bg },
                      ]}
                    >
                      <MaterialIcons
                        name="notifications-active"
                        size={20}
                        color={Colors.transport.icon}
                      />
                    </View>
                    <View>
                      <Text style={styles.settingTitle}>
                        Notification Access
                      </Text>
                      <Text style={styles.settingSubtitle}>
                        Read GPay, PhonePe alerts
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={Colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* About */}
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.shopping.bg },
                  ]}
                >
                  <MaterialIcons
                    name="info-outline"
                    size={20}
                    color={Colors.shopping.icon}
                  />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Koin</Text>
                  <Text style={styles.settingSubtitle}>Version 1.0.0</Text>
                </View>
              </View>
            </View>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Linking.openURL("https://github.com/pmudassir")}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.other.bg },
                  ]}
                >
                  <MaterialIcons name="code" size={20} color={Colors.other.icon} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Developer</Text>
                  <Text style={styles.settingSubtitle}>github.com/pmudassir</Text>
                </View>
              </View>
              <MaterialIcons
                name="open-in-new"
                size={18}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Add Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              placeholderTextColor={Colors.textTertiary}
              value={newCatName}
              onChangeText={setNewCatName}
              autoCapitalize="words"
            />

            {/* Icon Picker */}
            <Text style={styles.modalLabel}>Choose Icon</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon.name}
                  style={[
                    styles.iconOption,
                    newCatIcon === icon.name && {
                      borderColor: newCatColor,
                      backgroundColor: `${newCatColor}20`,
                    },
                  ]}
                  onPress={() => setNewCatIcon(icon.name)}
                >
                  <MaterialIcons
                    name={icon.name as any}
                    size={22}
                    color={
                      newCatIcon === icon.name ? newCatColor : Colors.textTertiary
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Color Picker */}
            <Text style={styles.modalLabel}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newCatColor === color && styles.colorOptionActive,
                  ]}
                  onPress={() => setNewCatColor(color)}
                />
              ))}
            </View>

            {/* Preview */}
            <View style={styles.previewRow}>
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: `${newCatColor}30` },
                ]}
              >
                <MaterialIcons
                  name={newCatIcon as any}
                  size={24}
                  color={newCatColor}
                />
              </View>
              <Text style={styles.previewName}>
                {newCatName || "Category Name"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddCategory}
            >
              <Text style={styles.saveButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Budget Modal */}
      <Modal
        visible={showCatBudgetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCatBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{catBudgetCategory} Budget</Text>
              <TouchableOpacity onPress={() => setShowCatBudgetModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>
              Monthly limit for {catBudgetCategory}
            </Text>
            <View style={styles.budgetInputRow}>
              <Text style={styles.budgetCurrency}>₹</Text>
              <TextInput
                style={styles.budgetInputField}
                value={catBudgetInput}
                onChangeText={setCatBudgetInput}
                keyboardType="number-pad"
                placeholder="0 (no limit)"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
                selectTextOnFocus
              />
            </View>
            <TouchableOpacity
              style={styles.budgetSaveBtn}
              activeOpacity={0.8}
              onPress={handleSaveCategoryBudget}
            >
              <Text style={styles.budgetSaveBtnText}>
                {catBudgetInput && parseFloat(catBudgetInput) > 0 ? "Save Limit" : "Remove Limit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Budget Modal */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Budget</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              {period.charAt(0).toUpperCase() + period.slice(1)} spending limit
            </Text>
            <View style={styles.budgetInputRow}>
              <Text style={styles.budgetCurrency}>₹</Text>
              <TextInput
                style={styles.budgetInputField}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
                selectTextOnFocus
              />
            </View>

            <TouchableOpacity
              style={styles.budgetSaveBtn}
              activeOpacity={0.8}
              onPress={handleBudgetSave}
            >
              <Text style={styles.budgetSaveBtnText}>Save Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  profileMascot: {
    width: 80,
    height: 80,
    marginBottom: 4,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  profileEmail: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  settingsGroup: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: "hidden",
    ...Elevation.elevation1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  settingSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.canvas,
    alignItems: "center",
  },
  periodPillActive: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  periodText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: "600",
  },
  periodTextActive: {
    color: Colors.primary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Elevation.elevation3,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  modalInput: {
    backgroundColor: Colors.canvas,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    marginBottom: 16,
  },
  modalLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorOptionActive: {
    borderColor: Colors.textPrimary,
    transform: [{ scale: 1.15 }],
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: Colors.canvas,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Elevation.elevationBrand,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  // Budget modal
  budgetInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  budgetCurrency: {
    color: Colors.textTertiary,
    fontSize: 24,
    fontWeight: "700",
    marginRight: 8,
  },
  budgetInputField: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    paddingVertical: 14,
  },
  budgetSaveBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Elevation.elevationBrand,
  },
  budgetSaveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
