import { Feather } from "@expo/vector-icons";
import {
  getGetSuggestedOrdersQueryKey,
  useGetSuggestedOrders,
} from "@workspace/api-client-react";
import type { SuggestedOrderItem } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVenue } from "@/contexts/VenueContext";
import { useColors } from "@/hooks/useColors";

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { venueId } = useVenue();
  const [qtyOverrides, setQtyOverrides] = useState<Record<number, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useGetSuggestedOrders(venueId ?? 0, {
    query: {
      enabled: !!venueId,
      queryKey: getGetSuggestedOrdersQueryKey(venueId ?? 0),
    },
  });

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const groups = data?.groups ?? [];
  const totalItems = data?.totalItems ?? 0;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Summary bar */}
      <View
        style={[
          styles.summaryBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {totalItems}
          </Text>
          <Text
            style={[styles.summaryLabel, { color: colors.mutedForeground }]}
          >
            items to order
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {groups.length}
          </Text>
          <Text
            style={[styles.summaryLabel, { color: colors.mutedForeground }]}
          >
            suppliers
          </Text>
        </View>
        <Pressable
          style={[
            styles.refreshBtn,
            { backgroundColor: colors.primary + "20" },
          ]}
          onPress={onRefresh}
        >
          <Feather name="refresh-cw" size={16} color={colors.primary} />
        </Pressable>
      </View>

      {totalItems === 0 ? (
        <View style={[styles.center, { padding: 32 }]}>
          <Feather name="check-circle" size={48} color={colors.success} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Stock levels look good
          </Text>
          <Text
            style={[styles.emptyText, { color: colors.mutedForeground }]}
          >
            Nothing is below par. Pull down to refresh.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => String(g.supplierId ?? g.supplierName)}
          scrollEnabled
          contentContainerStyle={{
            padding: 16,
            gap: 16,
            paddingBottom: bottomPad,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: group }) => (
            <View
              style={[
                styles.supplierCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.supplierHeader}>
                <View
                  style={[
                    styles.supplierIcon,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Feather name="truck" size={16} color={colors.primary} />
                </View>
                <Text
                  style={[
                    styles.supplierName,
                    { color: colors.foreground },
                  ]}
                >
                  {group.supplierName}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      { color: colors.primary },
                    ]}
                  >
                    {group.items.length}
                  </Text>
                </View>
              </View>

              {group.items.map((item: SuggestedOrderItem, idx: number) => (
                <View
                  key={item.itemId}
                  style={[
                    styles.itemRow,
                    {
                      borderTopColor: colors.border,
                      borderTopWidth: idx === 0 ? StyleSheet.hairlineWidth : 0,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.itemName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {item.itemName}
                    </Text>
                    <Text
                      style={[
                        styles.itemMeta,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.currentStock} / {item.parLevel} {item.unit} — need{" "}
                      {item.suggestedQty} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.qtyWrap}>
                    <TextInput
                      style={[
                        styles.qtyInput,
                        {
                          color: colors.foreground,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      value={
                        qtyOverrides[item.itemId] ??
                        String(item.suggestedQty ?? "")
                      }
                      onChangeText={(val) =>
                        setQtyOverrides((prev) => ({
                          ...prev,
                          [item.itemId]: val,
                        }))
                      }
                      keyboardType="decimal-pad"
                    />
                    <Text
                      style={[
                        styles.qtyUnit,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.unit}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 20,
  },
  summaryItem: {
    alignItems: "center",
    gap: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  refreshBtn: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  supplierCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  supplierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  supplierIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  supplierName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  countBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  itemMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  qtyInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 60,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  qtyUnit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    width: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
