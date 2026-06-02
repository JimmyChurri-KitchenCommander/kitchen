export { BEEF_SHAPE } from "./beef";
export { PORK_SHAPE } from "./pork";
export { LAMB_SHAPE } from "./lamb";
export { CHICKEN_SHAPE } from "./chicken";
export { FISH_SHAPE } from "./fish";
export type { PrimalShapeObject, PrimalZone, Anchor, Edge, ZoneType } from "./types";
export { validateShape } from "./types";

import type { PrimalShapeObject } from "./types";
import { BEEF_SHAPE } from "./beef";
import { PORK_SHAPE } from "./pork";
import { LAMB_SHAPE } from "./lamb";
import { CHICKEN_SHAPE } from "./chicken";
import { FISH_SHAPE } from "./fish";

export const ANIMAL_SHAPES: PrimalShapeObject[] = [
  BEEF_SHAPE,
  PORK_SHAPE,
  LAMB_SHAPE,
  CHICKEN_SHAPE,
  FISH_SHAPE,
];

export function getAnimalShape(id: string): PrimalShapeObject | undefined {
  return ANIMAL_SHAPES.find(s => s.id === id);
}
