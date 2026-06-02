import { Feather } from "@expo/vector-icons";
import { useListVenues } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVenue } from "@/contexts/VenueContext";
import { useColors } from "@/hooks/useColors";

export default function VenueSelectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { venueId, setVenueId } = useVenue();
  const { data: venues, isLoading } = useListVenues();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: topPad + 16,
        paddingBottom: bottomPad,
        gap: 12,
      }}
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>
        Your Venues
      </Text>
      <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
        Select the kitchen you're working in today.
      </Text>

      {isLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      )}

      {(venues ?? []).map((venue) => {
        const isActive = venue.id === venueId;
        return (
          <Pressable
            key={venue.id}
            style={[
              styles.venueCard,
              {
                backgroundColor: colors.card,
                borderColor: isActive ? colors.primary : colors.border,
                borderWidth: isActive ? 2 : StyleSheet.hairlineWidth,
              },
            ]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await setVenueId(venue.id);
              router.back();
            }}
          >
            <View style={styles.venueRow}>
              <View
                style={[
                  styles.venueIcon,
                  {
                    backgroundColor: isActive
                      ? colors.primary + "30"
                      : colors.muted,
                  },
                ]}
              >
                <Feather
                  name="home"
                  size={20}
                  color={isActive ? colors.primary : colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.venueName, { color: colors.foreground }]}
                >
                  {venue.name}
                </Text>
                {venue.address && (
                  <Text
                    style={[
                      styles.venueAddress,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {venue.address}
                  </Text>
                )}
              </View>
              {isActive && (
                <Feather name="check-circle" size={20} color={colors.primary} />
              )}
            </View>
          </Pressable>
        );
      })}

      {venues?.length === 0 && !isLoading && (
        <View style={styles.empty}>
          <Feather name="home" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No venues yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Set up your venue in the web app first
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  venueCard: {
    borderRadius: 12,
    padding: 14,
  },
  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  venueIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  venueName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  venueAddress: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingTop: 40,
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
});
