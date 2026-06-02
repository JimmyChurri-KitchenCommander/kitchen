import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ApprenticeState {
  apprenticeMode: boolean;
  setApprenticeMode: (enabled: boolean) => void;
}

export const useApprenticeStore = create<ApprenticeState>()(
  persist(
    (set) => ({
      apprenticeMode: false,
      setApprenticeMode: (enabled) => set({ apprenticeMode: enabled }),
    }),
    { name: "kitchen-command-apprentice-mode" }
  )
);
