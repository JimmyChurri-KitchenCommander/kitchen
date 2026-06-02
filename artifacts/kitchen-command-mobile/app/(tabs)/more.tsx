import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useListVenues } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
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

interface MenuRow {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  desc: string;
  route?: string;
  color?: string;
  onPress?: () => void;
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { venueId, setVenueId } = useVenue();
  const { data: venues } = useListVenues();

  const venue = venues?.find((v) => v.id === venueId);

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const handleSignOut = () => {
    Alert.alert("Sign out", "Sign out of Kitchen Command?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await setVenueId(null);
          await signOut();
        },
      },
    ]);
  };

  const sections: { title: string; items: MenuRow[] }[] = [
    {
      title: "KITCHEN TOOLS",
      items: [
        {
          icon: "clipboard",
          label: "Handover Notes",
          desc: "Leave notes for the next shift",
          route: "/handover",
          color: colors.primary,
        },
        {
          icon: "layers",
          label: "Cycle Count",
          desc: "Count stock by section",
          route: "/stocktake",
          color: colors.success,
        },
        {
          icon: "shopping-cart",
          label: "Order List",
          desc: "Items below par level",
          route: "/orders",
          color: colors.warning,
        },
      ],
    },
    {
      title: "VENUE",
      items: [
        {
          icon: "home",
          label: venue?.name ?? "Select Venue",
          desc: venue ? "Tap to switch venue" : "No venue selected",
          route: "/venue-select",
          color: colors.primary,
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          icon: "log-out",
          label: "Sign out",
          desc: "Sign out of Kitchen Command",
          color: colors.destructive,
          onPress: handleSignOut,
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad + 20,
        paddingBottom: bottomPad,
      }}
    >
      <Text
        style={[styles.heading, { color: colors.foreground, marginHorizontal: 20 }]}
      >
        More
      </Text>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            {section.title}
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {section.items.map((item, index) => (
              <React.Fragment key={item.label}>
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (item.onPress) {
                      item.onPress();
                    } else if (item.route) {
                      router.push(item.route as any);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor:
                          (item.color ?? colors.primary) + "20",
                      },
                    ]}
                  >
                    <Feather
                      name={item.icon}
                      size={18}
                      color={item.color ?? colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.rowDesc,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.desc}
                    </Text>
                  </View>
                  {item.route && (
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={colors.mutedForeground}
                    />
                  )}
                </Pressable>
                {index < section.items.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      <Text
        style={[styles.version, { color: colors.mutedForeground }]}
      >
        Kitchen Command v1.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
});
