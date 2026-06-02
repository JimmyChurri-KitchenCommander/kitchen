import { Feather } from "@expo/vector-icons";
import {
  useCreateServiceTemperatureLog,
  useCreateServiceWasteLog,
  getListInventoryQueryKey,
  useListInventory,
} from "@workspace/api-client-react";
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
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVenue } from "@/contexts/VenueContext";
import { useColors } from "@/hooks/useColors";

type SheetType = "waste" | "temp" | null;

const WASTE_REASONS = [
  "Spoilage",
  "Over-prep",
  "Dropped",
  "Expired",
  "Quality reject",
  "Other",
];

const TEMP_UNITS = ["°C", "°F"];

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { venueId } = useVenue();
  const [sheet, setSheet] = useState<SheetType>(null);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad + 20,
        paddingBottom: bottomPad,
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>
        Quick Log
      </Text>
      <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
        Log waste, temperatures, or stock updates on the go.
      </Text>

      <View style={styles.grid}>
        {[
          {
            type: "waste" as SheetType,
            icon: "trash-2" as const,
            label: "Log Waste",
            desc: "Spoilage, over-prep, drops",
            color: colors.destructive,
          },
          {
            type: "temp" as SheetType,
            icon: "thermometer" as const,
            label: "Temp Check",
            desc: "Fridge, freezer, probe readings",
            color: colors.warning,
          },
          {
            type: null,
            icon: "package" as const,
            label: "Cycle Count",
            desc: "Count stock by section",
            color: colors.primary,
          },
          {
            type: null,
            icon: "clipboard" as const,
            label: "Handover",
            desc: "Leave notes for the next shift",
            color: colors.success,
          },
        ].map((item) => (
          <Pressable
            key={item.label}
            style={[
              styles.tile,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (item.type) setSheet(item.type);
            }}
          >
            <View
              style={[
                styles.tileIcon,
                { backgroundColor: item.color + "20" },
              ]}
            >
              <Feather name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={[styles.tileLabel, { color: colors.foreground }]}>
              {item.label}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.mutedForeground }]}>
              {item.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      {sheet === "waste" && venueId && (
        <WasteSheet
          venueId={venueId}
          colors={colors}
          insets={insets}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "temp" && venueId && (
        <TempSheet
          venueId={venueId}
          colors={colors}
          insets={insets}
          onClose={() => setSheet(null)}
        />
      )}
    </ScrollView>
  );
}

function WasteSheet({
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
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [reason, setReason] = useState("Spoilage");
  const { mutate, isPending } = useCreateServiceWasteLog();

  const { data: inventory } = useListInventory(venueId, {
    query: {
      queryKey: getListInventoryQueryKey(venueId),
    },
  });

  const suggestions = inventory
    ?.filter((i) =>
      itemName.length > 1
        ? i.name.toLowerCase().includes(itemName.toLowerCase())
        : false,
    )
    .slice(0, 4);

  const submit = () => {
    if (!itemName.trim() || !qty) {
      Alert.alert("Fill in item and quantity");
      return;
    }
    mutate(
      {
        venueId,
        data: {
          itemName: itemName.trim(),
          quantity: qty,
          unit,
          reason,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onClose();
        },
        onError: () => Alert.alert("Failed to log waste. Try again."),
      },
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.sheetHeader, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
            Log Waste
          </Text>
          <Pressable onPress={submit} disabled={isPending} hitSlop={8}>
            <Text
              style={[
                styles.sheetSave,
                {
                  color: isPending ? colors.mutedForeground : colors.primary,
                },
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              ITEM
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g. Rocket, Salmon fillet"
              placeholderTextColor={colors.mutedForeground}
            />
            {suggestions && suggestions.length > 0 && (
              <View
                style={[
                  styles.suggestions,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.suggestionRow}
                    onPress={() => {
                      setItemName(s.name);
                      setUnit(s.unit ?? "kg");
                    }}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        { color: colors.foreground },
                      ]}
                    >
                      {s.name}
                    </Text>
                    <Text
                      style={[
                        styles.suggestionUnit,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {s.unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                QUANTITY
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                value={qty}
                onChangeText={setQty}
                placeholder="0.0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                UNIT
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
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

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              REASON
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {WASTE_REASONS.map((r) => (
                <Pressable
                  key={r}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        reason === r ? colors.primary : colors.card,
                      borderColor:
                        reason === r ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setReason(r)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          reason === r
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TempSheet({
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
  const [tempUnit, setTempUnit] = useState("°C");
  const { mutate, isPending } = useCreateServiceTemperatureLog();

  const submit = () => {
    if (!temp) {
      Alert.alert("Enter a temperature reading");
      return;
    }
    const reading = tempUnit === "°F"
      ? String(((parseFloat(temp) - 32) * 5) / 9)
      : temp;
    mutate(
      {
        venueId,
        data: {
          temp: reading,
          itemName: location || undefined,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onClose();
        },
        onError: () => Alert.alert("Failed to log temperature. Try again."),
      },
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.sheetHeader, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
            Temperature Log
          </Text>
          <Pressable onPress={submit} disabled={isPending} hitSlop={8}>
            <Text
              style={[
                styles.sheetSave,
                {
                  color: isPending ? colors.mutedForeground : colors.primary,
                },
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              LOCATION / ITEM
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Walk-in fridge, Freezer 1"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                TEMPERATURE
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                value={temp}
                onChangeText={setTemp}
                placeholder="-2"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                UNIT
              </Text>
              <View style={styles.unitToggle}>
                {TEMP_UNITS.map((u) => (
                  <Pressable
                    key={u}
                    style={[
                      styles.unitBtn,
                      {
                        backgroundColor:
                          tempUnit === u ? colors.primary : colors.card,
                        borderColor:
                          tempUnit === u ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setTempUnit(u)}
                  >
                    <Text
                      style={{
                        color:
                          tempUnit === u
                            ? colors.primaryForeground
                            : colors.foreground,
                        fontFamily: "Inter_500Medium",
                        fontSize: 13,
                      }}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  tile: {
    width: "47%",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  tileDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  sheetSave: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 2,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  suggestionUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  unitToggle: {
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  unitBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
