import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VenueStore { 
  activeVenueId: number | null; 
  setActiveVenueId: (id: number) => void; 
}

export const useVenueStore = create<VenueStore>()(
  persist(
    (set) => ({ 
      activeVenueId: null, 
      setActiveVenueId: (id) => set({ activeVenueId: id }) 
    }), 
    { name: 'venue-store' }
  )
);
