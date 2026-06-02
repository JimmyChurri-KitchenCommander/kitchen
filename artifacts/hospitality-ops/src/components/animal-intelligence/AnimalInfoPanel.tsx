import type { PrimalRegion } from "@/data/animal-diagrams";

const METHOD_LABELS: Record<string, string> = {
  braise: "Braise",
  slow_roast: "Slow Roast",
  grill: "Grill",
  roast: "Roast",
  pan_sear: "Pan Sear",
  reverse_sear: "Reverse Sear",
  sous_vide: "Sous Vide",
  mince: "Mince",
  smoke: "Smoke",
  cure: "Cure",
  confit: "Confit",
  pull: "Low & Slow",
  stock: "Stock",
  fry: "Fry",
  wok: "Wok / High Heat",
  sashimi: "Sashimi",
  ceviche: "Ceviche",
  stuff_roll: "Stuff & Roll",
  seam_butchery: "Seam Butchery",
  marinate: "Marinate & Grill",
};

const COLLAGEN_COLOR: Record<string, string> = {
  none: "rgba(255,255,255,0.25)",
  low: "#3ab4d4",
  medium: "#e8c03a",
  high: "#e8763a",
};

const MARBLING_COLOR: Record<string, string> = {
  none: "rgba(255,255,255,0.25)",
  low: "#3ab4d4",
  medium: "#e8c03a",
  high: "#e8763a",
  exceptional: "#d44a6e",
};

function TendernessBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex gap-[2px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="w-[7px] h-[7px] rounded-[1px]"
            style={{
              backgroundColor: i < value ? color : "rgba(255,255,255,0.07)",
              transition: "background-color 200ms",
            }}
          />
        ))}
      </div>
      <span className="text-[10px] text-white/35 tabular-nums">{value}/10</span>
    </div>
  );
}

function Pill({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg?: string;
}) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border leading-none"
      style={{
        color,
        borderColor: `${color}35`,
        backgroundColor: bg ?? `${color}12`,
      }}
    >
      {label}
    </span>
  );
}

export function AnimalInfoPanel({ primal }: { primal: PrimalRegion }) {
  const { anatomy, cooking, subprimals, description, color } = primal;

  return (
    <div className="space-y-3">
      {/* Description */}
      {description && (
        <p className="text-[11px] text-white/55 leading-relaxed">{description}</p>
      )}

      {/* Subprimals */}
      {subprimals && subprimals.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/28 mb-1.5">
            Subprimals
          </div>
          <div className="flex flex-wrap gap-1">
            {subprimals.map(s => (
              <Pill key={s} label={s} color={color} />
            ))}
          </div>
        </div>
      )}

      {/* Anatomy metrics */}
      {anatomy && (
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/28 mb-2">
            Anatomy
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-[72px] shrink-0">Tenderness</span>
              <TendernessBar value={anatomy.tenderness} color={color} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-[72px] shrink-0">Marbling</span>
              <Pill
                label={anatomy.marbling.charAt(0).toUpperCase() + anatomy.marbling.slice(1)}
                color={MARBLING_COLOR[anatomy.marbling] ?? color}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-[72px] shrink-0">Collagen</span>
              <Pill
                label={anatomy.collagen.charAt(0).toUpperCase() + anatomy.collagen.slice(1)}
                color={COLLAGEN_COLOR[anatomy.collagen] ?? color}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cooking methods */}
      {cooking && cooking.methods.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/28 mb-1.5">
            Techniques
          </div>
          <div className="flex flex-wrap gap-1">
            {cooking.methods.map(m => (
              <span
                key={m}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.05] border border-white/[0.09] text-white/60 leading-none"
              >
                {METHOD_LABELS[m] ?? m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
