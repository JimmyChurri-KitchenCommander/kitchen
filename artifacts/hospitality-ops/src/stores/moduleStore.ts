import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ModuleId, DEFAULT_ENABLED_MODULES, CORE_MODULES } from "@/config/modules";

interface ModuleState {
  enabledByVenue: Record<number, ModuleId[]>;
  getEnabled: (venueId: number | null) => Set<ModuleId>;
  setVenueModules: (venueId: number, moduleIds: ModuleId[]) => void;
  toggleModule: (venueId: number, moduleId: ModuleId, enabled: boolean) => void;
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set, get) => ({
      enabledByVenue: {},

      getEnabled: (venueId) => {
        if (venueId == null) return new Set(DEFAULT_ENABLED_MODULES);
        const stored = get().enabledByVenue[venueId];
        if (!stored) return new Set(DEFAULT_ENABLED_MODULES);
        // Always include core modules regardless of stored state
        const merged = new Set([...CORE_MODULES, ...stored] as ModuleId[]);
        return merged;
      },

      setVenueModules: (venueId, moduleIds) => {
        const withCore = Array.from(new Set([...CORE_MODULES, ...moduleIds])) as ModuleId[];
        set(state => ({
          enabledByVenue: { ...state.enabledByVenue, [venueId]: withCore },
        }));
      },

      toggleModule: (venueId, moduleId, enabled) => {
        const current = get().getEnabled(venueId);
        if (enabled) {
          current.add(moduleId);
        } else {
          if (CORE_MODULES.includes(moduleId)) return; // cannot disable core
          current.delete(moduleId);
        }
        set(state => ({
          enabledByVenue: {
            ...state.enabledByVenue,
            [venueId]: Array.from(current),
          },
        }));
      },
    }),
    {
      name: "kc-modules",
      version: 1,
    }
  )
);
