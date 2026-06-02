import { useState, useCallback } from "react";

type StageState = {
  v2OfferDismissed: boolean;
  v3OfferDismissed: boolean;
};

const DEFAULT_STATE: StageState = { v2OfferDismissed: false, v3OfferDismissed: false };

function readState(venueId: number): StageState {
  try {
    const raw = localStorage.getItem(`intel-stage-${venueId}`);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<StageState>) };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(venueId: number, patch: Partial<StageState>): void {
  const next = { ...readState(venueId), ...patch };
  localStorage.setItem(`intel-stage-${venueId}`, JSON.stringify(next));
}

export type IntelligenceStage = {
  showV2Offer: boolean;
  showV3Offer: boolean;
  dismissV2: () => void;
  dismissV3: () => void;
};

export function useIntelligenceStage(params: {
  venueId: number | null;
  taskCount: number;
  completedCount: number;
  v2Enabled: boolean;
  v3Enabled: boolean;
}): IntelligenceStage {
  const { venueId, taskCount, completedCount, v2Enabled, v3Enabled } = params;
  const [tick, setTick] = useState(0);
  void tick;

  const refresh = useCallback(() => setTick(n => n + 1), []);

  const state = venueId ? readState(venueId) : DEFAULT_STATE;

  const showV2Offer = !!venueId && taskCount >= 3 && !v2Enabled && !state.v2OfferDismissed;
  const showV3Offer = !!venueId && v2Enabled && completedCount >= 3 && !v3Enabled && !state.v3OfferDismissed;

  const dismissV2 = useCallback(() => {
    if (!venueId) return;
    writeState(venueId, { v2OfferDismissed: true });
    refresh();
  }, [venueId, refresh]);

  const dismissV3 = useCallback(() => {
    if (!venueId) return;
    writeState(venueId, { v3OfferDismissed: true });
    refresh();
  }, [venueId, refresh]);

  return { showV2Offer, showV3Offer, dismissV2, dismissV3 };
}
