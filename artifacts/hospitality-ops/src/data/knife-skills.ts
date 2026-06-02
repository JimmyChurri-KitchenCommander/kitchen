export type KnifeSkillCategory = "precision" | "specialty" | "rough";

export type KnifeSkill = {
  id: string;
  label: string;
  frenchName?: string;
  dimensions: string;
  shape: string;
  description: string;
  startingFrom: string;
  applications: string[];
  tips: string[];
  relatedCuts: string[];
  tool?: string;
  consistency?: string;
  category?: KnifeSkillCategory;
};

export const KNIFE_SKILLS: KnifeSkill[] = [
  // ─── Precision cuts ───────────────────────────────────────────────────────────
  {
    id: "fine-brunoise",
    label: "Fine Brunoise",
    frenchName: "Brunoise fine",
    dimensions: "1.5mm × 1.5mm × 1.5mm",
    shape: "Extra-small cube",
    category: "precision",
    tool: "Chef's knife (thin blade, 21cm+)",
    consistency: "Each cube must be uniform — visible irregularity is unacceptable at this size.",
    description:
      "The finest precision cube in the classical repertoire. Requires an extremely sharp knife and cold, firm vegetables. Used where texture should be barely perceptible but flavour is present — fine sauces and refined garnishes.",
    startingFrom: "Fine julienne (1.5mm × 1.5mm sticks)",
    applications: [
      "Classical sauce garnishes (consommé printanier)",
      "Refined cucumber and radish garnishes",
      "Prawn or scallop tartare (shallot, chive)",
      "Dressing components where visible texture is not desired",
    ],
    tips: [
      "Requires an exceptionally sharp knife — a dull blade crushes at this size.",
      "Work with the vegetable very cold and firm.",
      "Use a long, thin blade with minimal knuckle clearance for control.",
      "Concentration and patience — this size reveals any lack of knife skill immediately.",
    ],
    relatedCuts: ["brunoise", "julienne"],
  },
  {
    id: "brunoise",
    label: "Brunoise",
    frenchName: "Brunoise",
    dimensions: "3mm × 3mm × 3mm",
    shape: "Small cube",
    category: "precision",
    tool: "Chef's knife (21–25cm)",
    consistency: "Each cube must measure 3mm on all sides — check the first few against a ruler.",
    description:
      "A precision small cube cut. Produced by first cutting batonnet sticks, then cross-cutting into uniform cubes. The foundation cut for many classical garnishes and fine sauces.",
    startingFrom: "Batonnet (3mm × 3mm sticks)",
    applications: [
      "Fine vegetable garnishes for consommé and clear soups",
      "Sauce bases (mirepoix variation)",
      "Stuffings and duxelles",
      "Fine dice component in tartare",
      "Crispy fried garnish (beetroot brunoise, turnip)",
    ],
    tips: [
      "Produce square batonnet sticks first — any irregularity multiplies into the cube.",
      "Stack 3–4 batonnet sticks and cross-cut in one motion for speed.",
      "Keep vegetable chilled — cold vegetables cut more cleanly.",
      "Use a rocking motion on the heel of the knife, not a chopping motion.",
    ],
    relatedCuts: ["fine-brunoise", "batonnet", "macedoine"],
  },
  {
    id: "allumette",
    label: "Allumette",
    frenchName: "Pommes allumettes",
    dimensions: "2mm × 2mm × 5–6cm",
    shape: "Very thin matchstick",
    category: "precision",
    tool: "Chef's knife or mandoline (2mm julienne blade)",
    consistency: "Thinner than julienne — must be uniform or they cook at wildly different rates when fried.",
    description:
      "The thinnest of the strip cuts — finer than julienne. The name means 'matchstick'. Classically used for thin-cut fries (pommes allumettes) and delicate garnishes. Requires maximum knife sharpness or a mandoline with a julienne attachment.",
    startingFrom: "Planks (2mm thick slabs)",
    applications: [
      "Thin-cut fries (pommes allumettes) — cooked in 2–3 minutes at 180°C",
      "Crispy fried garnish (potato nests, parsnip straw)",
      "Fine vegetable garnish for elegant plating",
      "Daikon and carrot garnish for Asian dishes",
    ],
    tips: [
      "A mandoline with julienne blade is faster and more consistent than knife work at this size.",
      "For potato allumettes: blanch in cold oil from 130°C, finish at 180°C — the classic two-stage fry.",
      "Dry completely before frying — surface moisture causes violent splatter.",
      "Store cut allumettes in cold water to prevent browning (for potato).",
    ],
    relatedCuts: ["julienne", "batonnet"],
  },
  {
    id: "julienne",
    label: "Julienne",
    frenchName: "Julienne",
    dimensions: "3mm × 3mm × 5–6cm",
    shape: "Thin matchstick strip",
    category: "precision",
    tool: "Chef's knife (21–25cm) or mandoline",
    consistency: "Consistent thickness (3mm) and length (5–6cm) — bunchy or uneven julienne looks amateur.",
    description:
      "Matchstick-thin strips of uniform length. The standard julienne is the starting point for brunoise. Used extensively in Asian cooking, classical French garnishes, and salad preparation.",
    startingFrom: "Planks (3mm thick slabs)",
    applications: [
      "Asian stir-fry (carrot, zucchini, capsicum)",
      "Consommé garnishes",
      "Vegetable nests and salad texture",
      "Spring roll and rice paper roll filling",
      "Quick-pickled garnishes (daikon, carrot)",
    ],
    tips: [
      "Cut planks first: slice vegetable into 5–6cm lengths, then cut planks 3mm thick.",
      "Stack planks and cut into 3mm strips — align the stack carefully.",
      "Hold the stack steady with a 'claw grip' — fingertips curled, knuckle guiding the blade.",
      "A mandoline achieves speed but a knife gives more tactile control for precision.",
    ],
    relatedCuts: ["brunoise", "fine-brunoise", "batonnet"],
  },
  {
    id: "batonnet",
    label: "Batonnet",
    frenchName: "Bâtonnet",
    dimensions: "6mm × 6mm × 5–6cm",
    shape: "Medium stick / baton",
    category: "precision",
    tool: "Chef's knife (21–25cm)",
    consistency: "Square cross-section is essential — round batonnet comes from not squaring off the vegetable first.",
    description:
      "Medium-sized stick cut, approximately twice the size of julienne. The standard starting point for the macedoine cube. Also the classic French fry base cut.",
    startingFrom: "Planks (6mm thick slabs)",
    applications: [
      "French fries / potato batons",
      "Crudités (carrot, celery, zucchini, capsicum sticks)",
      "Starting point for macedoine",
      "Vegetable sides (glazed carrot batons, green bean bundles)",
    ],
    tips: [
      "Square off the vegetable into a rectangular block first — discard the curved edges.",
      "Trim to consistent 5–6cm lengths for uniform cooking.",
      "Batonnet for fries: always equal thickness — uneven fries cook at different rates.",
      "Saved trim from squaring is suitable for stock or staff meal.",
    ],
    relatedCuts: ["macedoine", "julienne", "allumette"],
  },
  {
    id: "macedoine",
    label: "Macédoine",
    frenchName: "Macédoine",
    dimensions: "6mm × 6mm × 6mm",
    shape: "Medium cube",
    category: "precision",
    tool: "Chef's knife (21–25cm)",
    consistency: "Uniform cubes cook evenly — any piece more than 2mm larger will be raw when the others are done.",
    description:
      "A medium dice cube produced from batonnet. Twice the size of brunoise. The traditional French mixed vegetable cut for macédoine de légumes — a composed salad of individually cooked diced vegetables.",
    startingFrom: "Batonnet (6mm sticks)",
    applications: [
      "Macédoine de légumes (classical French vegetable salad)",
      "Vegetable soups (minestrone, ratatouille)",
      "Stuffings and forcemeats",
      "Potato salad (consistent size for even cooking)",
    ],
    tips: [
      "Same process as brunoise, scaled up: batonnet first, then cross-cut into cubes.",
      "For vegetable soups: consistent size ensures even cooking — all pieces finish together.",
      "Can be used interchangeably with 'medium dice' in many modern kitchen contexts.",
    ],
    relatedCuts: ["brunoise", "batonnet", "large-dice"],
  },
  {
    id: "large-dice",
    label: "Large Dice",
    frenchName: "Grande brunoise",
    dimensions: "20mm × 20mm × 20mm",
    shape: "Large cube",
    category: "precision",
    tool: "Chef's knife (21–25cm)",
    consistency: "Oversized pieces stew while small ones dissolve — square-off before dicing.",
    description:
      "A large, rough-square cube cut used for slow braises, stews, and dishes where the vegetable needs to hold its shape through long cooking. The starting block for many mirepoix variations.",
    startingFrom: "Large planks or halved vegetables",
    applications: [
      "Braised vegetable bases (cassoulet, osso buco)",
      "Potato gratin and baked dishes",
      "Roasting trays where the vegetable will caramelise",
      "Moroccan tagine and stew vegetables",
    ],
    tips: [
      "Square off irregular vegetables before dicing — round edges produce uneven sizes.",
      "For root vegetables: peel first, then cut planks, then cubes.",
      "Large dice tolerates slightly less precision than smaller cuts — prioritise consistent sizing over exact 20mm.",
    ],
    relatedCuts: ["macedoine", "rough-chop"],
  },

  // ─── Specialty cuts ───────────────────────────────────────────────────────────
  {
    id: "chiffonade",
    label: "Chiffonade",
    frenchName: "Chiffonade",
    dimensions: "1–2mm wide ribbons",
    shape: "Thin ribbon or shred",
    category: "specialty",
    tool: "Chef's knife (thin blade, very sharp)",
    consistency: "Ribbons should be clean-cut — crushed, bruised edges mean the blade is too dull or the knife is sawing.",
    description:
      "A ribbon cut specifically for leafy vegetables and herbs. The leaves are stacked, tightly rolled, and cross-cut into thin ribbons. Creates a delicate, feathery texture without crushing the leaves.",
    startingFrom: "Stacked, rolled leaves",
    applications: [
      "Basil, mint, sage ribbons (garnish)",
      "Shredded cabbage, kale, spinach for salads",
      "Lettuce cups and salad bases",
      "Herb garnish for soups and pasta",
    ],
    tips: [
      "Stack 6–8 leaves, align the veins, then roll tightly into a cylinder.",
      "Cross-cut with a rocking motion — do not saw back and forth or bruise the leaves.",
      "Do not chiffonade basil in advance — it oxidises rapidly. Do immediately before service.",
      "Separate the ribbons gently with your fingers after cutting — do not shake.",
    ],
    relatedCuts: ["rough-chop"],
  },
  {
    id: "paysanne",
    label: "Paysanne",
    frenchName: "Paysanne",
    dimensions: "12mm × 12mm × 3mm",
    shape: "Flat square or disc",
    category: "specialty",
    tool: "Chef's knife (21–25cm)",
    consistency: "Thickness (3mm) matters more than shape — the rustic look is intentional.",
    description:
      "Thin, flat cuts in a square, round, or triangular shape. A 'rustic' or 'peasant' cut — less refined than brunoise but with a larger surface area for sauces to coat. Used in country-style braises and soups.",
    startingFrom: "Planks (3mm thick), then cut to shape",
    applications: [
      "Rustic soups and potages (paysanne soup)",
      "Country-style braises and casseroles",
      "Ratatouille (alternative to rondelle)",
      "Leek and potato dishes",
    ],
    tips: [
      "The irregular shape is intentional — round, square, and triangular pieces all acceptable.",
      "Consistency in thickness (3mm) matters more than shape consistency.",
      "Larger surface area means more contact with braising liquid — suits slow-cooked dishes.",
      "For round vegetables: cut into rondelles first, then halve or quarter.",
    ],
    relatedCuts: ["macedoine", "rough-chop"],
  },
  {
    id: "rondelle",
    label: "Rondelle",
    frenchName: "Rondelle / en rondelles",
    dimensions: "3–10mm thick rounds",
    shape: "Disc / round cross-section",
    category: "specialty",
    tool: "Chef's knife or mandoline",
    consistency: "Use a visual guide (knuckle depth) or mandoline stop for consistent thickness.",
    description:
      "Circular slices cut perpendicular to the length of a cylindrical vegetable. Bias-cut (on an angle) versions give elongated oval slices with more surface area. Simple but impactful cut for visual presentation.",
    startingFrom: "Whole cylindrical vegetable",
    applications: [
      "Carrot rondelles for soups, stews, garnish",
      "Zucchini / courgette rounds for grilling",
      "Cucumber rondelles for canapé bases",
      "Fennel rondelles (thin-sliced on a mandoline)",
    ],
    tips: [
      "Consistent thickness is key — use a ruler or cut to a knuckle-depth guide.",
      "For bias cut: tilt the vegetable 45° before cutting — elongated oval slices with more surface area.",
      "A mandoline gives greater speed and consistency for thin rondelles.",
      "Blanch carrot rondelles before service — they hold colour and texture better than raw.",
    ],
    relatedCuts: ["paysanne"],
  },
  {
    id: "oblique",
    label: "Oblique / Roll Cut",
    frenchName: "Coupe oblique",
    dimensions: "3–4cm long, angled faces",
    shape: "Irregular, angled multi-face chunk",
    category: "specialty",
    tool: "Chef's knife (21–25cm)",
    consistency: "Rotate the vegetable the same amount before each cut — gives pieces of similar size with more surface area than rondelle.",
    description:
      "A diagonal cut used on cylindrical vegetables where you rotate the vegetable 90° between each cut. Produces irregular-shaped pieces with a large angled surface area, ideal for stir-fries and braises where contact with the pan and sauce is the goal.",
    startingFrom: "Whole or halved cylindrical vegetable",
    applications: [
      "Stir-fried vegetables (carrot, zucchini, eggplant)",
      "Roasted root vegetables (parsnip, carrot, swede)",
      "Asian braises and red-cooked dishes",
      "Anywhere rondelle is called for but more surface area is wanted",
    ],
    tips: [
      "Angle the knife at 45° to the vegetable for each cut.",
      "Rotate the vegetable 90° (a quarter turn) between cuts — not more, not less.",
      "Irregular shape is the goal — uniform size (not shape) is what matters.",
      "Works best on dense, firm vegetables. Soft vegetables fall apart at the cut.",
    ],
    relatedCuts: ["rondelle", "rough-chop"],
  },
  {
    id: "tourné",
    label: "Tourné",
    frenchName: "Tourné / Château",
    dimensions: "4–5cm long, 7 sides",
    shape: "Football / barrel shape",
    category: "specialty",
    tool: "Tourné knife (bird's beak / tourne knife)",
    consistency: "7 equal facets, uniform length. Each side should be the same width. Flat ends, no tapering.",
    description:
      "A highly refined classical cut producing a 7-sided barrel or football shape. Used for individual vegetable garnishes in fine dining. Demonstrates advanced knife skill and patience. The trim produces useful off-cuts for soup or purée.",
    startingFrom: "Rough-trimmed cylinder of vegetable",
    applications: [
      "Classical fine dining vegetable garnishes",
      "Potato château (turned potatoes roasted in butter)",
      "Turned root vegetable garnishes for tasting menus",
      "Demonstration of classical knife technique",
    ],
    tips: [
      "Use a short, curved tourné knife (bird's beak knife) — not a straight-bladed knife.",
      "Hold the vegetable in your non-dominant hand, rotating away from you with each cut.",
      "Each of the 7 facets should be equal in width and length — uniformity is the benchmark.",
      "Save all trim for purée or soup — tourné produces significant off-cuts.",
    ],
    relatedCuts: ["batonnet", "rough-chop"],
  },
  {
    id: "concasse",
    label: "Concassé",
    frenchName: "Tomate concassée",
    dimensions: "5–10mm dice (tomato)",
    shape: "Peeled, seeded, diced",
    category: "specialty",
    tool: "Chef's knife (21–25cm) + paring knife for coring",
    consistency: "Uniform dice that holds its shape. Must be fully seeded and drained or it makes sauces watery.",
    description:
      "Specifically a tomato preparation: blanched to peel, seeded, and diced into small rough cubes. The standard base for many French sauces and a refined garnish in its own right. The peeling and seeding steps are as important as the cutting.",
    startingFrom: "Whole tomato (blanched and peeled)",
    applications: [
      "Sauce base (tomato concassée with shallot, garlic, herbs)",
      "Bruschetta topping",
      "Cold garnish for fish and seafood",
      "Ratatouille (combined with other vegetables)",
    ],
    tips: [
      "Score a cross in the base of the tomato before blanching — skin peels easily after 15 seconds in boiling water.",
      "Immediately refresh in ice water to stop cooking.",
      "Quarter and use a spoon to scrape seeds — or squeeze gently.",
      "Salt concassée lightly and rest in a colander 5 minutes to drain excess water before use.",
    ],
    relatedCuts: ["brunoise", "macedoine"],
  },
  {
    id: "supreme",
    label: "Suprême",
    frenchName: "Suprême / Segments à vif",
    dimensions: "Individual citrus segments",
    shape: "Membrane-free citrus wedge",
    category: "specialty",
    tool: "Paring knife or flexible segmenting knife",
    consistency: "No membrane, no pith, clean edges. Each segment should release cleanly from the fruit.",
    description:
      "A citrus preparation technique. The peel and all white pith are removed from the fruit, then each segment is cut free from the connecting membrane. The result is a clean, juice-filled segment with no fibrous membrane.",
    startingFrom: "Whole citrus fruit (orange, grapefruit, lemon, mandarin)",
    applications: [
      "Citrus salads and composed salads",
      "Salmon, scallop, and prawn plates (citrus garnish)",
      "Dessert components and pastry decoration",
      "Ceviche and cold plates",
    ],
    tips: [
      "Cut both poles off the fruit first — creates a flat base for stability.",
      "Cut the peel off in strips following the curve of the fruit, removing all white pith.",
      "Hold the peeled fruit over a bowl — cut each segment free by slicing along both membranes.",
      "Squeeze the remaining membrane for the juice — do not waste it.",
    ],
    relatedCuts: ["concasse"],
  },

  // ─── Rough cuts ──────────────────────────────────────────────────────────────
  {
    id: "rough-chop",
    label: "Rough Chop",
    frenchName: "Émincer (coarse)",
    dimensions: "10–20mm irregular pieces",
    shape: "Irregular, rustic pieces",
    category: "rough",
    tool: "Chef's knife (21–25cm)",
    consistency: "Approximate sizing matters — pieces should be within about 5mm of each other for even cooking.",
    description:
      "A non-precision cut producing irregular, bite-sized pieces. Speed is prioritised over uniformity. Used where visual precision is not required and extended cooking or blending will follow.",
    startingFrom: "Halved or quartered vegetable",
    applications: [
      "Stock and broth vegetables (they will be strained)",
      "Roasting vegetables for sauces and jus bases",
      "Soups to be blended",
      "Staff meal preparations",
    ],
    tips: [
      "Larger pieces reduce at the same rate — aim for roughly equal sizing even in a rough chop.",
      "For stocks: rough chop is ideal — surface area is less important when simmering 4+ hours.",
      "Speed is the goal — one confident cut, not multiple correction cuts.",
    ],
    relatedCuts: ["paysanne", "large-dice"],
  },
  {
    id: "mince",
    label: "Mince",
    frenchName: "Hacher",
    dimensions: "Under 2mm, near-paste",
    shape: "Very fine chop",
    category: "rough",
    tool: "Chef's knife or mezzaluna",
    consistency: "No visible chunks — everything should be at near-paste fineness for most applications.",
    description:
      "The finest possible knife chop short of paste. Used for garlic, ginger, shallots, and fresh herbs where the ingredient should flavour without being distinctly visible or textural in the finished dish.",
    startingFrom: "Rough chop, then rock the knife to refine",
    applications: [
      "Garlic and ginger in stir-fry sauces",
      "Shallot mince for beurre blanc and vinaigrettes",
      "Fresh herb incorporation into compound butters",
      "Tartare condiment (shallot, caper mince)",
    ],
    tips: [
      "Rough chop first, then flatten and rock the knife forward and backward across the pile.",
      "Sprinkle with a pinch of salt before mincing — acts as an abrasive and draws moisture to form a paste.",
      "Pivot the knife around the tip — the tip stays down, the handle rocks.",
      "A mezzaluna (curved double-handled blade) is faster for large quantities.",
    ],
    relatedCuts: ["fine-brunoise", "rough-chop"],
  },
];

// ─── Utility functions ────────────────────────────────────────────────────────

export function findKnifeSkill(id: string): KnifeSkill | undefined {
  return KNIFE_SKILLS.find(s => s.id === id);
}

export function searchKnifeSkills(query: string): KnifeSkill[] {
  const q = query.toLowerCase();
  if (!q) return KNIFE_SKILLS;
  return KNIFE_SKILLS.filter(
    s =>
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.dimensions.toLowerCase().includes(q) ||
      s.applications.some(a => a.toLowerCase().includes(q)) ||
      (s.frenchName?.toLowerCase().includes(q) ?? false)
  );
}

export function getKnifeSkillsByCategory(category: KnifeSkillCategory): KnifeSkill[] {
  return KNIFE_SKILLS.filter(s => s.category === category);
}

// Pattern matching for linking prep tasks to knife skills
const KNIFE_PATTERNS: Array<{ pattern: RegExp; skillId: string }> = [
  { pattern: /\bfine\s+brunoise\b/i,    skillId: "fine-brunoise" },
  { pattern: /\bbrunoise\b/i,           skillId: "brunoise" },
  { pattern: /\ballumette\b/i,          skillId: "allumette" },
  { pattern: /\bjulienne\b/i,           skillId: "julienne" },
  { pattern: /\bbatonnet\b/i,           skillId: "batonnet" },
  { pattern: /\bchiffonade\b/i,         skillId: "chiffonade" },
  { pattern: /\bpaysanne\b/i,           skillId: "paysanne" },
  { pattern: /\bmac[eé]doine\b/i,       skillId: "macedoine" },
  { pattern: /\blarge\s+dice\b/i,       skillId: "large-dice" },
  { pattern: /\brondelle\b/i,           skillId: "rondelle" },
  { pattern: /\boblique\b|\broll\s+cut\b/i, skillId: "oblique" },
  { pattern: /\btourn[eé]\b/i,          skillId: "tourné" },
  { pattern: /\bconcass[eé]\b/i,        skillId: "concasse" },
  { pattern: /\bsupr[eê]me\b/i,         skillId: "supreme" },
  { pattern: /\bmince\b|\bminced\b/i,   skillId: "mince" },
  { pattern: /\brough\s*chop\b/i,       skillId: "rough-chop" },
  { pattern: /\bdice\b|\bdiced\b/i,     skillId: "brunoise" },
];

export function matchKnifeSkill(text: string): KnifeSkill | null {
  for (const { pattern, skillId } of KNIFE_PATTERNS) {
    if (pattern.test(text)) {
      return findKnifeSkill(skillId) ?? null;
    }
  }
  return null;
}
