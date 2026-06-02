import { Feather } from "@expo/vector-icons";
import {
  getGetInventoryAlertsQueryKey,
  getGetSupplierCutoffsQueryKey,
  getListPrepTasksQueryKey,
  getListVenuesQueryKey,
  useGetInventoryAlerts,
  useGetSupplierCutoffs,
  useListPrepTasks,
  useListVenues,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVenue } from "@/contexts/VenueContext";
import { useColors } from "@/hooks/useColors";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function minutesToCutoff(cutoffTime: string): number {
  const [h, m] = cutoffTime.split(":").map(Number);
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(h ?? 0, m ?? 0, 0, 0);
  return Math.round((cutoff.getTime() - now.getTime()) / 60000);
}

const TODAY = new Date().toISOString().split("T")[0]!;

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { venueId } = useVenue();
  const [refreshing, setRefreshing] = useState(false);

  const { data: venues } = useListVenues({
    query: { queryKey: getListVenuesQueryKey() },
  });
  const venue = venues?.find((v) => v.id === venueId);

  const alertsQuery = useGetInventoryAlerts(venueId ?? 0, {
    query: {
      enabled: !!venueId,
      queryKey: getGetInventoryAlertsQueryKey(venueId ?? 0),
    },
  });
  const cutoffsQuery = useGetSupplierCutoffs(venueId ?? 0, {
    query: {
      enabled: !!venueId,
      queryKey: getGetSupplierCutoffsQueryKey(venueId ?? 0),
    },
  });
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

  const alerts = alertsQuery.data;
  const criticalCount =
    (alerts?.critical?.length ?? 0) + (alerts?.lowStock?.length ?? 0);
  const stagnantCount = alerts?.stagnant?.length ?? 0;

  const cutoffs = (cutoffsQuery.data ?? []).filter((c) => {
    const mins = minutesToCutoff(c.cutoffTime ?? "");
    return mins > 0 && mins < 480;
  });

  const prepTasks = (prepQuery.data ?? []).slice(0, 8);
  const isLoading =
    alertsQuery.isLoading || cutoffsQuery.isLoading || prepQuery.isLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      alertsQuery.refetch(),
      cutoffsQuery.refetch(),
      prepQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top > 0 ? 0 : 16;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  if (!venueId) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: topPad },
        ]}
      >
        <Feather name="home" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No venue selected
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Go to More to select your kitchen
        </Text>
        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/more")}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
            Select Venue
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, paddingTop: topPad + 16 },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {greeting()},{" "}
            <Text style={{ color: colors.foreground }}>
              {venue?.name ?? "Chef"}
            </Text>
          </Text>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            {formatDate()}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/venue-select")}
          hitSlop={8}
        >
          <Feather
            name="chevron-down"
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>

      {/* Alert strip */}
      {(criticalCount > 0 || stagnantCount > 0) && (
        <View style={[styles.alertStrip, { backgroundColor: colors.card }]}>
          {criticalCount > 0 && (
            <View
              style={[
                styles.alertPill,
                { backgroundColor: colors.destructive + "22" },
              ]}
            >
              <Feather
                name="alert-triangle"
                size={13}
                color={colors.destructive}
              />
              <Text
                style={[styles.alertPillText, { color: colors.destructive }]}
              >
                {criticalCount} low stock
              </Text>
            </View>
          )}
          {stagnantCount > 0 && (
            <View
              style={[
                styles.alertPill,
                { backgroundColor: colors.warning + "22" },
              ]}
            >
              <Feather name="clock" size={13} color={colors.warning} />
              <Text style={[styles.alertPillText, { color: colors.warning }]}>
                {stagnantCount} stagnant
              </Text>
            </View>
          )}
        </View>
      )}

      {isLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      )}

      {/* Supplier cutoffs */}
      {cutoffs.length > 0 && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            SUPPLIER CUTOFFS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cutoffs.map((c) => {
              const mins = minutesToCutoff(c.cutoffTime ?? "");
              const urgent = mins < 60;
              return (
                <View
                  key={c.supplierId}
                  style={[
                    styles.cutoffCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: urgent ? colors.destructive : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.cutoffName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {c.supplierName}
                  </Text>
                  <Text
                    style={[
                      styles.cutoffTime,
                      {
                        color: urgent ? colors.destructive : colors.warning,
                      },
                    ]}
                  >
                    {mins < 60
                      ? `${mins}m left`
                      : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                  </Text>
                  <Text
                    style={[
                      styles.cutoffClock,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Cutoff {c.cutoffTime}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Today's prep tasks */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          TODAY'S PREP
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
              No prep tasks scheduled for today
            </Text>
          </View>
        ) : (
          prepTasks.map((task) => {
            const done = task.status === "done";
            return (
              <View
                key={task.id}
                style={[
                  styles.taskRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: done ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.taskCheck,
                    {
                      borderColor: done ? colors.success : colors.border,
                      backgroundColor: done ? colors.success : "transparent",
                    },
                  ]}
                >
                  {done && <Feather name="check" size={12} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.taskName,
                      {
                        color: colors.foreground,
                        textDecorationLine: done ? "line-through" : "none",
                      },
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.assignedTo && (
                    <Text
                      style={[
                        styles.taskAssigned,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {task.assignedTo}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          QUICK ACTIONS
        </Text>
        <View style={styles.quickGrid}>
          {[
            {
              icon: "zap" as const,
              label: "Log Waste",
              color: colors.destructive,
              route: "/(tabs)/log",
            },
            {
              icon: "thermometer" as const,
              label: "Temp Check",
              color: colors.warning,
              route: "/(tabs)/log",
            },
            {
              icon: "book-open" as const,
              label: "Recipes",
              color: colors.primary,
              route: "/(tabs)/recipes",
            },
            {
              icon: "radio" as const,
              label: "Service",
              color: colors.success,
              route: "/(tabs)/service",
            },
          ].map((item) => (
            <Pressable
              key={item.label}
              style={[
                styles.quickTile,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Feather name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  alertStrip: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  alertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  alertPillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
    marginBottom: 2,
  },
  cutoffCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginRight: 10,
    minWidth: 130,
  },
  cutoffName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  cutoffTime: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  cutoffClock: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  taskAssigned: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickTile: {
    width: "47%",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13,
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
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  btn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
