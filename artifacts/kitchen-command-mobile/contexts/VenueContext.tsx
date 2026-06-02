import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const VENUE_KEY = "kc_active_venue_id";

interface VenueContextValue {
  venueId: number | null;
  setVenueId: (id: number | null) => Promise<void>;
  isLoading: boolean;
}

const VenueContext = createContext<VenueContextValue>({
  venueId: null,
  setVenueId: async () => {},
  isLoading: true,
});

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const [venueId, setVenueIdState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(VENUE_KEY)
      .then((val) => {
        if (val) setVenueIdState(Number(val));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setVenueId = useCallback(async (id: number | null) => {
    setVenueIdState(id);
    if (id === null) {
      await AsyncStorage.removeItem(VENUE_KEY);
    } else {
      await AsyncStorage.setItem(VENUE_KEY, String(id));
    }
  }, []);

  return (
    <VenueContext.Provider value={{ venueId, setVenueId, isLoading }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  return useContext(VenueContext);
}
