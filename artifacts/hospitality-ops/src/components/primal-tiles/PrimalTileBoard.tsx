import { useState, useCallback } from "react";
import type { AnimalTemplate, AnimalId } from "../../engine/primal-engine";
import { PrimalTile } from "./PrimalTile";
import { PrimalDetailPanel } from "./PrimalDetailPanel";

export function PrimalTileBoard({
  template,
  animalId,
}: {
  template: AnimalTemplate;
  animalId: AnimalId;
}) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const selectedZone = selectedZoneId
    ? (template.zones.find(z => z.id === selectedZoneId) ?? null)
    : null;

  const handleSelect = useCallback(
    (id: string) => setSelectedZoneId(prev => (prev === id ? null : id)),
    [],
  );

  const handleClose = useCallback(() => setSelectedZoneId(null), []);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Tile grid */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-5 md:p-7">
          {/* Species board heading */}
          <div className="mb-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/22 mb-0.5">
              Primal Cut Board
            </p>
            <p className="text-[11px] text-white/35">
              {template.zones.length} primal zones — click any tile for full intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {template.zones.map(zone => (
              <PrimalTile
                key={zone.id}
                zone={zone}
                animalId={animalId}
                isSelected={zone.id === selectedZoneId}
                onSelect={() => handleSelect(zone.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right detail panel — fixed width, appears on tile selection */}
      {selectedZone && (
        <PrimalDetailPanel
          animalId={animalId}
          zone={selectedZone}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
