import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface DemoStore {
  isDemoMode: boolean;
  demoToken: string | null;
  demoVenueId: number | null;
  activate: (token: string, venueId: number) => void;
  deactivate: () => void;
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set) => ({
      isDemoMode: false,
      demoToken: null,
      demoVenueId: null,

      activate: (token, venueId) => {
        setAuthTokenGetter(() => `demo-${token}`);
        set({ isDemoMode: true, demoToken: token, demoVenueId: venueId });
      },

      deactivate: () => {
        setAuthTokenGetter(null);
        set({ isDemoMode: false, demoToken: null, demoVenueId: null });
      },
    }),
    {
      name: "demo-store",
      onRehydrateStorage: () => (state) => {
        // Restore the auth token getter synchronously as soon as localStorage
        // is read — before React renders or fires any API requests.
        if (state?.isDemoMode && state?.demoToken) {
          setAuthTokenGetter(() => `demo-${state.demoToken!}`);
        }
      },
    },
  ),
);
