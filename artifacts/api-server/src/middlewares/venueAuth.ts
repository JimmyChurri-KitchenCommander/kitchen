import { db } from "@workspace/db";
import { venuesTable, venueMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export type VenueRole = "owner" | "admin" | "user" | "removed" | "none";

export async function getVenueRole(venueId: number, userId: string): Promise<VenueRole> {
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  if (!venue) return "none";
  if (venue.userId === userId) return "owner";
  const [member] = await db
    .select()
    .from(venueMembersTable)
    .where(and(eq(venueMembersTable.venueId, venueId), eq(venueMembersTable.clerkUserId, userId)));
  if (!member || member.status === "invited") return "none";
  if (member.status === "removed") return "removed";
  if (member.role === "admin") return "admin";
  return "user";
}

export async function assertVenueAccess(venueId: number, userId: string): Promise<boolean> {
  const role = await getVenueRole(venueId, userId);
  return role === "owner" || role === "admin" || role === "user";
}

export async function assertVenueAdmin(venueId: number, userId: string): Promise<boolean> {
  const role = await getVenueRole(venueId, userId);
  return role === "owner" || role === "admin";
}

export async function assertVenueOwner(venueId: number, userId: string): Promise<boolean> {
  const role = await getVenueRole(venueId, userId);
  return role === "owner";
}

export async function assertVenueAnyRelation(venueId: number, userId: string): Promise<boolean> {
  const role = await getVenueRole(venueId, userId);
  return role !== "none";
}

export async function getVenueIfAccess(venueId: number, userId: string) {
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  if (!venue) return null;
  const role = await getVenueRole(venueId, userId);
  if (role === "none" || role === "removed") return null;
  return venue;
}
