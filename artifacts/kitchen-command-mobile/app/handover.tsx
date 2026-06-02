import { Feather } from "@expo/vector-icons";
import {
  getListHandoverNotesQueryKey,
  useCreateHandoverNote,
  useListHandoverNotes,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVenue } from "@/contexts/VenueContext";
import { useColors } from "@/hooks/useColors";

const SHIFT_TYPES = ["morning", "afternoon", "evening"] as const;
type ShiftType = (typeof SHIFT_TYPES)[number];

const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: "AM",
  afternoon: "PM",
  evening: "Night",
};

function formatRelative(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export default function HandoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { venueId } = useVenue();
  const [content, setContent] = useState("");
  const [shift, setShift] = useState<ShiftType>("morning");

  const { data, isLoading, refetch } = useListHandoverNotes(
    venueId ?? 0,
    undefined,
    {
      query: {
        enabled: !!venueId,
        queryKey: getListHandoverNotesQueryKey(venueId ?? 0),
      },
    },
  );
  const { mutate, isPending } = useCreateHandoverNote();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const submit = () => {
    if (!content.trim()) {
      Alert.alert("Write a note before saving.");
      return;
    }
    if (!venueId) return;
    mutate(
      {
        venueId,
        data: {
          content: content.trim(),
          shift,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setContent("");
          refetch();
        },
        onError: () => Alert.alert("Could not save note. Try again."),
      },
    );
  };

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        gap: 20,
        paddingBottom: bottomPad + 20,
      }}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      {/* Compose new note */}
      <View
        style={[
          styles.composeCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          New Handover Note
        </Text>

        <View style={styles.shiftRow}>
          {SHIFT_TYPES.map((s) => (
            <Pressable
              key={s}
              style={[
                styles.shiftChip,
                {
                  backgroundColor:
                    shift === s ? colors.primary : colors.muted,
                  borderColor: shift === s ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setShift(s)}
            >
              <Text
                style={[
                  styles.shiftChipText,
                  {
                    color:
                      shift === s
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {SHIFT_LABELS[s]}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={[
            styles.noteInput,
            {
              color: colors.foreground,
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
          value={content}
          onChangeText={setContent}
          placeholder="What does the next shift need to know? Covers, specials, issues, 86'd items..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Pressable
          style={[
            styles.submitBtn,
            {
              backgroundColor: isPending
                ? colors.primary + "80"
                : colors.primary,
            },
          ]}
          onPress={submit}
          disabled={isPending}
        >
          <Feather name="send" size={16} color="#fff" />
          <Text
            style={[
              styles.submitBtnText,
              { color: colors.primaryForeground },
            ]}
          >
            {isPending ? "Saving..." : "Hand over"}
          </Text>
        </Pressable>
      </View>

      {/* Previous notes */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        RECENT NOTES
      </Text>

      {isLoading && <ActivityIndicator color={colors.primary} />}

      {!isLoading && (data ?? []).length === 0 && (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No handover notes yet
          </Text>
        </View>
      )}

      {(data ?? []).map((n) => (
        <View
          key={n.id}
          style={[
            styles.noteCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.noteCardHeader}>
            <View
              style={[
                styles.shiftBadge,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Text
                style={[styles.shiftBadgeText, { color: colors.primary }]}
              >
                {n.shift
                  ? SHIFT_LABELS[n.shift as ShiftType] ?? n.shift
                  : "Shift"}
              </Text>
            </View>
            <Text
              style={[styles.noteDate, { color: colors.mutedForeground }]}
            >
              {formatRelative(n.createdAt ?? "")}
            </Text>
          </View>
          <Text style={[styles.noteText, { color: colors.foreground }]}>
            {n.content}
          </Text>
          {n.createdBy && (
            <Text
              style={[styles.noteAuthor, { color: colors.mutedForeground }]}
            >
              — {n.createdBy}
            </Text>
          )}
        </View>
      ))}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  composeCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  shiftRow: {
    flexDirection: "row",
    gap: 8,
  },
  shiftChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  shiftChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 110,
    lineHeight: 22,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    paddingVertical: 13,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  emptyCard: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  noteCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  noteCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shiftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shiftBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  noteDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  noteText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  noteAuthor: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
});
