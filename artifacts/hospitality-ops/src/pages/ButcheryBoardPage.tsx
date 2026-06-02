// ── Butchery Board (/kitchen-reference) ────────────────────────────────────────
//
// In-app module: terrestrial proteins only (Beef, Pork, Lamb, Poultry).
// Fish and seafood belong to Seafood Fabrication (/seafood-fabrication).
//
// Mounts inside AppLayout — no standalone chrome.
// Uses PrimalTile + PrimalDetailPanel intelligence stack via a sticky side panel.
// Engine boot is handled by the shared primal-engine-templates module.

import { useState, useCallback, Component, type ReactNode } from "react";
import { PrimalEngine, ZONE_COLORS, type AnimalId, type Zone } from "../engine/primal-engine";
import "../engine/primal-engine-templates"; // boot side-effect (idempotent)
import { PrimalTile } from "../components/primal-tiles/PrimalTile";
import { PrimalDetailPanel } from "../components/primal-tiles/PrimalDetailPanel";

// ── Terrestrial species only ───────────────────────────────────────────────────

const BUTCHERY_SPECIES: AnimalId[] = ["cow", "pig", "lamb", "chicken"];

// Override display labels — chicken engine ID shows as "Poultry" in the board
const SPECIES_LABEL: Partial<Record<AnimalId, string>> = {
  chicken: "Poultry",
};

function speciesLabel(id: AnimalId): string {
  return SPECIES_LABEL[id] ?? PrimalEngine.getTemplate(id).label;
}

// ── Engine Error Boundary ──────────────────────────────────────────────────────

class EngineErrorBoundary extends Component<
  { children: ReactNode; animal: AnimalId },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode; animal: AnimalId }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidUpdate(prevProps: { children: ReactNode; animal: AnimalId }): void {
    if (prevProps.animal !== this.props.animal && this.state.error !== null) {
      this.setState({ error: null });
    }
  }

  render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">
            Engine Constraint Violation
          </p>
          <pre className="text-[11px] font-mono text-red-300/60 whitespace-pre-wrap text-left max-w-lg leading-relaxed mx-auto">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Species colour accent pills ────────────────────────────────────────────────

const SPECIES_ACCENT: Partial<Record<AnimalId, string>> = {
  cow:     "#e97c42",
  pig:     "#d4a435",
  lamb:    "#6366f1",
  chicken: "#22c55e",
};

// ── ButcheryBoardPage ──────────────────────────────────────────────────────────

export default function ButcheryBoardPage() {
  const [animalId, setAnimalId] = useState<AnimalId>("cow");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const template = PrimalEngine.getTemplate(animalId);
  const selectedZone: Zone | null = selectedZoneId
    ? (template.zones.find(z => z.id === selectedZoneId) ?? null)
    : null;

  const handleAnimalSelect = useCallback((id: AnimalId) => {
    setAnimalId(id);
    setSelectedZoneId(null);
  }, []);

  const handleTileSelect = useCallback((id: string) => {
    setSelectedZoneId(prev => (prev === id ? null : id));
  }, []);

  const handlePanelClose = useCallback(() => setSelectedZoneId(null), []);

  const accent = SPECIES_ACCENT[animalId] ?? "#60a5fa";

  return (
    <div style={{ color: "#ffffff" }}>

      {/* Page header */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#60a5fa" }}>
          Kitchen Intelligence
        </p>
        <h1 className="text-[22px] font-bold tracking-tight leading-tight">Butchery Board</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>
          Primal cut intelligence for terrestrial proteins — fabrication pathways, yields, and chef decisions.
        </p>
      </div>

      {/* Species tab bar */}
      <div
        className="flex items-center gap-1 pb-3 mb-6 border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        {BUTCHERY_SPECIES.map(id => {
          const active = id === animalId;
          const label  = speciesLabel(id);
          return (
            <button
              key={id}
              onClick={() => handleAnimalSelect(id)}
              className="px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all"
              style={{
                background: active ? `${SPECIES_ACCENT[id] ?? "#60a5fa"}22` : "transparent",
                color:      active ? (SPECIES_ACCENT[id] ?? "#93c5fd")       : "rgba(255,255,255,0.35)",
                outline:    active ? `1px solid ${SPECIES_ACCENT[id] ?? "#60a5fa"}40` : "none",
              }}
            >
              {label}
            </button>
          );
        })}
        <span
          className="ml-auto text-[10px] font-mono"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          {template.zones.length} primals
        </span>
      </div>

      {/* Tile grid + sticky detail panel */}
      <EngineErrorBoundary animal={animalId}>
        <div className="flex items-start gap-6">

          {/* Tile grid — scrolls with the page */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {template.zones.map(zone => (
                <PrimalTile
                  key={zone.id}
                  zone={zone}
                  animalId={animalId}
                  isSelected={zone.id === selectedZoneId}
                  onSelect={() => handleTileSelect(zone.id)}
                />
              ))}
            </div>

            {/* Seafood nudge — shown when a user might expect fish here */}
            <div
              className="mt-8 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background:  "rgba(6,182,212,0.06)",
                border:      "1px solid rgba(6,182,212,0.15)",
              }}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold"
                style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}
              >
                S
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold" style={{ color: "#06b6d4" }}>
                  Looking for fish?
                </p>
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Seafood Fabrication covers round fish, flat fish, shellfish, and crustaceans.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky detail panel — stays in view while grid scrolls */}
          {selectedZone && (
            <div
              className="shrink-0 sticky top-0 rounded-xl overflow-hidden"
              style={{
                width:     "320px",
                maxHeight: "calc(100vh - 3rem)",
              }}
            >
              <div
                className="h-full overflow-y-auto rounded-xl"
                style={{
                  background:  "#0a1020",
                  border:      `1px solid ${ZONE_COLORS[selectedZone.colorToken]}30`,
                  maxHeight:   "calc(100vh - 3rem)",
                }}
              >
                <PrimalDetailPanel
                  animalId={animalId}
                  zone={selectedZone}
                  onClose={handlePanelClose}
                />
              </div>
            </div>
          )}
        </div>
      </EngineErrorBoundary>
    </div>
  );
}
