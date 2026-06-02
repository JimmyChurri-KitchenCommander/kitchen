import { Feather } from "@expo/vector-icons";
import {
  getGetStocktakeQueryKey,
  getListInventoryQueryKey,
  getListStocktakesQueryKey,
  useCreateStocktake,
  useGetStocktake,
  useListInventory,
  useListStocktakes,
  useSaveStocktakeSection,
  useSubmitStocktake,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

const SECTIONS = [
  "Dry Store",
  "Fridge",
  "Freezer",
  "Bar",
  "Prep Kitchen",
  "General",
];

export default function StocktakeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { venueId } = useVenue();
  const [activeSection, setActiveSection] = useState(SECTIONS[0]!);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [activeTakeId, setActiveTakeId] = useState<number | null>(null);

  const stocktakesQuery = useListStocktakes(venueId ?? 0, {
    query: {
      enabled: !!venueId,
      queryKey: getListStocktakesQueryKey(venueId ?? 0),
    },
  });
  const inventoryQuery = useListInventory(venueId ?? 0, {
    query: {
      enabled: !!venueId,
      queryKey: getListInventoryQueryKey(venueId ?? 0),
    },
  });
  const activeTakeQuery = useGetStocktake(venueId ?? 0, activeTakeId ?? 0, {
    query: {
      enabled: !!venueId && !!activeTakeId,
      queryKey: getGetStocktakeQueryKey(venueId ?? 0, activeTakeId ?? 0),
    },
  });

  const createStocktake = useCreateStocktake();
  const saveSection = useSaveStocktakeSection();
  const submitTake = useSubmitStocktake();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const draftTake = (stocktakesQuery.data ?? []).find(
    (t) => t.status === "draft",
  );

  const handleStartOrResume = async () => {
    if (!venueId) return;
    if (draftTake) {
      setActiveTakeId(draftTake.id);
      return;
    }
    try {
      const result = await createStocktake.mutateAsync({
        venueId,
        data: {},
      });
      setActiveTakeId(result.id);
      stocktakesQuery.refetch();
    } catch {
      Alert.alert("Could not start cycle count. Try again.");
    }
  };

  const handleSaveSection = async () => {
    if (!venueId || !activeTakeId) return;

    const inventoryItems = inventoryQuery.data ?? [];
    const sectionInventory = inventoryItems.filter(
      (i) => (i.storageLocation ?? "General") === activeSection,
    );

    const updates = sectionInventory
      .filter((inv) => counts[inv.id] !== undefined)
      .map((inv) => ({
        id: inv.id,
        actualStock: parseFloat(counts[inv.id] ?? "0"),
      }));

    if (updates.length === 0) {
      Alert.alert("No counts to save for this section.");
      return;
    }

    try {
      await saveSection.mutateAsync({
        venueId,
        stocktakeId: activeTakeId,
        data: { section: activeSection, items: updates },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(`${activeSection} saved`);
    } catch {
      Alert.alert("Could not save section. Try again.");
    }
  };

  const handleSubmit = () => {
    if (!venueId || !activeTakeId) return;
    Alert.alert(
      "Submit cycle count?",
      "This will update all stock levels to the counts you entered. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "destructive",
          onPress: async () => {
            try {
              const inventoryItems = inventoryQuery.data ?? [];
              const allUpdates = inventoryItems
                .filter((inv) => counts[inv.id] !== undefined)
                .map((inv) => ({
                  id: inv.id,
                  actualStock: parseFloat(counts[inv.id] ?? "0"),
                }));

              await submitTake.mutateAsync({
                venueId,
                stocktakeId: activeTakeId,
                data: { items: allUpdates },
              });
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setActiveTakeId(null);
              setCounts({});
              stocktakesQuery.refetch();
            } catch {
              Alert.alert("Could not submit. Try again.");
            }
          },
        },
      ],
    );
  };

  if (stocktakesQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const inventoryItems = inventoryQuery.data ?? [];
  const sectionItems = inventoryItems.filter(
    (inv) => (inv.storageLocation ?? "General") === activeSection,
  );

  if (!activeTakeId) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, padding: 24 },
        ]}
      >
        <Feather name="layers" size={48} color={colors.mutedForeground} />
        <Text style={[styles.heading, { color: colors.foreground }]}>
          Cycle Count
        </Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Count stock section by section. Each section can be saved
          independently.
        </Text>
        {draftTake && (
          <View
            style={[
              styles.draftBanner,
              {
                backgroundColor: colors.warning + "22",
                borderColor: colors.warning,
              },
            ]}
          >
            <Feather name="clock" size={14} color={colors.warning} />
            <Text style={[styles.draftText, { color: colors.warning }]}>
              Draft in progress — started{" "}
              {new Date(draftTake.conductedAt).toLocaleDateString("en-GB")}
            </Text>
          </View>
        )}
        <Pressable
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={handleStartOrResume}
          disabled={createStocktake.isPending}
        >
          <Text
            style={[
              styles.startBtnText,
              { color: colors.primaryForeground },
            ]}
          >
            {draftTake ? "Resume count" : "Start new count"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Section tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.sectionsBar, { borderBottomColor: colors.border }]}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 6,
          paddingVertical: 8,
        }}
      >
        {SECTIONS.map((s) => (
          <Pressable
            key={s}
            style={[
              styles.sectionTab,
              {
                backgroundColor:
                  activeSection === s ? colors.primary : colors.card,
                borderColor:
                  activeSection === s ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveSection(s)}
          >
            <Text
              style={[
                styles.sectionTabText,
                {
                  color:
                    activeSection === s
                      ? colors.primaryForeground
                      : colors.foreground,
                },
              ]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={sectionItems}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={!!sectionItems.length}
        contentContainerStyle={{
          padding: 16,
          gap: 8,
          paddingBottom: bottomPad + 80,
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No items in {activeSection}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.itemRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.foreground }]}>
                {item.name}
              </Text>
              <Text
                style={[styles.itemSystem, { color: colors.mutedForeground }]}
              >
                System: {item.currentStock} {item.unit}
              </Text>
            </View>
            <TextInput
              style={[
                styles.countInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={counts[item.id] ?? ""}
              onChangeText={(val) =>
                setCounts((prev) => ({ ...prev, [item.id]: val }))
              }
              placeholder={String(item.currentStock ?? 0)}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
            <Text
              style={[styles.unitLabel, { color: colors.mutedForeground }]}
            >
              {item.unit}
            </Text>
          </View>
        )}
      />

      {/* Action bar */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSaveSection}
          disabled={saveSection.isPending}
        >
          <Feather name="save" size={16} color="#fff" />
          <Text style={[styles.saveBtnText, { color: "#fff" }]}>
            Save {activeSection}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.submitBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
          onPress={handleSubmit}
          disabled={submitTake.isPending}
        >
          <Text
            style={[styles.submitBtnText, { color: colors.foreground }]}
          >
            Submit all
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: "100%",
  },
  draftText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  startBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  startBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  sectionsBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
  },
  sectionTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionTabText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  itemSystem: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  countInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 70,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  unitLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    width: 28,
  },
  empty: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 13,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  submitBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
