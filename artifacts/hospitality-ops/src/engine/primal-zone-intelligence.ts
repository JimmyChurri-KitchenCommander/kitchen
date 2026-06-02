// ─── Primal Zone Intelligence Layer ───────────────────────────────────────────
//
// Presentation-layer enrichment only.
// NO engine imports. NO geometry. NO rendering.
// Keyed by "animalId:zoneId" — add entries here without touching engine files.
//
// Fields:
//   primalName       — chef/trade name for the cut
//   yieldRange       — expected yield from the primal weight
//   textureProfile   — muscle-fibre assessment: tender / medium / tough
//   fatDistribution  — where and how fat sits in this zone
//   cookingMethods   — ranked best-first for the zone
//   fabricationNotes — chef-language instruction for breaking this zone down
//   failureRisks     — the most common errors on the bench

import type { AnimalId } from "./primal-engine";

export type TextureProfile = "tender" | "medium" | "tough";

export interface ZoneIntelligence {
  readonly primalName:       string;
  readonly yieldRange:       string;
  readonly textureProfile:   TextureProfile;
  readonly fatDistribution:  string;
  readonly cookingMethods:   readonly string[];
  readonly fabricationNotes: string;
  readonly failureRisks:     readonly string[];
}

type IntelKey = `${AnimalId}:${string}`;

const INTEL: Partial<Record<IntelKey, ZoneIntelligence>> = {

  // ── COW ──────────────────────────────────────────────────────────────────────

  "cow:head": {
    primalName:       "Head / Cheeks",
    yieldRange:       "~40%",
    textureProfile:   "tough",
    fatDistribution:  "Minimal intramuscular fat; gelatin-rich connective tissue throughout",
    cookingMethods:   ["Braise", "Stock", "Head cheese", "Cheek roast"],
    fabricationNotes: "Remove palate and salivary glands before any cooking. Cheeks are the prize — seam them out along the masseter and remove all silverskin. Split the skull for marrow access.",
    failureRisks:     [
      "Salivary gland left in — contaminates the braise with off-flavour",
      "Cheeks not trimmed of silverskin — they seize and toughen under heat",
    ],
  },

  "cow:chuck": {
    primalName:       "Chuck Roll / Flat Iron",
    yieldRange:       "72–78%",
    textureProfile:   "medium",
    fatDistribution:  "Heavy fat pockets between intercostal muscles; well-marbled eye",
    cookingMethods:   ["Braise", "Slow roast", "Grind", "Sous vide"],
    fabricationNotes: "Seam butchery is the key skill here. Follow the natural fat seams to isolate the flat iron (infraspinatus) — it runs parallel to the blade bone. Chuck roll eye separates cleanly from the under-blade once the blade is removed.",
    failureRisks:     [
      "Over-trimming the flat iron — it loses the silverskin that holds it together in service",
      "Chuck roll eye left with excessive sinew — causes shrinkage and uneven slicing",
    ],
  },

  "cow:brisket": {
    primalName:       "Brisket (Point + Flat)",
    yieldRange:       "68–74%",
    textureProfile:   "tough",
    fatDistribution:  "Thick ventral fat cap on top; intercalated fat between point and flat",
    cookingMethods:   ["Low-and-slow smoke", "Braise", "Corned beef cure"],
    fabricationNotes: "Leave the fat cap intact — it renders down into the flat during long cooks and keeps it from drying out. The point and flat are joined by a fat seam; keep them together for smoking, separate only for service or specific preps.",
    failureRisks:     [
      "Splitting point from flat before smoking — flat dries out without the fat buffer",
      "Trimming fat cap below 6mm — brisket stalls and seizes in the final cook window",
    ],
  },

  "cow:rib": {
    primalName:       "Ribeye / Prime Rib",
    yieldRange:       "75–80%",
    textureProfile:   "tender",
    fatDistribution:  "Heavy marbling throughout the longissimus; thick ribeye cap (spinalis dorsi)",
    cookingMethods:   ["Roast", "Grill", "Dry-age", "Reverse sear"],
    fabricationNotes: "The spinalis dorsi (ribeye cap) is the most flavourful muscle on the animal — decide at breakdown whether to keep it attached or remove it for separate portioning. Chine removal before roasting is non-negotiable; saw parallel to the vertebrae, not through them.",
    failureRisks:     [
      "Over-trimming the ribeye cap — you lose the most expensive muscle on the primal",
      "Chine saw run too deep — damages the eye muscle and causes blowout on portioning",
    ],
  },

  "cow:plate": {
    primalName:       "Plate Short Ribs",
    yieldRange:       "60–68%",
    textureProfile:   "tough",
    fatDistribution:  "Thick intercostal fat between each rib; moderate marbling in the meat seam",
    cookingMethods:   ["Braise", "Low-and-slow smoke", "Korean galbi cure"],
    fabricationNotes: "Separate rib-by-rib for clean service portions. Remove intercostal meat and membrane from the bone side before cooking — the membrane turns to rubber and blocks smoke penetration. Short rib yield is low; account for it in cost before committing the primal.",
    failureRisks:     [
      "Membrane left on the bone side — blocks smoke and creates unpleasant texture",
      "Skipping intercostal removal on individual ribs — uneven thickness causes inconsistent cook",
    ],
  },

  "cow:short_loin": {
    primalName:       "Strip Loin / Tenderloin",
    yieldRange:       "78–84%",
    textureProfile:   "tender",
    fatDistribution:  "Fine distributed marbling in the strip; near-zero fat in the tenderloin",
    cookingMethods:   ["Grill", "Roast", "Dry-age", "Sauté"],
    fabricationNotes: "The psoas major (tenderloin) runs along the inside of the spine — separate it by following the vertebral arch with your boning knife. Keep the chain meat (the thin strip running alongside the tenderloin) or specify its use before fabrication; it's often trimmed to grind but has value as a tasting cut.",
    failureRisks:     [
      "Chain meat left on the tenderloin — causes uneven portioning and presentation issues",
      "Silver skin on the tenderloin not fully removed — it contracts under heat and bows the fillet",
    ],
  },

  "cow:flank": {
    primalName:       "Flank Steak",
    yieldRange:       "65–72%",
    textureProfile:   "medium",
    fatDistribution:  "Minimal intramuscular fat; thin surface fat cap only",
    cookingMethods:   ["Grill", "Braise", "Slice thin for stir-fry", "Marinade and sear"],
    fabricationNotes: "Grain direction is everything on flank. Before cooking, identify which way the long muscle fibres run and commit to cutting perpendicular to them at service. A light score on the surface helps marinades penetrate. Remove the silverskin on the underside — it curls the steak under heat.",
    failureRisks:     [
      "Cutting with the grain at service — makes an otherwise serviceable cut completely unacceptable",
      "Silverskin not removed — causes the steak to bow and cook unevenly on the grill",
    ],
  },

  "cow:round": {
    primalName:       "Top / Eye / Bottom Round",
    yieldRange:       "70–76%",
    textureProfile:   "medium",
    fatDistribution:  "Lean with light seam fat between the three primary muscles",
    cookingMethods:   ["Roast", "Braise", "Cure", "Slice thin for tartare"],
    fabricationNotes: "The round separates into three distinct muscles along natural fat seams: top round (inside), eye of round (the cylinder), and bottom round (knuckle side). Eye of round is the easiest seam separation — follow the fat line and it peels clean. All three are lean and unforgiving of high dry heat.",
    failureRisks:     [
      "High-heat dry roast without rest — lean mass seizes rapidly and moisture is lost permanently",
      "Eye of round not rested on a rack — steam from the bottom causes texture loss on the underside",
    ],
  },

  "cow:fore_shank": {
    primalName:       "Fore Shank / Osso Buco",
    yieldRange:       "55–62%",
    textureProfile:   "tough",
    fatDistribution:  "Collagen-dominant; very little intramuscular fat — all yield comes from gelatin conversion",
    cookingMethods:   ["Braise", "Osso buco", "Stock", "Slow roast"],
    fabricationNotes: "Cross-cut at 4–5 cm for classic osso buco presentation. Expose the marrow on both cut faces before service — it's part of the dish. Tie each cross-cut with butcher's twine to hold the meat against the bone during the long braise.",
    failureRisks:     [
      "Aggressive sawing damages the marrow cavity — it collapses and is lost in the braise liquid",
      "No twine — shank meat falls away from the bone and the portion loses its identity",
    ],
  },

  "cow:hind_shank": {
    primalName:       "Hind Shank",
    yieldRange:       "55–62%",
    textureProfile:   "tough",
    fatDistribution:  "Higher collagen than the fore shank; gelatin conversion is excellent in long braises",
    cookingMethods:   ["Braise", "Stock reduction", "Slow roast", "Confit"],
    fabricationNotes: "Separate cleanly from the round before braising — the tendon attachment point tears if the shank is not severed first. For stock, split the bone lengthwise to maximise marrow extraction. Hind shank is heavier than fore and suits larger format braises.",
    failureRisks:     [
      "Tendon attachment left intact — tears on separation and introduces bone fragments",
      "Under-braised — hind shank has denser collagen and needs more time than fore to convert",
    ],
  },

  // ── PIG ──────────────────────────────────────────────────────────────────────

  "pig:head": {
    primalName:       "Pig Head / Brawn",
    yieldRange:       "~40%",
    textureProfile:   "tough",
    fatDistribution:  "Gelatin-rich skin with subcutaneous fat; ear cartilage adds texture to brawn",
    cookingMethods:   ["Brawn / head cheese", "Stock", "Slow roast whole", "Rillette"],
    fabricationNotes: "Remove eyes and salivary glands before cooking — they carry off-flavour and must not be in the braise. Split the head at the crown with a cleaver for even cooking. Ears, tongue, and cheeks should all be used; waste is a failure here.",
    failureRisks:     [
      "Salivary glands left in — they give a sour, off note that ruins the whole brawn",
      "Head not split — uneven heat penetration means the centre overcooks before the cheeks are done",
    ],
  },

  "pig:jowl": {
    primalName:       "Jowl / Guanciale",
    yieldRange:       "65–70%",
    textureProfile:   "medium",
    fatDistribution:  "Thick subcutaneous fat seam; moderate marbling in the muscle beneath",
    cookingMethods:   ["Dry cure (guanciale)", "Smoke", "Braise", "Render for lard"],
    fabricationNotes: "For guanciale: trim to a clean triangle, removing the lymph node completely before cure. Apply salt and pepper cure generously — fat needs deeper penetration than muscle. Hang at 12–15°C for a minimum of three weeks. The jowl is smaller than belly so cure ratios need adjusting.",
    failureRisks:     [
      "Lymph node left in the cure — it does not cure properly and creates a bitter pocket",
      "Cure applied too lightly to the fat face — undersalted fat turns rancid before it cures",
    ],
  },

  "pig:shoulder": {
    primalName:       "Boston Butt / Shoulder",
    yieldRange:       "70–76%",
    textureProfile:   "medium",
    fatDistribution:  "Heavy marbling for pork; money muscle is well-laced with intramuscular fat",
    cookingMethods:   ["Low-and-slow smoke", "Braise", "Mince", "Slow roast"],
    fabricationNotes: "Identify and protect the money muscle — the cylindrical muscle running along the front face of the butt. It is the most tender, most marbled part of the shoulder and should be kept whole if serving pulled or sliced. Blade shoulder contains a flat bone; remove before rolling or mince work.",
    failureRisks:     [
      "Money muscle destroyed in the pull — losing it wastes the most valuable part of the primal",
      "Blade fragment left in mince — safety issue and a service failure",
    ],
  },

  "pig:loin": {
    primalName:       "Pork Loin",
    yieldRange:       "75–82%",
    textureProfile:   "tender",
    fatDistribution:  "Lean muscle with a thin back fat cap; minimal intramuscular fat",
    cookingMethods:   ["Roast", "Grill", "Cure (back bacon)", "Sous vide", "Pan sear"],
    fabricationNotes: "Trim back fat cap to 6mm — enough to baste the loin during roasting but not enough to go rubbery. Chine removal is essential before portioning into chops. The tenderloin runs alongside the loin inside the ribcage and should be removed separately — it finishes cooking faster.",
    failureRisks:     [
      "Overcooking — lean mass with no fat buffer dries out rapidly above 68°C internal",
      "Tenderloin cooked at the same rate as the loin — it becomes dry and stringy before the loin is done",
    ],
  },

  "pig:belly": {
    primalName:       "Pork Belly",
    yieldRange:       "68–74%",
    textureProfile:   "medium",
    fatDistribution:  "Alternating strata of fat and muscle — the layers are what define the product",
    cookingMethods:   ["Cure and smoke (bacon)", "Braise", "Slow roast (crackling)", "Confit"],
    fabricationNotes: "Score the rind in a tight 1cm crosshatch before any dry heat application — this allows fat to render and gives even crackling coverage. For bacon cure: brine or dry cure with the rind on, remove only after slicing. Keep the belly flat under weight during cure to prevent curling.",
    failureRisks:     [
      "Rind not scored — crackling forms unevenly and does not pull away cleanly",
      "Cure applied unevenly — under-cured patches develop off-flavour or remain effectively raw",
    ],
  },

  "pig:ham": {
    primalName:       "Ham (Leg)",
    yieldRange:       "72–78%",
    textureProfile:   "medium",
    fatDistribution:  "Lean muscle with seam fat pockets; moderate subcutaneous fat cap",
    cookingMethods:   ["Roast", "Cure and smoke", "Sous vide", "Air dry (prosciutto)"],
    fabricationNotes: "Remove the aitch bone first — it unlocks the leg for flat cure penetration and rolling. H-bone removal follows: work your knife around the femur head and pull the bone cleanly. For prosciutto-style cures, the bone stays in — curing times extend to 12+ months accordingly.",
    failureRisks:     [
      "Aitch bone splintered from wrong removal angle — fragments end up in the finished product",
      "H-bone not fully freed — causes uneven salting and the cure cannot penetrate the joint pocket",
    ],
  },

  "pig:hind_hock": {
    primalName:       "Hind Hock / Trotter",
    yieldRange:       "55–60%",
    textureProfile:   "tough",
    fatDistribution:  "Gelatin and collagen dominant; very little muscle — yield is all texture",
    cookingMethods:   ["Braise", "Cure and smoke", "Stock", "Confit"],
    fabricationNotes: "Separate the trotter at the knuckle joint — do not saw through bone. Score through the skin in a ring at the joint and pop it clean with a twist. For service, debone the braised hock and press it in clingfilm for a neat portion. Skin must be left on for crackling applications.",
    failureRisks:     [
      "Membrane not scored before braise — meat shrinks dramatically and pulls away unevenly",
      "Sawn through the knuckle — bone splinters contaminate the braise and the final dish",
    ],
  },

  // ── CHICKEN ──────────────────────────────────────────────────────────────────

  "chicken:crown": {
    primalName:       "Crown / Neck",
    yieldRange:       "45–55%",
    textureProfile:   "tough",
    fatDistribution:  "Minimal intramuscular fat; skin-on neck has a useful fat layer for stock body",
    cookingMethods:   ["Stock", "Bone broth", "Crown roast (both sides bone-in)"],
    fabricationNotes: "Skin and halve the neck before stock — it releases collagen faster. If serving a crown roast, leave the wishbone in for structural integrity and remove it only at service. The pope's nose (parson's nose) is attached here — it has a high fat content and adds richness to stock.",
    failureRisks:     [
      "Crop not fully removed at processing — if any remains it contaminates the entire stock batch",
      "Neck split too roughly — bone fragments enter the stock and create a gritty texture",
    ],
  },

  "chicken:breast": {
    primalName:       "Supreme / Breast Fillet",
    yieldRange:       "78–85%",
    textureProfile:   "tender",
    fatDistribution:  "Very lean white muscle — almost no intramuscular fat whatsoever",
    cookingMethods:   ["Roast", "Grill", "Sauté", "Poach", "Sous vide"],
    fabricationNotes: "Remove the supreme by running your knife along the keel bone from neck end to tail, keeping the blade flat against the ribcage. Keep the first wing joint (drum) attached for a classic supreme presentation. Remove the tendon from the tender (small fillet) before cooking — it contracts and toughens.",
    failureRisks:     [
      "Drying out — no intramuscular fat means zero margin for overcooking; finish at 65–68°C",
      "Tender tendon left in — it seizes under heat and creates a rubbery strip through the fillet",
    ],
  },

  "chicken:back": {
    primalName:       "Back / Carcass / Oyster",
    yieldRange:       "55–65%",
    textureProfile:   "medium",
    fatDistribution:  "Oyster pockets are richly marbled dark meat; back muscle itself is lean",
    cookingMethods:   ["Stock", "Spatchcock", "Half chicken roast", "Oyster extraction"],
    fabricationNotes: "The oysters sit in a socket on the ilium (pelvic bone) — this is the most flavourful piece on the bird. Detach them by running a boning knife around the socket edge and popping them free. For stock, roast the backs at 200°C for 25 minutes first — dark roasted bones give a richer, deeper stock.",
    failureRisks:     [
      "Oyster left on the carcass — the most prized dark-meat morsel on the bird is wasted",
      "Stock started with raw backs — lighter colour and thinner body than roasted-back stock",
    ],
  },

  "chicken:wing": {
    primalName:       "Wing (Drummette / Flat / Tip)",
    yieldRange:       "70–78%",
    textureProfile:   "medium",
    fatDistribution:  "High skin-to-bone ratio; skin renders into a fat baste during cooking",
    cookingMethods:   ["Fry", "Grill", "Roast", "Braise", "Confit"],
    fabricationNotes: "Separate at both joints — drummette from flat, flat from tip — by finding the joint with your thumb and cutting through the cartilage, not through bone. Tips go straight to stock. Score the drummette skin if frying for even rendering. Dry-brine wings overnight for maximum skin crispness.",
    failureRisks:     [
      "Cutting through bone instead of joint — bone fragments in the finished dish",
      "Wet wing into hot oil — steam prevents crisping and oil spits dangerously",
    ],
  },

  "chicken:thigh": {
    primalName:       "Thigh",
    yieldRange:       "75–82%",
    textureProfile:   "tender",
    fatDistribution:  "Well-marbled dark muscle; visible fat seams on the underside",
    cookingMethods:   ["Roast", "Grill", "Braise", "Confit", "Sous vide"],
    fabricationNotes: "For boneless thighs: lay skin-side down and run your boning knife along the femur from end to end. Scrape the meat off in one pull, keeping the skin intact. Trim the excess fat pad underneath without removing all of it — that fat is what keeps thighs forgiving under heat.",
    failureRisks:     [
      "Femur fragment from aggressive deboning — safety failure; use a dedicated boning knife",
      "Skin punctured during debone — loses structural hold and tears open during cooking",
    ],
  },

  "chicken:drumstick": {
    primalName:       "Drumstick",
    yieldRange:       "70–76%",
    textureProfile:   "medium",
    fatDistribution:  "Dark muscle laced with tendon; skin provides exterior fat basting",
    cookingMethods:   ["Roast", "Grill", "Braise", "Confit", "Fry"],
    fabricationNotes: "Pull the tendons on the raw bird before any cooking — grip each tendon end at the foot joint and yank with a cloth for purchase. This gives a clean, pull-free eating experience. French-trim the knuckle end for presentation: score the skin in a ring and push the meat upward to expose the bone.",
    failureRisks:     [
      "Tendons left in — they contract during cooking and make the drumstick difficult to eat cleanly",
      "Knuckle cartilage left at the serving end — creates an unpleasant mouthful on the first bite",
    ],
  },

  // ── LAMB ─────────────────────────────────────────────────────────────────────

  "lamb:head": {
    primalName:       "Lamb Head",
    yieldRange:       "~35%",
    textureProfile:   "tough",
    fatDistribution:  "Gelatin-rich cartilage and skin; cheek muscle has light marbling",
    cookingMethods:   ["Roast whole", "Braise", "Stock", "Cheek extraction"],
    fabricationNotes: "Split the skull cleanly with a cleaver — two blows along the centre line. Remove the eyes separately; they are kept for specific preparations or discarded. Cheeks are worth extracting: seam out the masseter along the cheekbone and trim of silverskin. Brain is a specialty item — handle it separately.",
    failureRisks:     [
      "Salivary gland contamination in the braise — imparts an astringent, bitter quality",
      "Skull not fully split — brain cooks unevenly and eye socket fat can cause off-flavour",
    ],
  },

  "lamb:shoulder": {
    primalName:       "Shoulder",
    yieldRange:       "68–74%",
    textureProfile:   "medium",
    fatDistribution:  "Well-marbled for lamb; heavier fat deposits around the blade bone",
    cookingMethods:   ["Slow roast", "Braise", "Mince", "Tunnel boned and stuffed"],
    fabricationNotes: "Decision at breakdown: bone-in for maximum moisture retention during long roasting, or tunnel bone for easy carving. Tunnel boning follows the blade bone and humerus — the knife never leaves the bone surface. For French-trimmed shoulder: expose 3–4 cm of the shank bone, scraping it clean with the back of a knife.",
    failureRisks:     [
      "Blade chip on French-trim shoulder — from sawing too aggressively at the elbow joint",
      "Tunnel bone not following the bone — the muscle is cut instead of the seam, reducing yield",
    ],
  },

  "lamb:rack": {
    primalName:       "Rack (Best End)",
    yieldRange:       "72–78%",
    textureProfile:   "tender",
    fatDistribution:  "Fine fat cap over the eye; thin intercostal fat between ribs",
    cookingMethods:   ["Roast", "Grill", "French trim", "Herb crust"],
    fabricationNotes: "Chine bone removal is the critical step — saw the chine parallel to the vertebrae, not through the eye muscle. Score the fat cap in a diamond pattern before roasting. For a French-trimmed rack: score the meat between the rib bones at the 3cm mark and scrape the exposed bone section completely clean.",
    failureRisks:     [
      "Chine saw run too deep — cuts into the rack eye muscle, reducing portion quality",
      "Fat cap scored through to the meat — moisture is lost directly from the surface during roast",
    ],
  },

  "lamb:loin": {
    primalName:       "Loin / Saddle / Cannon",
    yieldRange:       "75–82%",
    textureProfile:   "tender",
    fatDistribution:  "Thin fat cover; silverskin runs along the full length of the loin eye",
    cookingMethods:   ["Grill", "Roast", "Noisette (rolled loin)", "Cannon (boneless eye)"],
    fabricationNotes: "To extract the cannon: work your boning knife along each side of the vertebrae, peeling the loin eye muscle off the bone in one long strip. Silverskin removal is non-negotiable — grip it with a cloth and run a flexible knife flat against the muscle surface. For noisette: leave the flap on and roll it around the cannon before tying.",
    failureRisks:     [
      "Silverskin left on the cannon — contracts under heat and bows the loin into a curl",
      "Noisette tied too tight — compressed fat cannot render and creates a rubbery outer layer",
    ],
  },

  "lamb:breast": {
    primalName:       "Breast (Flap)",
    yieldRange:       "60–68%",
    textureProfile:   "tough",
    fatDistribution:  "Heavy fat with layered muscle — fat-to-meat ratio is high",
    cookingMethods:   ["Slow braise", "Stuff and roll", "Slow roast", "Confit"],
    fabricationNotes: "Score the fat side in a crosshatch before rolling — it renders more completely during a long cook. Stuff and roll tightly with butcher's twine at 2cm intervals. The breast is inexpensive but labour-intensive; factor in the trimming and rolling time when pricing.",
    failureRisks:     [
      "Excessive fat rendering out of the roll during cook — if not tied tight, the roll collapses",
      "Under-braised — the muscle fibres are tough and need full collagen conversion; minimum 3 hours",
    ],
  },

  "lamb:leg": {
    primalName:       "Leg (Gigot)",
    yieldRange:       "70–78%",
    textureProfile:   "medium",
    fatDistribution:  "Lean muscle with natural seam fat pockets; thin external fat cap",
    cookingMethods:   ["Roast", "Grill (butterflied)", "Slow roast", "Cure"],
    fabricationNotes: "Tunnel bone by following the femur precisely with the tip of your boning knife — blade stays on bone the entire time. For butterflied leg: open along the natural seam lines to create an even thickness for fast grilling. The silverside seam separates cleanly and is the best starting point.",
    failureRisks:     [
      "Femur not fully freed at the ball-and-socket — the joint tears on extraction instead of popping",
      "Butterfly cut not following seams — creates uneven thickness that cannot cook uniformly",
    ],
  },

  "lamb:shank": {
    primalName:       "Shank",
    yieldRange:       "55–62%",
    textureProfile:   "tough",
    fatDistribution:  "Collagen-dominant with good gelatin conversion; very little intramuscular fat",
    cookingMethods:   ["Braise", "Osso buco style", "Slow roast", "Confit"],
    fabricationNotes: "French-trim the shank for presentation: score the skin and meat in a ring at the 5cm mark from the bottom and scrape the exposed bone completely clean with the back of a knife. Score the membrane in several places before braising — without this it tightens like a rubber band and pulls the meat away from the bone.",
    failureRisks:     [
      "Membrane not scored — severe shrinkage during braise, meat pulls up and looks underprepared",
      "French trim not cleaned thoroughly — blackened membrane on the bone looks unprofessional at service",
    ],
  },

  // ── FISH ─────────────────────────────────────────────────────────────────────

  "fish:head": {
    primalName:       "Head / Cheeks",
    yieldRange:       "~30%",
    textureProfile:   "tough",
    fatDistribution:  "Rich collagen around the jaw; eye socket fat adds body to stock",
    cookingMethods:   ["Roast whole", "Stock / fumet", "Cheek extraction", "Braised"],
    fabricationNotes: "Remove gills completely before stock — they are the single biggest source of bitterness in fish stock. Cut through the gill arch on both sides and pull the gill basket clear. Cheeks sit in a small socket on the jawbone; use the tip of a knife to pop them free — they are a delicacy on large fish like snapper or hapuku.",
    failureRisks:     [
      "Gills left in stock — one missed gill basket can make the entire fumet bitter and unusable",
      "Head added to stock without scaling — loose scales cloud the stock and affect texture",
    ],
  },

  "fish:collar": {
    primalName:       "Collar (Nape / Kama)",
    yieldRange:       "62–70%",
    textureProfile:   "medium",
    fatDistribution:  "Highest fat content on the fish; fat renders during high-heat cooking",
    cookingMethods:   ["Grill", "Broil / salamander", "Roast", "Yakitori-style"],
    fabricationNotes: "Separate the collar at the pectoral fin line with a clean downward cut through the spine. Season aggressively — the fat can carry a high salt load. Collar benefits from high heat applied quickly; it self-bastes from the abundant fat. Keep the pectoral fin on for presentation on premium service.",
    failureRisks:     [
      "Scale contamination from incomplete scaling — scales embed in the fat and are unpleasant to eat",
      "Collar cooked at low heat — fat does not render properly and the texture becomes greasy",
    ],
  },

  "fish:loin": {
    primalName:       "Loin / Fillet",
    yieldRange:       "78–86%",
    textureProfile:   "tender",
    fatDistribution:  "Clean white muscle in parallel flakes; lateral line carries a faint fat seam",
    cookingMethods:   ["Pan sear", "Poach", "Grill", "Steam", "Cure", "Ceviche", "Sashimi"],
    fabricationNotes: "Run your fillet knife along the spine from the collar to the tail in one long stroke, keeping the blade flat against the rib bones. Pin bones run along the lateral line — feel for them with your fingertip and pull each one with fish tweezers at the same angle they entered. Never pull against the grain — the flesh tears.",
    failureRisks:     [
      "Pin bone tear — pulling at the wrong angle shreds the fillet surface; always follow the bone angle",
      "Fillet knife angled away from the rib bones — loses yield and leaves meat on the frame",
    ],
  },

  "fish:belly": {
    primalName:       "Belly Flap",
    yieldRange:       "65–72%",
    textureProfile:   "tender",
    fatDistribution:  "Highest intramuscular fat on the fish — sashimi-grade on premium species",
    cookingMethods:   ["Grill", "Cure", "Sashimi / sushi", "Hot smoke"],
    fabricationNotes: "Trim the belly flap to an even thickness along its length — it tapers, so trim to the thinnest point for uniform cure or portion. Blood line runs along the spine side of the belly; remove it cleanly for premium preparations as it carries a strong iron flavour. Belly is often discarded — it is the most flavourful part.",
    failureRisks:     [
      "Blood line left in for premium cure or sashimi — strong iron flavour masks the natural sweetness",
      "Belly not trimmed to even thickness — thinner end over-cures while the thick end is under-salted",
    ],
  },

  "fish:tail": {
    primalName:       "Tail Portion",
    yieldRange:       "55–65%",
    textureProfile:   "medium",
    fatDistribution:  "Lean tail muscle with tighter, denser fibre structure than the loin",
    cookingMethods:   ["Roast", "Grill", "Braise", "Cross-cut portions"],
    fabricationNotes: "Cross-cut the tail into equal portions — the tail tapers so compensate by cutting thicker sections from the thinnest part. For roasting whole, truss the tail fin flat against the flesh to prevent burning. Tail muscle is denser than loin and benefits from slightly longer cook times or a gentler heat approach.",
    failureRisks:     [
      "Over-portioning the thin taper — the last tail sections are too thin and cook instantly, drying out",
      "Tail fin not protected during roasting — it chars before the flesh is cooked through",
    ],
  },
};

export function getZoneIntelligence(
  animalId: AnimalId,
  zoneId:   string,
): ZoneIntelligence | null {
  const key = `${animalId}:${zoneId}` as IntelKey;
  return INTEL[key] ?? null;
}
