// ─── Animal cut diagram SVG data ───────────────────────────────────────────────
// Uses per-animal coordinate spaces. Body paths are quadratic-bezier outlines;
// primal regions are polygon point sets in the same coordinate space.
// SVG clipPath on the body keeps primal polygons inside the silhouette.

export type PrimalAnatomy = {
  tenderness: number; // 1–10
  marbling: "none" | "low" | "medium" | "high" | "exceptional";
  collagen: "none" | "low" | "medium" | "high";
};

export type PrimalCooking = {
  methods: string[];
};

export type PrimalRegion = {
  id: string;
  label: string;
  shortLabel?: string;
  color: string;
  points: string;
  labelX: number;
  labelY: number;
  cutIds: string[];
  subprimals?: string[];
  description?: string;
  anatomy?: PrimalAnatomy;
  cooking?: PrimalCooking;
};

export type AnimalDiagram = {
  id: string;
  label: string;
  icon: string;
  viewBox: string;
  bodyPath: string;
  legPaths?: string[];
  accentPaths?: string[];
  primals: PrimalRegion[];
  operationalNote?: string;
  totalCutsLabel?: string;
};

// ─── Beef (480×210) ────────────────────────────────────────────────────────────

const BEEF_BODY =
  "M 38,42 Q 15,38 8,57 Q 4,72 4,84 L 4,116 Q 10,133 32,146 Q 58,158 88,165 Q 135,174 192,177 Q 248,178 298,176 Q 342,172 378,162 Q 410,148 430,128 Q 448,106 450,82 Q 450,60 440,46 Q 425,36 404,31 Q 370,27 328,27 Q 285,27 240,26 Q 200,26 165,26 L 148,18 Q 128,28 105,36 Q 80,42 60,47 Q 46,44 38,42 Z";

const BEEF_LEGS = [
  "M 108,174 L 106,209 L 122,209 L 124,174 Z",
  "M 126,174 L 124,207 L 140,207 L 142,174 Z",
  "M 360,164 L 358,209 L 374,209 L 376,164 Z",
  "M 378,164 L 376,207 L 392,207 L 394,164 Z",
];

const BEEF_PRIMALS: PrimalRegion[] = [
  {
    id: "chuck",
    label: "Chuck",
    color: "#e8763a",
    points: "88,52 178,43 178,130 130,142 92,155 80,120",
    labelX: 128,
    labelY: 88,
    cutIds: ["oyster-blade", "chuck-roll"],
    subprimals: ["Chuck Roll", "Chuck Eye", "Blade", "Oyster Blade", "Cross Rib"],
    description: "The shoulder and neck region. Well-worked muscles with good marbling. Best for slow cooking or seam butchery into value steaks.",
    anatomy: { tenderness: 4, marbling: "medium", collagen: "high" },
    cooking: { methods: ["braise", "slow_roast", "seam_butchery"] },
  },
  {
    id: "rib",
    label: "Rib",
    color: "#e8c03a",
    points: "178,43 252,40 252,130 178,130",
    labelX: 215,
    labelY: 82,
    cutIds: ["ribeye"],
    subprimals: ["Rib Eye", "Cube Roll", "Rib Cap", "Short Ribs"],
    description: "Premium rib section. Highest natural marbling on the carcase. The cube roll (boneless) or standing rib roast. Rib cap (spinalis dorsi) is the most prized secondary cut.",
    anatomy: { tenderness: 9, marbling: "high", collagen: "low" },
    cooking: { methods: ["grill", "roast", "reverse_sear"] },
  },
  {
    id: "short-loin",
    label: "Short Loin",
    shortLabel: "Loin",
    color: "#c4d43a",
    points: "252,40 312,41 312,128 252,130",
    labelX: 282,
    labelY: 80,
    cutIds: ["striploin", "eye-fillet", "t-bone"],
    subprimals: ["Striploin", "Tenderloin", "T-Bone", "Porterhouse"],
    description: "The most premium primal. Yields striploin (NY strip) and tenderloin (eye fillet). T-bone and porterhouse are cross-cuts that include both muscles.",
    anatomy: { tenderness: 10, marbling: "medium", collagen: "none" },
    cooking: { methods: ["grill", "pan_sear", "sous_vide"] },
  },
  {
    id: "sirloin",
    label: "Sirloin",
    color: "#7ad43a",
    points: "312,41 358,44 358,134 312,128",
    labelX: 335,
    labelY: 84,
    cutIds: ["rump"],
    subprimals: ["Rump", "Rump Cap (Picanha)", "Tri-Tip", "Flap Meat"],
    description: "Transitions from loin to hindquarter. Yields rump and rump cap (picanha). Good flavour, slightly firmer texture than loin cuts. Value grill steaks.",
    anatomy: { tenderness: 7, marbling: "medium", collagen: "low" },
    cooking: { methods: ["grill", "roast", "pan_sear"] },
  },
  {
    id: "round",
    label: "Round",
    color: "#3ab4d4",
    points: "358,44 404,40 432,64 440,88 432,110 415,136 385,150 358,150 358,134",
    labelX: 400,
    labelY: 92,
    cutIds: ["topside"],
    subprimals: ["Topside", "Silverside", "Inside Round", "Eye of Round", "Outside Round"],
    description: "The hindquarter. Lean, well-worked muscles. Used for roasting whole or thin-sliced cold meats. High yield. Requires careful cooking to avoid toughness.",
    anatomy: { tenderness: 4, marbling: "low", collagen: "medium" },
    cooking: { methods: ["braise", "slow_roast", "mince"] },
  },
  {
    id: "brisket",
    label: "Brisket",
    color: "#d44a6e",
    points: "92,155 178,130 178,166 138,170 96,162",
    labelX: 134,
    labelY: 154,
    cutIds: ["brisket"],
    subprimals: ["Flat (Lean)", "Point (Deckle)", "Packer Brisket"],
    description: "The chest pectoral muscle. Very high collagen — transforms through low-and-slow cooking. Benchmark BBQ cut. Two muscles: the flat (lean) and point (fattier).",
    anatomy: { tenderness: 2, marbling: "high", collagen: "high" },
    cooking: { methods: ["smoke", "braise", "confit"] },
  },
  {
    id: "plate",
    label: "Plate",
    color: "#9a4ad4",
    points: "178,130 312,128 312,166 178,166",
    labelX: 245,
    labelY: 154,
    cutIds: ["short-ribs", "skirt-steak", "hanger-steak"],
    subprimals: ["Short Plate", "Short Ribs", "Skirt Steak (inside/outside)", "Hanger Steak"],
    description: "Lower mid-section. Yields skirt steak, short ribs, and hanger (onglet). High flavour, coarser grain. The hanger hangs from the diaphragm — only two per animal.",
    anatomy: { tenderness: 5, marbling: "high", collagen: "medium" },
    cooking: { methods: ["grill", "braise", "wok"] },
  },
  {
    id: "flank",
    label: "Flank",
    color: "#4a80d4",
    points: "312,128 358,134 385,150 350,166 312,166",
    labelX: 344,
    labelY: 152,
    cutIds: ["flank-steak"],
    subprimals: ["Flank Steak", "Flap Steak"],
    description: "Lower hindquarter belly. Flat, lean muscle with strong grain. Must be marinated and sliced thin across the grain. Popular in Asian and Latin cuisines.",
    anatomy: { tenderness: 5, marbling: "low", collagen: "medium" },
    cooking: { methods: ["grill", "marinate", "wok"] },
  },
];

// ─── Pork (460×200) ────────────────────────────────────────────────────────────

const PORK_BODY =
  "M 50,58 Q 28,48 14,64 Q 4,78 4,98 Q 4,118 16,132 Q 34,146 62,156 Q 90,164 120,169 Q 165,175 222,176 Q 278,176 322,172 Q 358,164 385,150 Q 408,132 418,108 Q 422,84 412,64 Q 396,48 368,40 Q 330,34 288,33 Q 245,32 202,32 Q 162,32 128,35 Q 100,40 80,48 Q 62,54 50,58 Z";

const PORK_TAIL =
  "M 420,96 Q 436,82 432,66 Q 428,52 440,48 Q 450,46 447,58 Q 444,68 432,68 Q 424,68 422,60";

const PORK_LEGS = [
  "M 112,170 L 110,198 L 126,198 L 128,170 Z",
  "M 130,170 L 128,197 L 144,197 L 146,170 Z",
  "M 330,168 L 328,198 L 344,198 L 346,168 Z",
  "M 348,168 L 346,197 L 362,197 L 364,168 Z",
];

const PORK_PRIMALS: PrimalRegion[] = [
  {
    id: "shoulder",
    label: "Shoulder",
    color: "#e8763a",
    points: "88,58 188,43 188,130 132,145 92,158 80,120",
    labelX: 132,
    labelY: 88,
    cutIds: ["pork-shoulder"],
    subprimals: ["Boston Butt", "Picnic", "Pork Collar", "Pork Cheek"],
    description: "The forequarter. Boston butt (upper) is ideal for pulled pork. Picnic (lower) has more collagen. Collar is the neck muscle — European preference for steaks.",
    anatomy: { tenderness: 4, marbling: "medium", collagen: "high" },
    cooking: { methods: ["pull", "braise", "smoke"] },
  },
  {
    id: "loin",
    label: "Loin",
    color: "#e8c03a",
    points: "188,43 332,40 332,130 188,130",
    labelX: 260,
    labelY: 80,
    cutIds: ["pork-loin", "pork-tenderloin", "baby-back-ribs"],
    subprimals: ["Pork Rack", "Loin Eye", "Tenderloin", "Loin Chops", "Baby Back Ribs"],
    description: "The back loin from shoulder to ham. Lean, tender. Baby back ribs come from the upper rib section. Tenderloin is the most tender cut on the pig — very lean.",
    anatomy: { tenderness: 8, marbling: "low", collagen: "none" },
    cooking: { methods: ["roast", "grill", "pan_sear"] },
  },
  {
    id: "ham",
    label: "Ham",
    color: "#7ad43a",
    points: "332,40 390,48 412,82 420,108 406,130 370,150 332,162 332,130",
    labelX: 378,
    labelY: 95,
    cutIds: ["ham-hock"],
    subprimals: ["Inside Ham", "Outside Ham", "Knuckle", "Rump", "Ham Hock"],
    description: "The hindquarter. Cured for traditional ham. Fresh ham (leg roast) is excellent whole-roasted. High yield. Knuckle and hock are collagen-rich slow-cook cuts.",
    anatomy: { tenderness: 5, marbling: "low", collagen: "medium" },
    cooking: { methods: ["cure", "roast", "braise"] },
  },
  {
    id: "belly",
    label: "Belly",
    color: "#d44a9a",
    points: "188,130 332,130 332,162 260,170 188,162",
    labelX: 260,
    labelY: 155,
    cutIds: ["pork-belly", "spare-ribs"],
    subprimals: ["Pork Belly", "Spare Ribs", "St. Louis Ribs"],
    description: "Layered fat and muscle. Self-basting during slow cooking. Spare ribs attach at the belly — St. Louis cut removes the sternum for a cleaner rack.",
    anatomy: { tenderness: 7, marbling: "exceptional", collagen: "medium" },
    cooking: { methods: ["braise", "roast", "confit"] },
  },
  {
    id: "hock",
    label: "Hock",
    color: "#9a4ad4",
    points: "58,114 88,58 80,120 62,150 42,135",
    labelX: 55,
    labelY: 92,
    cutIds: [],
    subprimals: ["Front Hock", "Jowl", "Cheek"],
    description: "Head and front hock. Jowl and cheek are excellent braising cuts — rich in fat and collagen. Hock is used in pea and ham soup, German-style slow roasted.",
    anatomy: { tenderness: 2, marbling: "low", collagen: "high" },
    cooking: { methods: ["braise", "smoke", "stock"] },
  },
];

// ─── Lamb (440×195) ────────────────────────────────────────────────────────────

const LAMB_BODY =
  "M 44,48 Q 24,42 12,56 Q 4,68 4,86 Q 4,104 14,118 Q 28,132 52,144 Q 76,154 106,160 Q 150,168 198,170 Q 248,170 290,166 Q 325,160 355,148 Q 382,132 396,108 Q 402,86 392,66 Q 376,50 352,44 Q 318,36 278,34 Q 236,33 196,33 Q 158,33 126,35 L 108,26 Q 88,36 70,44 Q 54,46 44,48 Z";

const LAMB_LEGS = [
  "M 102,162 L 100,193 L 114,193 L 116,162 Z",
  "M 118,162 L 116,193 L 130,193 L 132,162 Z",
  "M 306,160 L 304,193 L 318,193 L 320,160 Z",
  "M 322,160 L 320,193 L 334,193 L 336,160 Z",
];

const LAMB_PRIMALS: PrimalRegion[] = [
  {
    id: "shoulder",
    label: "Shoulder",
    color: "#e8763a",
    points: "86,56 185,44 185,128 128,140 90,155 76,118",
    labelX: 128,
    labelY: 88,
    cutIds: ["lamb-shoulder"],
    subprimals: ["Blade Shoulder", "Cross-cut Shoulder", "Shoulder Chops", "Shoulder Roast"],
    description: "Heavily worked forequarter with excellent flavour. High collagen content — best slow-roasted or braised for 5+ hours. Bone-in retains moisture and flavour.",
    anatomy: { tenderness: 4, marbling: "medium", collagen: "high" },
    cooking: { methods: ["slow_roast", "braise", "mince"] },
  },
  {
    id: "rack",
    label: "Rack",
    color: "#e8c03a",
    points: "185,44 248,41 248,122 185,128",
    labelX: 216,
    labelY: 80,
    cutIds: ["lamb-rack"],
    subprimals: ["Frenched Rack", "Single Cutlets", "Rib Chops"],
    description: "Premium rib section. 8 ribs per rack. French-trimmed for fine dining presentation. Guard of honour and crown roast use two racks. High GP, high labour.",
    anatomy: { tenderness: 9, marbling: "medium", collagen: "low" },
    cooking: { methods: ["roast", "grill", "pan_sear"] },
  },
  {
    id: "loin",
    label: "Loin",
    color: "#c4d43a",
    points: "248,41 308,43 308,122 248,122",
    labelX: 278,
    labelY: 78,
    cutIds: ["lamb-saddle", "lamb-chops"],
    subprimals: ["Cannon", "Saddle", "Loin Chops", "Noisettes", "Tenderloin"],
    description: "The most tender section of the lamb. Saddle = double loin. Cannon = boned loin muscle. Noisettes from belly-wrapped cannon. High GP, moderate labour.",
    anatomy: { tenderness: 10, marbling: "medium", collagen: "none" },
    cooking: { methods: ["pan_sear", "grill", "sous_vide"] },
  },
  {
    id: "leg",
    label: "Leg",
    color: "#3ab4d4",
    points: "308,43 368,50 400,84 408,108 398,130 365,150 325,160 308,158 308,122",
    labelX: 362,
    labelY: 98,
    cutIds: ["lamb-shank", "butterflied-leg"],
    subprimals: ["Bone-in Leg", "Butterflied Leg", "Topside", "Silverside", "Shank"],
    description: "The rear quarter. Whole bone-in for roasting. Butterflied for quick grill. Shank is the premium slow-cook cut — all collagen, all flavour when braised.",
    anatomy: { tenderness: 6, marbling: "low", collagen: "medium" },
    cooking: { methods: ["roast", "grill", "braise"] },
  },
  {
    id: "breast",
    label: "Breast",
    shortLabel: "Flap",
    color: "#d44a6e",
    points: "185,128 308,122 325,160 260,168 185,158",
    labelX: 250,
    labelY: 148,
    cutIds: ["lamb-breast"],
    subprimals: ["Breast", "Belly Flap", "Riblets", "Flap"],
    description: "The belly and lower rib section. Rolled and stuffed for braising. Riblets as a bar snack. Very economical — high in fat and flavour when slow-cooked.",
    anatomy: { tenderness: 5, marbling: "high", collagen: "high" },
    cooking: { methods: ["braise", "stuff_roll", "slow_roast"] },
  },
];

// ─── Chicken (380×180) ─────────────────────────────────────────────────────────

const CHICKEN_BODY =
  "M 60,62 Q 38,52 24,68 Q 12,80 12,98 Q 14,114 26,128 Q 44,142 68,152 Q 96,162 128,167 Q 170,172 212,172 Q 255,172 290,167 Q 322,158 344,142 Q 360,124 362,100 Q 362,78 350,62 Q 334,48 308,42 Q 278,36 245,35 Q 212,34 180,36 Q 150,38 122,44 Q 98,50 80,58 Q 68,60 60,62 Z";

const CHICKEN_WING =
  "M 168,50 Q 188,26 218,20 Q 248,16 262,36 Q 248,44 225,42 Q 202,44 182,46 Z";

const CHICKEN_BEAK = "M 12,91 L 0,85 L 0,99 Z";

const CHICKEN_COMB =
  "M 26,64 Q 20,52 24,40 Q 28,30 22,20 Q 30,30 34,20 Q 38,30 32,40 Q 36,52 30,64";

const CHICKEN_LEGS = [
  "M 104,162 L 102,196 L 116,196 L 118,162 Z",
  "M 120,162 L 118,196 L 132,196 L 134,162 Z",
  "M 308,162 L 306,196 L 320,196 L 322,162 Z",
  "M 324,162 L 322,196 L 336,196 L 338,162 Z",
];

const CHICKEN_PRIMALS: PrimalRegion[] = [
  {
    id: "breast",
    label: "Breast",
    color: "#e8c03a",
    points: "130,52 270,44 268,115 230,122 185,120 135,110",
    labelX: 200,
    labelY: 80,
    cutIds: ["whole-chicken", "chicken-breast"],
    subprimals: ["Airline Breast", "Supreme", "Breast Fillet", "Tenderloin"],
    description: "The premium white meat. Airline breast (with drumette attached) is fine dining standard. Moist when cooked 63°C internal. Overcooks rapidly — precision essential.",
    anatomy: { tenderness: 8, marbling: "none", collagen: "none" },
    cooking: { methods: ["pan_sear", "sous_vide", "roast"] },
  },
  {
    id: "wing",
    label: "Wing",
    color: "#e8763a",
    points: "168,50 262,36 250,55 178,52",
    labelX: 215,
    labelY: 42,
    cutIds: ["chicken-wings"],
    subprimals: ["Drumette", "Mid-wing (Flat)", "Wing Tip"],
    description: "Three sections: drumette, flat, and tip. Tip is stock-only. Drumette is used in airline breast. Wings are high-yield when cooked as a serve — popular bar/casual item.",
    anatomy: { tenderness: 6, marbling: "low", collagen: "medium" },
    cooking: { methods: ["fry", "roast", "grill"] },
  },
  {
    id: "maryland",
    label: "Maryland",
    shortLabel: "Leg",
    color: "#7ad43a",
    points: "268,44 342,48 362,82 362,108 342,128 315,150 268,152 268,118",
    labelX: 318,
    labelY: 90,
    cutIds: ["chicken-maryland", "chicken-thigh"],
    subprimals: ["Thigh", "Drumstick", "Boned Thigh", "Thigh Fillet"],
    description: "Thigh and drumstick. Richest flavour on the bird. Forgiving in the oven — high fat content protects from drying. Boned thigh is versatile for stuffing and roulades.",
    anatomy: { tenderness: 7, marbling: "medium", collagen: "medium" },
    cooking: { methods: ["roast", "braise", "confit"] },
  },
  {
    id: "back",
    label: "Back",
    color: "#9a4ad4",
    points: "135,110 268,118 268,160 200,168 136,158",
    labelX: 200,
    labelY: 144,
    cutIds: [],
    subprimals: ["Carcass", "Oyster", "Pope's Nose"],
    description: "The dorsal section. Minimal usable meat. The oyster (on each side of the backbone) is the most flavourful piece — often left on the carcass by mistake. Stock primary use.",
    anatomy: { tenderness: 3, marbling: "low", collagen: "high" },
    cooking: { methods: ["stock", "braise"] },
  },
];

// ─── Fish / Round Fish (440×160) ───────────────────────────────────────────────

const FISH_BODY =
  "M 48,80 Q 28,78 14,68 Q 4,58 8,45 Q 14,34 28,30 Q 44,28 65,36 Q 85,26 130,18 Q 180,10 235,8 Q 290,6 340,12 Q 385,18 412,36 Q 430,52 432,80 Q 430,108 412,124 Q 385,142 340,148 Q 290,154 235,152 Q 180,150 130,142 Q 85,134 65,124 Q 44,132 28,130 Q 14,126 8,115 Q 4,102 14,92 Q 28,82 48,80 Z";

const FISH_TAIL =
  "M 428,80 Q 444,62 456,48 Q 454,80 456,112 Q 444,98 428,80 Z";

const FISH_PRIMALS: PrimalRegion[] = [
  {
    id: "head",
    label: "Head",
    shortLabel: "Head",
    color: "#9a4ad4",
    points: "28,30 85,22 88,80 85,138 28,130 14,115 8,80 14,68",
    labelX: 48,
    labelY: 80,
    cutIds: [],
    subprimals: ["Head", "Collar", "Cheek", "Tongue"],
    description: "Often discarded, rarely optimised. Collar (behind the head) is a premium slow-cook cut. Cheeks are a fine dining treat. The whole head makes exceptional stock and ramen broth.",
    anatomy: { tenderness: 5, marbling: "medium", collagen: "high" },
    cooking: { methods: ["stock", "braise", "roast"] },
  },
  {
    id: "upper-fillet",
    label: "Upper Fillet",
    shortLabel: "Fillet",
    color: "#3ab4d4",
    points: "85,22 340,12 410,36 430,80 88,80",
    labelX: 265,
    labelY: 45,
    cutIds: ["salmon-side", "snapper-fillet"],
    subprimals: ["Fillet", "Loin", "Tail Portion", "Pin Bone Section"],
    description: "Primary yield. The loin section (mid-fillet, above lateral line) gives the most consistent portions. Tail thins out — portion separately or cure/smoke.",
    anatomy: { tenderness: 9, marbling: "medium", collagen: "none" },
    cooking: { methods: ["pan_sear", "grill", "ceviche"] },
  },
  {
    id: "belly",
    label: "Belly",
    shortLabel: "Belly",
    color: "#d44a9a",
    points: "88,80 430,80 410,124 340,148 85,138",
    labelX: 265,
    labelY: 116,
    cutIds: [],
    subprimals: ["Belly Flap", "Lower Fillet", "Belly Portion"],
    description: "Below the lateral line. Fattier on oily fish (salmon, tuna). Salmon belly is a prized secondary — sear hot and serve as a special. Thinner than the loin — portion or trim accordingly.",
    anatomy: { tenderness: 8, marbling: "high", collagen: "none" },
    cooking: { methods: ["pan_sear", "cure", "sashimi"] },
  },
  {
    id: "tail",
    label: "Tail",
    color: "#e8c03a",
    points: "410,36 428,80 410,124 435,80",
    labelX: 418,
    labelY: 80,
    cutIds: [],
    subprimals: ["Tail Section", "Tail Portion"],
    description: "Tapers sharply — prone to overcooking if portioned same thickness as loin. Cure or smoke tail sections, or portion very thick to compensate for taper.",
    anatomy: { tenderness: 6, marbling: "low", collagen: "none" },
    cooking: { methods: ["cure", "smoke", "stock"] },
  },
];

// ─── Master export ──────────────────────────────────────────────────────────────

export const ANIMAL_DIAGRAMS: AnimalDiagram[] = [
  {
    id: "beef",
    label: "Beef",
    icon: "🐄",
    viewBox: "0 0 480 210",
    bodyPath: BEEF_BODY,
    legPaths: BEEF_LEGS,
    primals: BEEF_PRIMALS,
    operationalNote: "Always work at 1–3°C for cleanest portions. Seam butchery follows natural muscle planes — never fight the meat.",
    totalCutsLabel: "8 primals · 40+ secondary cuts",
  },
  {
    id: "pork",
    label: "Pork",
    icon: "🐖",
    viewBox: "0 0 460 200",
    bodyPath: PORK_BODY,
    legPaths: PORK_LEGS,
    accentPaths: [PORK_TAIL],
    primals: PORK_PRIMALS,
    operationalNote: "Skin management is critical — always plan for crackling vs. non-crackling applications before butchery.",
    totalCutsLabel: "5 primals · 25+ secondary cuts",
  },
  {
    id: "lamb",
    label: "Lamb",
    icon: "🐑",
    viewBox: "0 0 440 195",
    bodyPath: LAMB_BODY,
    legPaths: LAMB_LEGS,
    primals: LAMB_PRIMALS,
    operationalNote: "French trimming racks is time-intensive — factor labour cost into GP calculations. Shank has the highest flavour-to-cost ratio on the carcase.",
    totalCutsLabel: "5 primals · 20+ secondary cuts",
  },
  {
    id: "chicken",
    label: "Chicken",
    icon: "🐔",
    viewBox: "0 0 380 180",
    bodyPath: CHICKEN_BODY,
    legPaths: CHICKEN_LEGS,
    accentPaths: [CHICKEN_WING, CHICKEN_BEAK, CHICKEN_COMB],
    primals: CHICKEN_PRIMALS,
    operationalNote: "The oyster — two small muscles on each side of the backbone — is the most flavourful piece. Never leave it on the carcass.",
    totalCutsLabel: "4 zones · 15+ secondary cuts",
  },
  {
    id: "fish",
    label: "Fish",
    icon: "🐟",
    viewBox: "0 0 460 160",
    bodyPath: FISH_BODY,
    legPaths: [],
    accentPaths: [FISH_TAIL],
    primals: FISH_PRIMALS,
    operationalNote: "Pin bones run diagonally — always pull at the natural angle, never straight up. Skin must be bone-dry before searing.",
    totalCutsLabel: "4 sections · round fish",
  },
];

export function getAnimalDiagram(id: string): AnimalDiagram | undefined {
  return ANIMAL_DIAGRAMS.find(d => d.id === id);
}

export function getPrimalRegion(animalId: string, primalId: string): PrimalRegion | undefined {
  return getAnimalDiagram(animalId)?.primals.find(p => p.id === primalId);
}
