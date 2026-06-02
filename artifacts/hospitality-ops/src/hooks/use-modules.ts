import { useModuleStore } from "@/stores/moduleStore";
import { useVenueStore } from "@/stores/venueStore";
import { type ModuleId } from "@/config/modules";

export function useModules() {
  const { activeVenueId } = useVenueStore();
  const { getEnabled, toggleModule, setVenueModules } = useModuleStore();

  const enabled = getEnabled(activeVenueId);

  return {
    isEnabled: (moduleId: ModuleId) => enabled.has(moduleId),
    enabledModules: enabled,
    toggle: (moduleId: ModuleId, on: boolean) => {
      if (activeVenueId == null) return;
      toggleModule(activeVenueId, moduleId, on);
    },
    setAll: (moduleIds: ModuleId[]) => {
      if (activeVenueId == null) return;
      setVenueModules(activeVenueId, moduleIds);
    },
  };
}
