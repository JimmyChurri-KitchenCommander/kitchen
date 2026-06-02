import cowSrc from "@assets/animal-silhouettes/cow.png";
import pigSrc from "@assets/animal-silhouettes/pig.png";
import sheepSrc from "@assets/animal-silhouettes/sheep.png";
import chickenSrc from "@assets/animal-silhouettes/chicken.png";
import fishSrc from "@assets/animal-silhouettes/fish.png";
import { PRIMAL_POLYGONS, PRIMAL_LABEL_ANCHORS } from "@/data/animal-silhouette-polygons";
import type { AnimalDiagram } from "@/data/animal-diagrams";

const SRC_BY_DIAGRAM: Record<string, string> = {
  beef: cowSrc,
  pork: pigSrc,
  lamb: sheepSrc,
  chicken: chickenSrc,
  fish: fishSrc,
};

export function AnimalSilhouette({
  diagram,
  selectedPrimalId,
  onPrimalSelect,
}: {
  diagram: AnimalDiagram;
  selectedPrimalId: string | null;
  onPrimalSelect: (id: string | null) => void;
}) {
  const src = SRC_BY_DIAGRAM[diagram.id];
  const polys = PRIMAL_POLYGONS[diagram.id];
  const anchors = PRIMAL_LABEL_ANCHORS[diagram.id];
  if (!src || !polys) return null;

  const maskStyle = {
    WebkitMaskImage: `url(${src})`,
    WebkitMaskMode: "alpha",
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskImage: `url(${src})`,
    maskMode: "alpha",
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
  } as React.CSSProperties;

  const selected = selectedPrimalId
    ? diagram.primals.find(p => p.id === selectedPrimalId) ?? null
    : null;
  const anchor = selected ? anchors?.[selected.id] : null;

  return (
    <div
      className="relative w-full mx-auto"
      style={{ aspectRatio: "4 / 3", maxHeight: 260 }}
      onClick={() => onPrimalSelect(null)}
    >
      {/* Silhouette body — full opacity, the colored cut-lines sit on top */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ opacity: 0.85 }}
      />

      {/* Primal polygons: dashed colored outlines by default, filled on select.
          Clipped to silhouette via CSS mask so lines/fills stay on the body. */}
      <div className="absolute inset-0" style={maskStyle}>
        <svg
          viewBox="0 0 100 75"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          {diagram.primals.map(primal => {
            const pts = polys[primal.id];
            if (!pts) return null;
            const scaled = pts
              .split(/\s+/)
              .map(pair => {
                const [x, y] = pair.split(",").map(Number);
                return `${(x * 100).toFixed(2)},${(y * 75).toFixed(2)}`;
              })
              .join(" ");
            const isSelected = selectedPrimalId === primal.id;
            const dimmed = selectedPrimalId != null && !isSelected;
            return (
              <polygon
                key={primal.id}
                points={scaled}
                fill={isSelected ? primal.color : "none"}
                fillOpacity={isSelected ? 0.7 : 0}
                stroke={primal.color}
                strokeWidth={isSelected ? 0.8 : 0.5}
                strokeDasharray={isSelected ? "0" : "1.2 0.8"}
                strokeOpacity={dimmed ? 0.35 : 1}
                strokeLinejoin="round"
                style={{ cursor: "pointer", transition: "all 150ms" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPrimalSelect(isSelected ? null : primal.id);
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Selected-primal label callout */}
      {selected && anchor && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` }}
        >
          <div
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: selected.color,
              color: "#0a0e1a",
              boxShadow: `0 0 12px ${selected.color}55`,
            }}
          >
            {selected.label}
          </div>
        </div>
      )}
    </div>
  );
}
