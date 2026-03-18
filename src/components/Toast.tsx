import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ToastType = "success" | "error" | "warning" | "info";

interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onPress: () => void };
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string; iconName: keyof typeof MaterialIcons.glyphMap }> = {
  success: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    icon: "#059669",
    iconName: "check-circle",
  },
  error: {
    bg: "#FEF2F2",
    border: "#FECACA",
    icon: "#DC2626",
    iconName: "error",
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: "#D97706",
    iconName: "warning",
  },
  info: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    icon: "#2563EB",
    iconName: "info",
  },
};

// Global toast state
let globalShowToast: ((config: ToastConfig) => void) | null = null;

export function showToast(config: ToastConfig) {
  if (globalShowToast) {
    globalShowToast(config);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
    });
  }, [translateY, opacity]);

  const show = useCallback(
    (newConfig: ToastConfig) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setConfig(newConfig);
      setVisible(true);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = newConfig.duration ?? 3000;
      timeoutRef.current = setTimeout(hide, duration);
    },
    [translateY, opacity, hide]
  );

  useEffect(() => {
    globalShowToast = show;
    return () => {
      globalShowToast = null;
    };
  }, [show]);

  const colors = visible && config ? TOAST_COLORS[config.type] : null;

  return (
    <View style={{ flex: 1 }}>
      {children}
      {visible && config && colors && (
        <Modal
          visible={true}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={hide}
        >
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            >
              <View
                style={[
                  styles.toast,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.accentBar, { backgroundColor: colors.icon }]} />
                <View style={styles.iconContainer}>
                  <MaterialIcons name={colors.iconName} size={22} color={colors.icon} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{config.title}</Text>
                  {config.message && (
                    <Text style={styles.message} numberOfLines={2}>
                      {config.message}
                    </Text>
                  )}
                </View>
                {config.action ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      config.action?.onPress();
                      hide();
                    }}
                  >
                    <Text style={[styles.actionText, { color: colors.icon }]}>
                      {config.action.label}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={hide} hitSlop={8}>
                    <MaterialIcons name="close" size={18} color={Colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

let globalShowConfirm: ((config: ConfirmConfig) => void) | null = null;

export function showConfirm(config: ConfirmConfig) {
  if (globalShowConfirm) {
    globalShowConfirm(config);
  }
}

export function ConfirmDialog() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ConfirmConfig | null>(null);
  const scale = useRef(new Animated.Value(0.9)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const show = useCallback(
    (newConfig: ConfirmConfig) => {
      setConfig(newConfig);
      setVisible(true);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 16,
          stiffness: 250,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [scale, bgOpacity]
  );

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
    });
  }, [scale, bgOpacity]);

  useEffect(() => {
    globalShowConfirm = show;
    return () => {
      globalShowConfirm = null;
    };
  }, [show]);

  if (!visible || !config) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
      <Animated.View style={[styles.dialog, { transform: [{ scale }] }]}>
        <View style={styles.dialogIcon}>
          <MaterialIcons
            name={config.destructive ? "delete-outline" : "help-outline"}
            size={28}
            color={config.destructive ? "#ef4444" : Colors.primary}
          />
        </View>
        <Text style={styles.dialogTitle}>{config.title}</Text>
        <Text style={styles.dialogMessage}>{config.message}</Text>
        <View style={styles.dialogActions}>
          <TouchableOpacity
            style={styles.dialogCancelBtn}
            onPress={() => {
              config.onCancel?.();
              hide();
            }}
          >
            <Text style={styles.dialogCancelText}>
              {config.cancelLabel || "Cancel"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dialogConfirmBtn,
              config.destructive && styles.dialogDestructiveBtn,
            ]}
            onPress={() => {
              config.onConfirm();
              hide();
            }}
          >
            <Text
              style={[
                styles.dialogConfirmText,
                config.destructive && styles.dialogDestructiveText,
              ]}
            >
              {config.confirmLabel || "Confirm"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Toast
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 999,
  },
  modalOverlay: {
    flex: 1,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingRight: 16,
    paddingLeft: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Confirm Dialog
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 999,
  },
  dialog: {
    width: SCREEN_WIDTH - 64,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  dialogIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dialogTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  dialogMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  dialogActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  dialogCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogCancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  dialogConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogDestructiveBtn: {
    backgroundColor: Colors.expenseBg,
  },
  dialogConfirmText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  dialogDestructiveText: {
    color: Colors.expense,
  },
});
