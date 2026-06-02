// ─── Primal Ontology Map ───────────────────────────────────────────────────────
//
// Cross-species semantic normalisation layer.
// Assigns a canonical concept ID to functionally equivalent primal zones
// across different species.
//
// Rules:
//   - No imports from rendering or geometry layers
//   - Only AnimalId is imported (type-only) from the engine
//   - Zone IDs referenced here must exist in engine templates but are NOT
//     validated at import time — wrong IDs silently return null from lookups
//   - A zone maps to at most ONE canonical concept
//   - Not every zone needs a canonical entry (species-specific zones are fine)
//   - Not every canonical concept needs all 5 species (use Partial)
//
// Canonical concepts defined:
//   HEAD      — cranial region
//   SHOULDER  — anterior working muscle
//   RIB       — rib cage / rack
//   LOIN      — prime dorsal muscle
//   BELLY     — ventral fatty section
//   HAUNCH    — primary hindquarter muscle
//   SHANK     — lower extremity / hock

import type { AnimalId } from "./primal-engine";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SpeciesVariant {
  readonly zoneId: string;
  /** Clarifying note for non-obvious or conceptual mappings */
  readonly note?:  string;
}

export interface CanonicalCut {
  readonly id:              string;
  readonly label:           string;
  readonly description:     string;
  readonly speciesVariants: Partial<Record<AnimalId, SpeciesVariant>>;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CANONICAL_CUTS: readonly CanonicalCut[] = Object.freeze([

  {
    id:          "HEAD",
    label:       "Head",
    description: "Cranial region — cheeks, jaw, and skull. Gelatin-rich and highly flavoured.",
    speciesVariants: {
      cow:     { zoneId: "head" },
      pig:     { zoneId: "head" },
      lamb:    { zoneId: "head" },
      chicken: { zoneId: "crown",  note: "Crown and neck — the cranial equivalent on poultry" },
      fish:    { zoneId: "head" },
    },
  },

  {
    id:          "SHOULDER",
    label:       "Shoulder / Forequarter",
    description: "Anterior working muscle — heavily exercised, richly marbled, rewards slow cooking.",
    speciesVariants: {
      cow:  { zoneId: "chuck" },
      pig:  { zoneId: "shoulder" },
      lamb: { zoneId: "shoulder" },
      fish: { zoneId: "collar", note: "Collar is the richest, most-worked front section — shoulder equivalent on fish" },
      // chicken: no clean structural shoulder zone (wing is APPENDAGE layer, not equivalent)
    },
  },

  {
    id:          "RIB",
    label:       "Rib / Rack",
    description: "Rib cage primal — premium roasting joint, classically presented bone-in.",
    speciesVariants: {
      cow:     { zoneId: "rib" },
      pig:     { zoneId: "loin",   note: "Back ribs are part of the pork loin primal, not a separate zone" },
      lamb:    { zoneId: "rack" },
      chicken: { zoneId: "back",   note: "Rib structure runs through the back carcass section" },
      // fish: no distinct rib-cage zone; collar covers the pectoral region
    },
  },

  {
    id:          "LOIN",
    label:       "Loin",
    description: "Prime dorsal muscle — least exercised, most tender, commands a premium at market.",
    speciesVariants: {
      cow:     { zoneId: "short_loin" },
      pig:     { zoneId: "loin" },
      lamb:    { zoneId: "loin" },
      chicken: { zoneId: "breast",    note: "Breast is the premium lean equivalent — tender, low-fat, highest yield on poultry" },
      fish:    { zoneId: "loin" },
    },
  },

  {
    id:          "BELLY",
    label:       "Belly / Ventral",
    description: "Ventral fatty section — richest fat layering, rewards low-and-slow or curing.",
    speciesVariants: {
      cow:     { zoneId: "brisket", note: "Brisket is the primary ventral equivalent on beef" },
      pig:     { zoneId: "belly" },
      lamb:    { zoneId: "breast",  note: "Breast flap is the belly equivalent on lamb" },
      chicken: { zoneId: "back",    note: "Oyster and ventral back dark meat — conceptual belly equivalent" },
      fish:    { zoneId: "belly" },
    },
  },

  {
    id:          "HAUNCH",
    label:       "Haunch / Leg",
    description: "Primary hindquarter muscle — large, lean, versatile across roasting, curing, and braising.",
    speciesVariants: {
      cow:     { zoneId: "round" },
      pig:     { zoneId: "ham" },
      lamb:    { zoneId: "leg" },
      chicken: { zoneId: "thigh" },
      // fish: body loin is the primary muscle mass but already maps to LOIN;
      //       fish has no distinct hindquarter musculature
    },
  },

  {
    id:          "SHANK",
    label:       "Shank / Hock",
    description: "Lower extremity — collagen-dominant, transforms through long braising into silky, rich texture.",
    speciesVariants: {
      cow:     { zoneId: "hind_shank" },
      pig:     { zoneId: "hind_hock" },
      lamb:    { zoneId: "shank" },
      chicken: { zoneId: "drumstick" },
      fish:    { zoneId: "tail",      note: "Tail section is the narrowing extremity on fish — denser muscle, suits longer cook" },
    },
  },

]);

// ── Reverse lookup: "animalId:zoneId" → CanonicalCut ─────────────────────────
// Built once at module load. O(1) lookup thereafter.

const ZONE_TO_CANONICAL = new Map<string, CanonicalCut>();

for (const cut of CANONICAL_CUTS) {
  for (const [animalId, variant] of Object.entries(cut.speciesVariants) as [AnimalId, SpeciesVariant | undefined][]) {
    if (variant) {
      ZONE_TO_CANONICAL.set(`${animalId}:${variant.zoneId}`, cut);
    }
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

/** Return the canonical cut for a given (animalId, zoneId) pair, or null if unmapped. */
export function getCanonicalCut(animalId: AnimalId, zoneId: string): CanonicalCut | null {
  return ZONE_TO_CANONICAL.get(`${animalId}:${zoneId}`) ?? null;
}

/** Return a canonical cut by its ID (e.g. "LOIN"), or null if not found. */
export function getCanonicalById(id: string): CanonicalCut | null {
  return CANONICAL_CUTS.find(c => c.id === id) ?? null;
}

/** Return all canonical cuts — useful for building a full cross-species index. */
export function getAllCanonicalCuts(): readonly CanonicalCut[] {
  return CANONICAL_CUTS;
}
