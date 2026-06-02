// ── Primal Butcher — standalone debug route (/primal-butcher) ──────────────────
//
// Full five-species tile board: Beef, Pork, Poultry, Lamb, Fish.
// Fish is included here for completeness; the in-app Butchery Board
// (/kitchen-reference) is terrestrial only — Fish belongs to Seafood Fabrication.
//
// Engine templates and boot are in primal-engine-templates.ts (shared).
// DO NOT modify PrimalEngine, ZoneIntelligence, Ontology, or ChefDecisionEngine.

import { useState, useCallback, Component, type ReactNode } from "react";
import { PrimalEngine, type AnimalId } from "../engine/primal-engine";
import "../engine/primal-engine-templates"; // boot side-effect (idempotent)
import { PrimalTileBoard } from "../components/primal-tiles/PrimalTileBoard";

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
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3">
            Engine Constraint Violation
          </p>
          <pre className="text-[11px] font-mono text-red-300/70 whitespace-pre-wrap text-left max-w-lg leading-relaxed">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Species tab order — all five including fish ────────────────────────────────

const ANIMAL_ORDER = ["cow", "pig", "chicken", "lamb", "fish"] as const;

function AnimalSelector({
  activeId,
  onSelect,
}: {
  activeId: AnimalId;
  onSelect: (id: AnimalId) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 px-5 py-2 border-b shrink-0"
      style={{ borderColor: "rgba(255,255,255,0.08)", background: "#070b14" }}
    >
      {ANIMAL_ORDER.map(id => {
        const active = id === activeId;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all"
            style={{
              background: active ? "rgba(96,165,250,0.18)" : "transparent",
              color:      active ? "#93c5fd"               : "rgba(255,255,255,0.35)",
              outline:    active ? "1px solid rgba(96,165,250,0.35)" : "none",
            }}
          >
            {PrimalEngine.getTemplate(id).label}
          </button>
        );
      })}
    </div>
  );
}

// ── PrimalButcherApp ───────────────────────────────────────────────────────────

export default function PrimalButcherApp() {
  const [animalId, setAnimalId] = useState<AnimalId>("cow");
  const template = PrimalEngine.getTemplate(animalId);

  const handleAnimalSelect = useCallback((id: AnimalId) => {
    setAnimalId(id);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#070b14", color: "#ffffff" }}
    >
      <header
        className="px-5 py-3.5 flex items-center gap-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#60a5fa]">
            Primal Butcher — Debug Route
          </p>
          <h1 className="text-[15px] font-bold tracking-tight leading-tight mt-0.5 uppercase">
            {template.label} Board
          </h1>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] uppercase tracking-widest text-white/25">Primals</p>
          <p className="text-base font-mono font-bold text-[#93c5fd] leading-tight">
            {template.zones.length}
          </p>
        </div>
      </header>

      <AnimalSelector activeId={animalId} onSelect={handleAnimalSelect} />

      <EngineErrorBoundary animal={animalId}>
        <PrimalTileBoard template={template} animalId={animalId} />
      </EngineErrorBoundary>
    </div>
  );
}
