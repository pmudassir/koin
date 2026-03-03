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
} from "react-native";
import { showToast, showConfirm } from "../components/Toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../theme";
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
import { transactionDetector } from "../services/transactionDetector";

export default function SettingsScreen() {
  const [biometrics, setBiometrics] = useState(isBiometricsEnabled());
  const [cloudSync, setCloudSync] = useState(false);
  const [budget, setBudget] = useState(getDailyBudget());
  const [period, setPeriod] = useState<BudgetPeriod>(getBudgetPeriod());
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    getCustomCategories(),
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("coffee");
  const [newCatColor, setNewCatColor] = useState("#60a5fa");

  const toggleBiometrics = (value: boolean) => {
    setBiometrics(value);
    setBiometricsEnabled(value);
  };

  const handleBudgetChange = () => {
    Alert.prompt(
      "Budget Amount",
      `Set your ${period} spending limit (₹)`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (value?: string) => {
            const num = parseFloat(value || "0");
            if (num > 0) {
              setBudget(num);
              setDailyBudget(num);
            }
          },
        },
      ],
      "plain-text",
      budget.toString(),
      "number-pad",
    );
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
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>K</Text>
            </View>
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
                    { backgroundColor: "rgba(37, 99, 235, 0.15)" },
                  ]}
                >
                  <MaterialIcons name="fingerprint" size={20} color="#60a5fa" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Face ID / Biometrics</Text>
                  <Text style={styles.settingSubtitle}>Lock app on close</Text>
                </View>
              </View>
              <Switch
                value={biometrics}
                onValueChange={toggleBiometrics}
                trackColor={{ false: Colors.slate700, true: Colors.primary }}
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
                    { backgroundColor: "rgba(5, 150, 105, 0.15)" },
                  ]}
                >
                  <MaterialIcons
                    name="calendar-today"
                    size={20}
                    color="#34d399"
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
                    { backgroundColor: "rgba(5, 150, 105, 0.15)" },
                  ]}
                >
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color="#34d399"
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
                color={Colors.slate500}
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
                    { backgroundColor: "rgba(147, 51, 234, 0.15)" },
                  ]}
                >
                  <MaterialIcons name="add-circle" size={20} color="#c084fc" />
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
                color={Colors.slate500}
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
                  color={Colors.slate500}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sync */}
          <Text style={styles.sectionLabel}>DATA</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: "rgba(234, 88, 12, 0.15)" },
                  ]}
                >
                  <MaterialIcons
                    name="cloud-upload"
                    size={20}
                    color="#fb923c"
                  />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Cloud Sync</Text>
                  <Text style={styles.settingSubtitle}>Firebase backup</Text>
                </View>
              </View>
              <Switch
                value={cloudSync}
                onValueChange={setCloudSync}
                trackColor={{ false: Colors.slate700, true: Colors.primary }}
                thumbColor={Colors.white}
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
                  onPress={() => {
                    try {
                      transactionDetector.requestSmsPermission();
                      showToast({
                        type: "info",
                        title: "SMS Permission",
                        message: "Check the permission dialog",
                      });
                    } catch (e) {
                      showToast({
                        type: "error",
                        title: "Error",
                        message: "Could not request SMS permission",
                      });
                    }
                  }}
                >
                  <View style={styles.settingLeft}>
                    <View
                      style={[
                        styles.settingIcon,
                        { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                      ]}
                    >
                      <MaterialIcons name="sms" size={20} color="#34d399" />
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
                    color={Colors.slate500}
                  />
                </TouchableOpacity>

                <View style={styles.settingDivider} />

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => {
                    try {
                      transactionDetector.openNotificationListenerSettings();
                      showToast({
                        type: "info",
                        title: "Notification Access",
                        message: "Enable Koin in the list",
                      });
                    } catch (e) {
                      showToast({
                        type: "error",
                        title: "Error",
                        message: "Could not open notification settings",
                      });
                    }
                  }}
                >
                  <View style={styles.settingLeft}>
                    <View
                      style={[
                        styles.settingIcon,
                        { backgroundColor: "rgba(59, 130, 246, 0.15)" },
                      ]}
                    >
                      <MaterialIcons
                        name="notifications-active"
                        size={20}
                        color="#60a5fa"
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
                    color={Colors.slate500}
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
                    { backgroundColor: "rgba(147, 51, 234, 0.15)" },
                  ]}
                >
                  <MaterialIcons
                    name="info-outline"
                    size={20}
                    color="#c084fc"
                  />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Koin</Text>
                  <Text style={styles.settingSubtitle}>Version 1.0.0</Text>
                </View>
              </View>
            </View>
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
                <MaterialIcons name="close" size={24} color={Colors.slate400} />
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              placeholderTextColor={Colors.slate600}
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
                      newCatIcon === icon.name ? newCatColor : Colors.slate400
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: Colors.slate100,
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
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.slate800,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarLargeText: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: "700",
  },
  profileName: {
    color: Colors.slate100,
    fontSize: 20,
    fontWeight: "700",
  },
  profileEmail: {
    color: Colors.slate400,
    fontSize: 14,
  },
  sectionLabel: {
    color: Colors.slate500,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  settingsGroup: {
    marginHorizontal: 24,
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(30, 41, 59, 0.8)",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "rgba(100, 116, 139, 0.15)",
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
    color: Colors.slate100,
    fontSize: 15,
    fontWeight: "600",
  },
  settingSubtitle: {
    color: Colors.slate400,
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
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    alignItems: "center",
  },
  periodPillActive: {
    backgroundColor: "rgba(19, 127, 236, 0.2)",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  periodText: {
    color: Colors.slate400,
    fontSize: 13,
    fontWeight: "600",
  },
  periodTextActive: {
    color: Colors.primary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.backgroundDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: "rgba(30, 41, 59, 0.8)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: Colors.slate100,
    fontSize: 20,
    fontWeight: "700",
  },
  modalInput: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    padding: 14,
    color: Colors.slate100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(30, 41, 59, 0.8)",
    marginBottom: 16,
  },
  modalLabel: {
    color: Colors.slate400,
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
    backgroundColor: "rgba(30, 41, 59, 0.5)",
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
    borderColor: Colors.white,
    transform: [{ scale: 1.15 }],
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "rgba(30, 41, 59, 0.3)",
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
    color: Colors.slate100,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
