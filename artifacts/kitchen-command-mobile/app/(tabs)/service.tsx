import { Feather } from "@expo/vector-icons";
import {
  getGetInventoryAlertsQueryKey,
  getListPrepTasksQueryKey,
  useClaimPrepTask,
  useCompleteServicePrepTask,
  useCreateServiceTemperatureLog,
  useCreateServiceWasteLog,
  useGetInventoryAlerts,
  useListPrepTasks,
} from "@workspace/api-client-react";
import { SwipeableTaskRow } from "@/components/SwipeableTaskRow";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVenue } from "@/contexts/VenueContext";
import { useColors } from "@/hooks/useColors";

type QuickAction = "waste" | "temp" | null;

const TODAY = new Date().toISOString().split("T")[0]!;

export default function ServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { venueId } = useVenue();
  const [staffName, setStaffName] = useState("");
  const [quickAction, setQuickAction] = useState<QuickAction>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const prepQuery = useListPrepTasks(
    venueId ?? 0,
    { date: TODAY },
    {
      query: {
        enabled: !!venueId,
        queryKey: getListPrepTasksQueryKey(venueId ?? 0, { date: TODAY }),
      },
    },
  );

  const alertsQuery = useGetInventoryAlerts(venueId ?? 0, {
    query: {
      enabled: !!venueId,
      queryKey: getGetInventoryAlertsQueryKey(venueId ?? 0),
    },
  });

  const completeTask = useCompleteServicePrepTask();
  const claimTask = useClaimPrepTask();

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const prepTasks = prepQuery.data ?? [];
  const lowStockItems = [
    ...(alertsQuery.data?.critical ?? []),
    ...(alertsQuery.data?.lowStock ?? []),
  ];

  const handleClaimTask = async (taskId: number) => {
    if (!venueId) return;
    setCompletingId(taskId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await claimTask.mutateAsync({
        venueId,
        taskId,
        data: { claimedBy: staffName || "Unknown" },
      });
      prepQuery.refetch();
    } catch {
      Alert.alert("Could not claim task. Try again.");
    } finally {
      setCompletingId(null);
    }
  };

  const handleCompleteTask = async (taskId: number, isDone: boolean) => {
    if (!venueId) return;
    setCompletingId(taskId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await completeTask.mutateAsync({
        venueId,
        taskId,
        data: {
          completedBy: staffName || "Unknown",
          undo: isDone,
        },
      });
      prepQuery.refetch();
    } catch {
      Alert.alert("Could not update task. Try again.");
    } finally {
      setCompletingId(null);
    }
  };

  if (!venueId) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: topPad },
        ]}
      >
        <Feather name="radio" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No venue selected
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Go to More to select your kitchen
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Staff name bar */}
      <View
        style={[
          styles.staffBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topPad + 8,
          },
        ]}
      >
        <Feather name="user" size={15} color={colors.mutedForeground} />
        <TextInput
          style={[styles.staffInput, { color: colors.foreground }]}
          value={staffName}
          onChangeText={setStaffName}
          placeholder="Your name for logs..."
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="done"
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        {/* Low stock strip */}
        {lowStockItems.length > 0 && (
          <View
            style={[
              styles.lowStockStrip,
              { backgroundColor: colors.destructive + "18" },
            ]}
          >
            <Feather
              name="alert-triangle"
              size={14}
              color={colors.destructive}
            />
            <Text
              style={[styles.lowStockText, { color: colors.destructive }]}
            >
              {lowStockItems.length} item
              {lowStockItems.length !== 1 ? "s" : ""} running low:{" "}
              {lowStockItems
                .slice(0, 3)
                .map((i) => i.name)
                .join(", ")}
              {lowStockItems.length > 3
                ? ` +${lowStockItems.length - 3}`
                : ""}
            </Text>
          </View>
        )}

        {/* Prep tasks */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            PREP TASKS — TODAY
          </Text>
          {prepTasks.length === 0 && !prepQuery.isLoading ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.emptyCardText,
                  { color: colors.mutedForeground },
                ]}
              >
                All prep done — service is set
              </Text>
            </View>
          ) : (
            prepTasks.map((task) => {
              const isDone = task.status === "done";
              return (
                <SwipeableTaskRow
                  key={task.id}
                  taskId={task.id}
                  taskStatus={task.status}
                  colors={colors}
                  onComplete={() => handleCompleteTask(task.id, isDone)}
                  onClaim={() => handleClaimTask(task.id)}
                >
                  <Pressable
                    style={[
                      styles.taskRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: completingId === task.id ? 0.6 : 1,
                      },
                    ]}
                    onPress={() => handleCompleteTask(task.id, isDone)}
                  >
                    <View
                      style={[
                        styles.check,
                        {
                          borderColor: isDone ? colors.success : colors.border,
                          backgroundColor: isDone ? colors.success : "transparent",
                        },
                      ]}
                    >
                      {isDone && <Feather name="check" size={13} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.taskTitle,
                          {
                            color: colors.foreground,
                            textDecorationLine: isDone ? "line-through" : "none",
                            opacity: isDone ? 0.6 : 1,
                          },
                        ]}
                      >
                        {task.title}
                      </Text>
                      {task.claimedBy && (
                        <Text style={[styles.completedBy, { color: colors.mutedForeground }]}>
                          {isDone ? "Done by" : "Claimed by"} {task.claimedBy}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </SwipeableTaskRow>
              );
            })
          )}
        </View>

        {/* Quick action buttons */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            QUICK LOG
          </Text>
          <View style={styles.quickRow}>
            <Pressable
              style={[
                styles.quickBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setQuickAction("waste")}
            >
              <Feather name="trash-2" size={20} color={colors.destructive} />
              <Text
                style={[styles.quickBtnLabel, { color: colors.foreground }]}
              >
                Log Waste
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.quickBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setQuickAction("temp")}
            >
              <Feather name="thermometer" size={20} color={colors.warning} />
              <Text
                style={[styles.quickBtnLabel, { color: colors.foreground }]}
              >
                Temp Check
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {quickAction === "waste" && (
        <QuickWasteModal
          venueId={venueId}
          staffName={staffName}
          colors={colors}
          insets={insets}
          onClose={() => setQuickAction(null)}
        />
      )}
      {quickAction === "temp" && (
        <QuickTempModal
          venueId={venueId}
          colors={colors}
          insets={insets}
          onClose={() => setQuickAction(null)}
        />
      )}
    </View>
  );
}

function QuickWasteModal({
  venueId,
  staffName,
  colors,
  insets,
  onClose,
}: {
  venueId: number;
  staffName: string;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onClose: () => void;
}) {
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const { mutate, isPending } = useCreateServiceWasteLog();

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Quick Waste Log
          </Text>
          <Pressable
            onPress={() => {
              if (!item || !qty) return;
              mutate(
                {
                  venueId,
                  data: {
                    itemName: item,
                    quantity: qty,
                    unit,
                    reason: "Service",
                    loggedBy: staffName || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    );
                    onClose();
                  },
                },
              );
            }}
            disabled={isPending}
            hitSlop={8}
          >
            <Text
              style={[
                styles.modalSave,
                {
                  color: isPending ? colors.mutedForeground : colors.primary,
                },
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>
        <View style={{ padding: 20, gap: 16 }}>
          <TextInput
            style={[
              styles.modalInput,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={item}
            onChangeText={setItem}
            placeholder="What was wasted?"
            placeholderTextColor={colors.mutedForeground}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TextInput
              style={[
                styles.modalInput,
                {
                  flex: 2,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={qty}
              onChangeText={setQty}
              placeholder="Quantity"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[
                styles.modalInput,
                {
                  flex: 1,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={unit}
              onChangeText={setUnit}
              placeholder="kg"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function QuickTempModal({
  venueId,
  colors,
  insets,
  onClose,
}: {
  venueId: number;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onClose: () => void;
}) {
  const [location, setLocation] = useState("");
  const [temp, setTemp] = useState("");
  const { mutate, isPending } = useCreateServiceTemperatureLog();

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Temp Check
          </Text>
          <Pressable
            onPress={() => {
              if (!temp) return;
              mutate(
                {
                  venueId,
                  data: {
                    temp,
                    itemName: location || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    );
                    onClose();
                  },
                },
              );
            }}
            disabled={isPending}
            hitSlop={8}
          >
            <Text
              style={[
                styles.modalSave,
                {
                  color: isPending ? colors.mutedForeground : colors.primary,
                },
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>
        <View style={{ padding: 20, gap: 16 }}>
          <TextInput
            style={[
              styles.modalInput,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={location}
            onChangeText={setLocation}
            placeholder="Location (e.g. Walk-in fridge)"
            placeholderTextColor={colors.mutedForeground}
          />
          <TextInput
            style={[
              styles.modalInput,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={temp}
            onChangeText={setTemp}
            placeholder="Temperature (e.g. -2)"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  staffBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  staffInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  lowStockStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  lowStockText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  completedBy: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickBtnLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyCard: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    alignItems: "center",
  },
  emptyCardText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  modalSave: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
