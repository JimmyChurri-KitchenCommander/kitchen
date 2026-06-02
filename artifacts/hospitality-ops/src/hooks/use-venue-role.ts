import { useQuery } from "@tanstack/react-query";
import { useVenueStore } from "@/stores/venueStore";
import { getMyVenueRole, getGetMyVenueRoleQueryKey } from "@workspace/api-client-react";

export type VenueRole = "owner" | "admin" | "user" | "removed" | "none";

export type VenueRoleData = {
  role: VenueRole;
  isOwner: boolean;
  isAdmin: boolean;
  isUser: boolean;
  canManage: boolean;
};

export function useVenueRole() {
  const { activeVenueId } = useVenueStore();
  return useQuery<VenueRoleData>({
    queryKey: getGetMyVenueRoleQueryKey(activeVenueId!),
    queryFn: async () => {
      const data = await getMyVenueRole(activeVenueId!);
      const role = data.role as VenueRole;
      return {
        role,
        isOwner: role === "owner",
        isAdmin: role === "owner" || role === "admin",
        isUser: role === "user",
        canManage: role === "owner" || role === "admin",
      };
    },
    enabled: !!activeVenueId,
    staleTime: 60000,
  });
}
