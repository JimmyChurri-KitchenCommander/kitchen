import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import type { useColors } from "@/hooks/useColors";

interface Props {
  taskId: number;
  taskStatus: string;
  colors: ReturnType<typeof useColors>;
  onComplete: () => void;
  onClaim: () => void;
  children: React.ReactNode;
}

/**
 * Wraps a task row with horizontal swipe gestures:
 *   Swipe LEFT  → Done   (green — right action panel)
 *   Swipe RIGHT → Claim  (blue  — left action panel)
 *
 * Completed tasks are rendered without swipe to avoid accidental undo.
 */
export function SwipeableTaskRow({ taskId, taskStatus, colors, onComplete, onClaim, children }: Props) {
  const ref = useRef<Swipeable>(null);
  const isDone = taskStatus === "done";

  function handleOpen(direction: "left" | "right") {
    if (direction === "left") {
      // Swiped left → right panel (Done)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => ref.current?.close(), 250);
      onComplete();
    } else {
      // Swiped right → left panel (Claim)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => ref.current?.close(), 250);
      onClaim();
    }
  }

  if (isDone) return <>{children}</>;

  const renderLeft = () => (
    <View style={[styles.actionPanel, { backgroundColor: colors.primary, marginRight: 6 }]}>
      <Feather name="user-check" size={20} color="#fff" />
      <Text style={styles.actionLabel}>Claim</Text>
    </View>
  );

  const renderRight = () => (
    <View style={[styles.actionPanel, { backgroundColor: colors.success, marginLeft: 6 }]}>
      <Feather name="check" size={20} color="#fff" />
      <Text style={styles.actionLabel}>Done</Text>
    </View>
  );

  return (
    <Swipeable
      key={taskId}
      ref={ref}
      renderLeftActions={renderLeft}
      renderRightActions={renderRight}
      friction={2}
      leftThreshold={60}
      rightThreshold={60}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableOpen={handleOpen}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionPanel: {
    width: 80,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
