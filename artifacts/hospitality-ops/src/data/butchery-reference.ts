export type TrimRecovery = {
  use: string;
  notes: string;
};

export type LabourIntensity = "low" | "medium" | "high" | "very-high";

export type CutEntry = {
  id: string;
  name: string;
  aka?: string[];
  primal: string;
  subprimal?: string;
  description: string;
  expectedYieldPercent: string;
  typicalPortionGrams: string;
  trimInstructions: string[];
  knifeTips: string[];
  commonMistakes: string[];
  cookingApplications: string[];
  menuApplications?: string[];
  labourIntensity?: LabourIntensity;
  gpSweetSpot?: string;
  shelfLife?: string;
  frenchName?: string;
  usName?: string;
  supplierTerminology?: string;
  trimRecovery: TrimRecovery[];
};

export type ProteinCategory = {
  id: string;
  label: string;
  cuts: CutEntry[];
  operationalNote?: string;
};

export const BUTCHERY_REFERENCE: ProteinCategory[] = [
  {
    id: "beef",
    label: "Beef",
    cuts: [
      {
        id: "striploin",
        name: "Striploin",
        aka: ["NY Strip", "Sirloin Strip", "Shell Loin"],
        primal: "Short Loin",
        description:
          "Long, relatively lean muscle with a consistent fat cap. Yields uniform steaks with good flavour. The chain muscle runs along one edge and should be removed before portioning.",
        expectedYieldPercent: "68–75%",
        typicalPortionGrams: "250–350g",
        trimInstructions: [
          "Remove the chain muscle running along the inner edge — keep for secondary use.",
          "Trim the fat cap to 4–5mm; do not remove entirely — fat carries flavour and protects during cooking.",
          "Remove silver skin from the underside using the tip of a flexible boning knife held flat to the muscle.",
          "Square off both ends before portioning for consistent visual presentation.",
        ],
        knifeTips: [
          "Use a long, smooth-bladed slicing knife for clean portion cuts — a single draw cut, not a sawing motion.",
          "Ensure the primal is cold (1–3°C) for cleanest cuts — warm muscle compresses under the blade.",
          "Portion perpendicular to the grain to maximise tenderness in the finished plate.",
          "Score the fat cap lightly before cooking to prevent curling.",
        ],
        commonMistakes: [
          "Cutting with the grain — produces chewy, tough steaks.",
          "Overtrimming the fat cap to zero — causes dry steaks and poor colour.",
          "Not removing the chain — tough sinew affects even cooking.",
          "Cutting portions at an angle — creates uneven thickness and inconsistent cooking.",
        ],
        cookingApplications: [
          "Chargrill, pan-sear, stone grill, BBQ",
          "Tataki (seared rare, chilled, sliced thin)",
          "Hot plate/teppanyaki",
        ],
        trimRecovery: [
          { use: "Staff meal / skewers", notes: "Chain muscle and end cuts — dice and marinate for skewers or staff lunch." },
          { use: "Beef mince / burgers", notes: "Trim pieces with good fat ratio — blend with other trimmings." },
          { use: "Beef ragu / bolognese", notes: "Smaller trim pieces with some fat — slow cook for depth of flavour." },
          { use: "Stock enrichment", notes: "Bones and sinew if available — add to stock pot for body." },
        ],
      },
      {
        id: "eye-fillet",
        name: "Eye Fillet",
        aka: ["Tenderloin", "Filet Mignon (tip end)"],
        primal: "Short Loin / Sirloin",
        description:
          "The most tender cut on the animal. Very low in fat and connective tissue. Runs under the backbone and does minimal work. Requires careful trimming of silver skin to avoid chewy results.",
        expectedYieldPercent: "65–72%",
        typicalPortionGrams: "180–220g",
        trimInstructions: [
          "Remove the chain (side muscle) — set aside for tartare or stir-fry.",
          "Strip all silver skin using a flexible boning knife held at a low angle against the muscle.",
          "Trim excess fat from the thick end (butt) — leave a thin veil only.",
          "Head, centre, and tail portions will cook at different rates — separate for precision service.",
        ],
        knifeTips: [
          "Hold silver skin taut with fingertips while the knife cuts away underneath — no pressure on the blade.",
          "Use a flexible boning knife for silver skin removal, not a rigid slicer.",
          "Portion the butt end slightly thinner to match the weight of centre cuts.",
          "Tail sections are best butterflied or used for tournedos.",
        ],
        commonMistakes: [
          "Leaving silver skin — causes the fillet to curl and shrink unevenly when cooked.",
          "Not separating head/centre/tail — uneven cooking across the whole fillet.",
          "Cutting too thin — loses the premium eating quality.",
          "Wasting the chain — excellent for tartare or stir-fry if handled correctly.",
        ],
        cookingApplications: [
          "Chargrill, pan-sear (then oven rest)",
          "Beef Wellington (centre cut)",
          "Beef tartare (chain and trim)",
          "Carpaccio",
        ],
        trimRecovery: [
          { use: "Beef tartare", notes: "Chain and tail trimmings — hand-chop fine. Do not mince." },
          { use: "Stir-fry / Asian dishes", notes: "Chain muscle — slice thin against the grain." },
          { use: "Beef Wellington scraps", notes: "End pieces — dice and fold into duxelles or force." },
        ],
      },
      {
        id: "rump",
        name: "Rump",
        aka: ["Round (partial)", "Rump Cap (Picanha)"],
        primal: "Round / Hip",
        description:
          "Full-flavoured, moderately tender cut from the hindquarter. Grain runs in multiple directions depending on the sub-muscle. Rump cap (picanha) is the prized outer piece with a defined fat cap.",
        expectedYieldPercent: "72–80%",
        typicalPortionGrams: "250–350g",
        trimInstructions: [
          "Identify the grain direction — rump has multiple muscles running in different directions. Separate along natural seams for best portioning.",
          "Trim fat cap to 3–5mm for steaks; leave thicker for whole roasting.",
          "Remove inter-muscular fat deposits between the main muscles.",
          "For rump cap (picanha), keep the fat cap intact and score in a crosshatch for presentation.",
        ],
        knifeTips: [
          "Seam butchery is key — use a boning knife along natural muscle seams rather than cutting across multiple muscles.",
          "Each seam muscle has its own grain direction — identify before portioning.",
          "For rump cap: score fat cap at 45°, then cross-hatch at 45° the other way.",
          "Cold muscle gives the cleanest portions — work at 1–3°C.",
        ],
        commonMistakes: [
          "Cutting across multiple muscle seams without following the grain — produces chewy, inconsistent steaks.",
          "Removing all fat — essential for flavour, especially on the cap.",
          "Confusing grain direction between the inner and outer muscles.",
        ],
        cookingApplications: [
          "Chargrill steaks, pan-sear, rump roast",
          "Picanha on skewer (churrasqueira style)",
          "Tagliata (grilled, rested, sliced thin across the grain)",
        ],
        trimRecovery: [
          { use: "Beef mince / burgers", notes: "Well-marbled trim — excellent for high-quality burger blend." },
          { use: "Beef stew / casserole", notes: "Tougher seam pieces — cube and braise." },
          { use: "Bulgogi or Korean BBQ", notes: "Thin-sliced trim pieces — marinade and quick-grill." },
        ],
      },
      {
        id: "oyster-blade",
        name: "Oyster Blade",
        aka: ["Flat Iron (US)", "Infraspinatus"],
        primal: "Chuck / Shoulder",
        description:
          "Tender, well-marbled muscle from the shoulder with a line of tough gristle running through its centre. Can be portioned either side of the gristle for flat iron steaks, or used whole for slow cooking.",
        expectedYieldPercent: "70–78%",
        typicalPortionGrams: "180–250g",
        trimInstructions: [
          "Remove surface sinew and silverskin from both faces.",
          "To make flat iron steaks: lay flat and use a thin, flexible knife to cut along the gristle plane — produces two clean halves.",
          "Gristle itself is unusable — discard or stock pot.",
          "Trim any exposed fat to a thin layer.",
        ],
        knifeTips: [
          "The gristle runs through the exact centre — feel it with your fingertip before cutting.",
          "Keep the knife almost horizontal when opening the muscle along the gristle.",
          "Work slowly — rushing tears the muscle rather than separating cleanly.",
        ],
        commonMistakes: [
          "Cutting through the gristle rather than along it — leaves chewy sinew in the steak.",
          "Not removing surface silver skin — causes curling when cooked hot.",
        ],
        cookingApplications: [
          "Flat iron steaks (hot and fast sear)",
          "Braised whole for pulled beef",
          "Sous vide, then sear",
        ],
        trimRecovery: [
          { use: "Beef pie / ragu", notes: "Gristle-adjacent trim — slow cook breaks down connective tissue beautifully." },
          { use: "Beef skewers", notes: "Clean trim pieces — cube and marinade." },
        ],
      },
      {
        id: "brisket",
        name: "Brisket",
        aka: ["Flat brisket", "Point brisket", "Packer brisket"],
        primal: "Brisket / Chest",
        description:
          "Large, well-worked chest muscle with significant fat cap and inter-muscular fat. Low-and-slow is essential. Two distinct muscles: the flat (leaner) and the point (fattier, more flavourful).",
        expectedYieldPercent: "55–65% cooked",
        typicalPortionGrams: "180–250g sliced",
        trimInstructions: [
          "For competition trim: take fat cap down to 6mm uniformly.",
          "Remove the hard fat node at the point-flat junction — it does not render.",
          "Separate point from flat along the fat seam if smoking separately.",
          "Score fat cap in a diamond pattern to aid penetration and bark formation.",
        ],
        knifeTips: [
          "Always slice against the grain — and the grain changes direction between the flat and the point. Rotate the meat.",
          "Use a long carving knife with a smooth, single drawing cut.",
          "Rest brisket for at least 1 hour before slicing to redistribute juices.",
          "Slice no thinner than 10mm for service — thinner slices lose moisture rapidly.",
        ],
        commonMistakes: [
          "Slicing with the grain — produces stringy, chewy results no matter how good the cook.",
          "Not resting long enough before slicing — moisture floods the board.",
          "Removing all fat before cooking — dry, flavourless result.",
        ],
        cookingApplications: [
          "Low-and-slow BBQ smoke (8–16 hours, 105–120°C)",
          "Braised brisket (Jewish-style, Korean galbi jjim)",
          "Corned beef",
          "Pastrami",
        ],
        trimRecovery: [
          { use: "Burnt ends", notes: "Point off-cuts and bark — cube and sauce for a bar snack or special." },
          { use: "Brisket hash / shepherd's pie", notes: "Cooked leftover pieces — dice and pan-fry with aromatics." },
          { use: "Beef tacos / sliders", notes: "Pulled/shredded trim — ideal for high-turnover service." },
          { use: "Stock / broth", notes: "Bones and rendering fat — excellent gelatin and flavour base." },
        ],
      },
      {
        id: "ribeye",
        name: "Ribeye",
        aka: ["Cube Roll", "Scotch Fillet", "Entrecôte"],
        primal: "Rib",
        frenchName: "Entrecôte",
        description:
          "The premium rib muscle with the highest natural marbling on the carcase. The spinalis dorsi (rib cap) curves around the eye and is the most prized secondary — intensely marbled and supremely tender. Fat runs in a characteristic eye pattern visible in cross-section.",
        expectedYieldPercent: "72–80%",
        typicalPortionGrams: "280–400g",
        labourIntensity: "medium" as LabourIntensity,
        trimInstructions: [
          "Trim the fat cap to 4–6mm — ribeye fat is self-basting during cooking. Never remove entirely.",
          "Separate the rib cap (spinalis dorsi) along the fat seam if portioning separately — it is the most valuable secondary cut on the carcase.",
          "Remove silverskin from the cap muscle surface using a flexible boning knife held flat.",
          "For tomahawk (bone-in): french-trim the rib bone back 8–10cm for presentation — scrape clean.",
          "Portion against the grain — the rib eye and cap have slightly different grain directions.",
        ],
        knifeTips: [
          "A sharp, long slicing knife is essential — the dense marbling resists a dull blade.",
          "Cold muscle (1–3°C) gives the cleanest cross-sections through the fat marbling.",
          "For bone-in tomahawk: locate the gap between rib bones with the knife tip before committing to the cut.",
          "Score the fat cap lightly (2mm deep) before cooking to prevent buckling on the grill.",
        ],
        commonMistakes: [
          "Over-trimming the fat cap — the marbled fat is the premium feature of ribeye. Leave at least 4mm.",
          "Confusing cap and eye grain direction — the spinalis has a different grain and cooks faster.",
          "Portioning at an angle — creates uneven thickness and inconsistent cooking from edge to centre.",
        ],
        cookingApplications: [
          "Chargrill or pan-sear, rested 3–5 min",
          "Tomahawk reverse sear (55°C oven, then grill blast)",
          "Tataki — seared rare, rested, sliced thin with ponzu",
          "Salt-crust roasted whole cube roll",
        ],
        trimRecovery: [
          { use: "Rib cap steaks (chef special)", notes: "Separate the spinalis along the seam — the most marbled piece on the carcase. High GP specialty item." },
          { use: "Premium beef mince / burgers", notes: "High-fat trim pieces — exceptional fat-to-lean ratio for restaurant-quality burgers." },
          { use: "Beef jus / stock", notes: "Rib bones from bone-in cuts — roast until dark, then simmer 6+ hours." },
          { use: "Staff meal", notes: "End pieces and oddly-shaped trim — sear hard and rest for a proper staff steak." },
        ],
      },
      {
        id: "t-bone",
        name: "T-Bone",
        aka: ["Porterhouse (when tenderloin >32mm)", "Club steak (small tenderloin)"],
        primal: "Short Loin",
        description:
          "A cross-section cut through the short loin containing both striploin and tenderloin separated by the T-shaped vertebra. When the tenderloin section exceeds 32mm in diameter it is classified as a Porterhouse. The two muscles cook at different rates — the tenderloin reaches temperature faster. A theatrical, classic steakhouse cut.",
        expectedYieldPercent: "75–82% usable meat",
        typicalPortionGrams: "450–700g (bone-in)",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Trim the striploin fat cap to 5mm — it will render and baste the meat during cooking.",
          "Remove the chain muscle if still attached on the tenderloin side.",
          "Square off the bone-side sinew using a thin boning knife.",
          "Portion between vertebrae — locate the disc gap with the knife tip before each cut.",
          "Score the fat cap lightly to prevent the strip side from curling on the grill.",
        ],
        knifeTips: [
          "Never cut through the vertebra bone — locate the natural gap between discs. The knife should pass through cartilage, not bone.",
          "Both muscles cook simultaneously — manage the tenderloin side away from peak heat.",
          "A long, smooth-bladed slicing knife gives the cleanest cross-cuts.",
        ],
        commonMistakes: [
          "Cutting through vertebra bone rather than the gap — damages the knife and produces dangerous bone fragments.",
          "Under-cooking the striploin while over-cooking the tenderloin — they cook at different rates.",
          "Not squaring off the portion — a T-bone with ragged edges looks unfinished at service.",
        ],
        cookingApplications: [
          "Chargrill (cook 60% strip-side-down first)",
          "Cast iron pan-sear with butter basting on the bone side",
          "Bistecca Fiorentina — large T-bone, cooked rare, sliced at the table",
        ],
        trimRecovery: [
          { use: "Share board / tableside theatre", notes: "Large T-bones sliced off the bone at the table — high-value guest experience." },
          { use: "Beef stock", notes: "Vertebra trim from butchering — long, low simmer produces gelatin-rich stock." },
        ],
      },
      {
        id: "chuck-roll",
        name: "Chuck Roll",
        aka: ["Blade Roll", "Chuck Eye Roll", "Neck Fillet"],
        primal: "Chuck / Shoulder",
        description:
          "Boneless, rolled muscle group from the neck and shoulder containing 4–6 distinct muscles running in different directions. High in collagen but with well-distributed fat — yields both slow-cook pieces and seam-butchered value steaks. Seam butchery is essential to unlock the different muscles.",
        expectedYieldPercent: "75–82%",
        typicalPortionGrams: "200–280g (steak) / 1–2kg (braising)",
        labourIntensity: "high" as LabourIntensity,
        trimInstructions: [
          "Identify muscle seams before cutting — chuck roll contains multiple muscles with different grain directions.",
          "Remove inter-muscular fat deposits between main muscles — they do not render in quick-cook applications.",
          "For chuck eye steaks: follow the central eye muscle seam, trimming surrounding muscles for a cleaner portion.",
          "For braising pieces: leave seams intact — collagen becomes gelatinous and provides body in the braise.",
          "Remove all silverskin from any exposed muscle surfaces intended for steaks.",
        ],
        knifeTips: [
          "Seam butchery is essential — work along natural fat planes with a flexible boning knife.",
          "The chuck roll has no consistent grain direction across the whole piece — check each muscle individually.",
          "For value steaks: thin-slice at 5–8mm against each muscle's grain for maximum tenderness.",
          "Keep the piece very cold (1–2°C) — the soft fat tears at higher temperatures.",
        ],
        commonMistakes: [
          "Cutting across multiple muscles without following seams — produces cross-grained, chewy steaks.",
          "Not identifying grain direction per seam muscle — the chuck eye grain runs differently to outer muscles.",
          "Using the whole roll for steaks without seaming — wastes the flavour advantage of surrounding muscles for slow cooking.",
        ],
        cookingApplications: [
          "Sous vide chuck eye steaks (56°C, 24 hours, then hard sear)",
          "Korean thin-sliced chuck (chadolbaegi — frozen thin, grilled)",
          "Braised chuck roll (red wine braise, 4–6 hours)",
          "Low-and-slow smoked chuck roll (12+ hours at 110°C)",
        ],
        trimRecovery: [
          { use: "Beef mince / burgers", notes: "High-collagen trim — excellent flavour and fat ratio for quality burgers." },
          { use: "Beef stew / pot roast", notes: "Off-cut seam muscles — cube and braise low-and-slow." },
          { use: "Beef stock", notes: "Sinew and collagen-rich trim — adds body and gelatin." },
        ],
      },
      {
        id: "short-ribs",
        name: "Short Ribs",
        aka: ["Jacob's Ladder (plate of 4–6 bones)", "Flanken Ribs (cross-cut)", "Beef Ribs"],
        primal: "Plate / Rib",
        description:
          "Sections of rib bone with attached intercostal meat and a thick cap of muscle. Extremely high in collagen and fat — only low-and-slow cooking transforms them. Jacob's ladder is a dramatic full plate of 4–6 bones. Flanken-cut (thin cross-cut across bones) is the Korean BBQ standard. Possibly the best value flavour-to-cost cut on the carcase.",
        expectedYieldPercent: "55–65% meat to bone",
        typicalPortionGrams: "300–500g (2 bones)",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Remove the silverskin membrane from the bone-facing side — it shrinks and toughens during cooking if left.",
          "Trim the fat cap to 8–10mm for bone-in cooking — the fat renders and bastes during long cooks.",
          "For flanken-cut (Korean): slice across the bones at 5mm thickness — use a band saw or a very heavy knife on a solid surface.",
          "Score the fat cap in a crosshatch before smoking to encourage bark formation.",
          "Remove any exposed periosteum (bone membrane) from cut ends.",
        ],
        knifeTips: [
          "The silverskin on the bone side is tough — slip a butter knife under a corner to lift, then grip with a dry cloth and pull.",
          "For flanken cuts: freeze slightly (–2°C) to resist the blade and give a cleaner cross-cut.",
          "Score fat with a thin, sharp knife — only 2–3mm deep to open the surface without exposing meat.",
        ],
        commonMistakes: [
          "Not removing the bone-side membrane — it creates a chewy, inedible texture that ruins the eating experience.",
          "Cooking too hot or too fast — short ribs need 8+ hours at 110–130°C to soften the collagen. Higher temps toughen the meat.",
          "Under-seasoning before a long cook — the large mass needs aggressive salt application to penetrate.",
        ],
        cookingApplications: [
          "Low-and-slow BBQ smoke (10–14 hours at 110°C)",
          "Braised short ribs (red wine, stock, aromatics — 4–6 hours)",
          "Korean galbi (marinated bone-in, chargrilled)",
          "Flanken-cut galbi jjim (Korean braised short rib)",
        ],
        trimRecovery: [
          { use: "Beef braising stock", notes: "Trim bones — roast until dark, then simmer 6–8 hours for intensely collagen-rich stock." },
          { use: "Burnt ends", notes: "Off-cuts from smoked short rib bark — cube and sauce for a bar snack special." },
          { use: "Beef tacos / sliders", notes: "Shredded braised short rib — high-value casual item from slow-cook carryover." },
        ],
      },
      {
        id: "skirt-steak",
        name: "Skirt Steak",
        aka: ["Inside Skirt", "Outside Skirt", "Romanian Tenderloin (outside)", "Arrachera"],
        primal: "Plate",
        description:
          "Two distinct muscles — the outside skirt (diaphragm, more tender and tubular) and the inside skirt (transverse abdominis, flatter and coarser). Both are intensely flavoured with a pronounced, visible grain. Must be marinated and sliced thin across the grain. The outside skirt is the one used by butchers for themselves — deep, savoury flavour.",
        expectedYieldPercent: "85–92%",
        typicalPortionGrams: "180–250g",
        labourIntensity: "medium" as LabourIntensity,
        trimInstructions: [
          "Remove the silverskin from the outer surface — the outside skirt has a thick membrane that must come off.",
          "Clean any attached fat pockets from the inside of the outside skirt (tubular muscle).",
          "Square off ragged edges for even cooking.",
          "For the inside skirt: remove inter-muscular fat deposits along the grain.",
          "Even out the thickness if the ends taper significantly — butterfly or fold and tie.",
        ],
        knifeTips: [
          "Always slice against the very strong grain — a single cross-cut turn after cooking transforms chewy into tender.",
          "Slice at 45° to the grain, 5–8mm thick — the thick muscle fibres require a cross-cut to shorten them.",
          "A sharp, smooth-edged carving knife is essential — serrated blades shred the fibres rather than slice.",
        ],
        commonMistakes: [
          "Slicing with the grain — produces stringy, almost unchewable results regardless of cook quality.",
          "Cooking past medium — skirt becomes tough and dry above 58°C internal. Keep it pink.",
          "Not resting before slicing — the juices redistribute over 3–5 minutes. Skipping this visibly affects the plate.",
        ],
        cookingApplications: [
          "Carne asada (marinated, high-heat grill, sliced thin)",
          "Fajitas (sliced and served sizzling on a hot plate)",
          "Korean bulgogi (thin-sliced, marinated, high-heat grill)",
          "Chimichurri skirt steak (Argentinian asado style)",
        ],
        trimRecovery: [
          { use: "Beef tacos / burrito filling", notes: "Trim pieces — marinate and grill for high-turnover casual applications." },
          { use: "Beef stir-fry", notes: "Thin-sliced ends and off-cuts — the strong flavour carries through bold sauces." },
        ],
      },
      {
        id: "hanger-steak",
        name: "Hanger Steak",
        aka: ["Onglet", "Hanging Tender", "Butcher's Secret"],
        primal: "Plate",
        frenchName: "Onglet",
        description:
          "The diaphragm's supporting muscle, literally hanging from the last rib — hence the name. Only one per animal. Intensely beefy flavour, similar texture to skirt. Has a central sinew running the length of the muscle that must be removed. The 'butcher's secret' — historically kept by butchers for themselves due to the exceptional flavour.",
        expectedYieldPercent: "70–78%",
        typicalPortionGrams: "180–240g (whole or split lobes)",
        labourIntensity: "medium" as LabourIntensity,
        trimInstructions: [
          "Remove all exterior silverskin and membrane — there is significant surface sinew to clean.",
          "The central sinew (inedible) runs along the length of the hanger — cut along either side to produce two clean lobes.",
          "Remove any attached fat from the inner faces of each lobe.",
          "Trim the thin tail ends evenly — they cook faster than the thicker body.",
          "Temper the muscle 20 min before cooking — it is prone to tensing when cooked directly from cold.",
        ],
        knifeTips: [
          "Use a flexible boning knife to trace along the central sinew — the goal is to keep as much meat on each lobe as possible.",
          "The central sinew is clearly visible as a white line — follow it visually, not just by feel.",
          "Slice against the grain and at an angle — the grain is strong and the fibres are long.",
        ],
        commonMistakes: [
          "Serving without removing the central sinew — it is inedible and ruins the eating experience.",
          "Over-cooking — hanger is best served rare to medium-rare (50–56°C). Beyond medium it becomes grainy.",
          "Not resting before slicing — the muscle is particularly prone to moisture loss. Rest minimum 5 min.",
        ],
        cookingApplications: [
          "Pan-seared whole lobes, rested and sliced",
          "Onglet frites (French bistro classic with shallot sauce)",
          "Grilled with chimichurri or salsa verde",
          "Sous vide (52°C, 2 hours) then hard sear on cast iron",
        ],
        trimRecovery: [
          { use: "Beef tartare", notes: "Clean trim from lobe ends — excellent raw flavour. Hand-chop, do not mince." },
          { use: "Beef stir-fry", notes: "Thin-sliced trim — deeply flavoured, stands up to bold sauces." },
        ],
      },
      {
        id: "flank-steak",
        name: "Flank Steak",
        aka: ["London Broil (US)", "Flap Steak (adjacent muscle)"],
        primal: "Flank",
        description:
          "Large, flat, lean muscle from the lower belly with a very visible, strong grain running lengthwise. High in flavour from being a well-worked muscle. Inexpensive relative to premium loin cuts but punches above its weight on flavour. Best marinated, cooked hot and fast, then rested and sliced thin across the grain.",
        expectedYieldPercent: "88–94%",
        typicalPortionGrams: "180–250g",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Remove the silverskin membrane from the outer fat-side using a flexible boning knife.",
          "Trim any remaining fat pockets from the surface to 2–3mm.",
          "Score the surface lightly in a diamond crosshatch before marinating — helps acid penetration.",
          "Even out the thickness by butterflying any very thick sections — flank tapers noticeably at the edges.",
        ],
        knifeTips: [
          "Slice perpendicular to the grain at a 45° angle, 5–8mm thick — the grain is so visible on flank it cannot be missed.",
          "Use a long, smooth carving knife for consistent thin slices.",
          "Rest at least 5 minutes before slicing — flank is lean and loses moisture rapidly when cut hot.",
        ],
        commonMistakes: [
          "Slicing with the grain — produces long, tough, stringy results. The grain is hard to miss on flank.",
          "Cooking past medium — flank becomes dry above 60°C internal. Target 54–57°C.",
          "Skipping the marinade — acid and fat help the tougher fibres enormously.",
        ],
        cookingApplications: [
          "Grilled London broil (marinated, high heat, rested and thin-sliced)",
          "Steak salad (sliced thin over rocket, capers, parmesan)",
          "Fajitas and beef tacos",
          "Vietnamese beef salad (bun bo nuong — quick grilled, sliced thin)",
        ],
        trimRecovery: [
          { use: "Beef mince / bolognese", notes: "Tougher trim pieces — the strong grain breaks down well in a slow mince cook." },
          { use: "Beef bulgogi", notes: "Thin-sliced trim and ends — marinate with soy, sesame, garlic, grill hot." },
        ],
      },
      {
        id: "topside",
        name: "Topside",
        aka: ["Inside Round (US)", "Top Round", "Inside Thigh"],
        primal: "Round / Hindquarter",
        description:
          "The large, lean muscle from the inner thigh — one of the highest-yielding cuts on the carcase. Fine grain when portioned correctly gives good eating quality despite minimal fat. Often used for roasting whole or thin-sliced cold meats. Requires careful temperature management to avoid dryness.",
        expectedYieldPercent: "80–88%",
        typicalPortionGrams: "180–250g",
        labourIntensity: "medium" as LabourIntensity,
        trimInstructions: [
          "Remove the silverskin cap (thick membrane on the outer surface) entirely — it does not soften with cooking and distorts the portion.",
          "Trim fat to 2–3mm for steaks — minimal coverage means it dries out quickly if over-trimmed.",
          "For roasting whole: tie at 3cm intervals to maintain shape during cooking.",
          "Identify grain direction before portioning — it runs consistently through the main muscle but changes at the seams.",
        ],
        knifeTips: [
          "Slice across the grain — topside has a very fine grain when cut correctly, giving surprisingly good tenderness.",
          "For cold meats: slice paper-thin on a gravity slicer at 1–2mm for best texture.",
          "The muscle is uniform — use the full length of the slicing blade for clean, consistent cross-cuts.",
        ],
        commonMistakes: [
          "Leaving the silverskin cap — it shrinks and toughens dramatically during cooking, distorting the portion.",
          "Over-cooking — topside is lean with little fat to protect it. Above 65°C internal it becomes dry and mealy.",
          "Cutting with the grain — produces tough, long-fibred portions.",
        ],
        cookingApplications: [
          "Whole roasted topside (medium-rare, 55°C core)",
          "Thin-sliced beef for cold meat plates and sandwiches",
          "Beef carpaccio (paper-thin sliced from semi-frozen, dressed)",
          "Vietnamese pho (sliced paper thin, added raw to hot broth)",
        ],
        trimRecovery: [
          { use: "Beef sandwich / catering platter", notes: "Roasted whole then chilled and thin-sliced — the highest-GP cold beef application." },
          { use: "Beef mince / bolognese", notes: "Lean trim — blend with fattier trim for a balanced ratio." },
          { use: "Beef broth / stock", notes: "Sinew trim and membrane — adds lean protein and collagen." },
        ],
      },
    ],
  },
  {
    id: "pork",
    label: "Pork",
    cuts: [
      {
        id: "pork-shoulder",
        name: "Pork Shoulder",
        aka: ["Boston Butt (US)", "Blade Shoulder", "Pork Collar"],
        primal: "Shoulder",
        description:
          "Well-marbled, flavourful shoulder muscle ideal for slow cooking. High fat and collagen content renders beautifully over time. Bone-in retains more moisture; boneless is easier to portion.",
        expectedYieldPercent: "65–72% cooked",
        typicalPortionGrams: "180–220g pulled",
        trimInstructions: [
          "Remove the thick outer fat cap to 5–8mm — enough to protect during cooking.",
          "Remove the blade bone if boneless portioning required — use a stiff boning knife.",
          "Identify and remove tough gland nodes embedded in the meat — bitter if cooked.",
          "Score fat cap for even rendering and bark formation.",
        ],
        knifeTips: [
          "For bone removal: work the knife close to the bone surface, keeping blade flat to avoid waste.",
          "The shoulder blade has a curved surface — follow it with the knife tip rather than trying to cut straight.",
          "Score fat cap at 1cm intervals, then cross-score.",
        ],
        commonMistakes: [
          "Skipping the gland nodes — identifiable as small, pale, rubbery pieces. Bitter when cooked.",
          "Over-trimming fat — shoulder needs fat for slow-cook self-basting.",
          "Cutting without finding the bone first — risks cutting through it.",
        ],
        cookingApplications: [
          "Pulled pork (low-and-slow, 110–120°C, 8–12 hours)",
          "Porchetta (rolled, stuffed, roasted)",
          "Carnitas (Mexican-braised, then crisped)",
          "Rillettes",
        ],
        trimRecovery: [
          { use: "Sausage / farce", notes: "Trim pieces with good fat ratio — excellent emulsified sausage base." },
          { use: "Terrine / pâté", notes: "High-fat trim — render and blend for country terrine." },
          { use: "Staff meal", notes: "Off-cuts from pulled batches — taco/burrito filling with minimal effort." },
          { use: "Pork broth", notes: "Bones — add aromatics and simmer 4 hours for ramen base." },
        ],
      },
      {
        id: "pork-belly",
        name: "Pork Belly",
        aka: ["Streaky pork"],
        primal: "Belly",
        description:
          "Layered fat and muscle from the underbelly. High fat content makes it self-basting and deeply flavourful. Can be slow-roasted whole, braised, or portioned for individual service.",
        expectedYieldPercent: "82–90%",
        typicalPortionGrams: "150–200g portion",
        trimInstructions: [
          "Remove the riblet bones if present — cut close to the bone, then pull/snap free.",
          "Score the skin in a crosshatch at 5mm intervals without cutting into the fat layer — essential for crackling.",
          "Trim any ragged edges square for clean portioning.",
          "Salt the skin 24 hours ahead and leave uncovered in the fridge to dry out for optimum crackling.",
        ],
        knifeTips: [
          "For skin scoring: use a sharp, thin knife or a Stanley knife blade. Scalpel control is needed.",
          "Score across the grain of the meat for presentation-ready portion cuts.",
          "For clean rectangular portions: use a long, smooth slicer on well-chilled or par-cooked belly.",
        ],
        commonMistakes: [
          "Cutting too deep when scoring — fat layer cooks through to the meat and collapses.",
          "Not drying the skin — steam prevents crackling.",
          "Under-cooking — belly needs long, slow heat to render. Rushing produces rubbery fat.",
        ],
        cookingApplications: [
          "Slow-roasted pork belly with crackling",
          "Braised and pressed (then sear to order)",
          "Ramen chashu (rolled, tied, braised in soy/mirin/sake)",
          "Korean samgyeopsal (grilled strips)",
          "Char siu (Chinese BBQ)",
        ],
        trimRecovery: [
          { use: "Lardons / pancetta", notes: "Trim strips — cure with salt, pepper, herbs and dry 2–3 days." },
          { use: "Crackling snack", notes: "Scored skin offcuts — deep fry at 200°C for pork scratchings." },
          { use: "Staff meal", notes: "End and edge trims — render down and use as seasoning fat for greens." },
        ],
      },
      {
        id: "pork-loin",
        name: "Pork Loin",
        aka: ["Pork rack", "Pork T-bone (loin chop)"],
        primal: "Loin",
        description:
          "Lean, tender loin muscle running along the backbone. Less fat than shoulder or belly but still flavourful when cooked correctly. Can be portioned into cutlets, chops, or left whole for roasting.",
        expectedYieldPercent: "75–82%",
        typicalPortionGrams: "200–250g",
        trimInstructions: [
          "French the bones for rack presentation: scrape back 3–4cm of meat and fat from each rib end.",
          "Remove the chine bone if present — use a saw or heavy boning knife.",
          "Trim fat cap to 4–6mm for roasting; thinner for cutlets.",
          "Remove the tenderloin if still attached — it will overcook before the loin is done.",
        ],
        knifeTips: [
          "Portion between ribs with a firm, decisive downward cut through the joint, not through bone.",
          "For French-trimmed rack: use the back of a boning knife to scrape the rib bones clean.",
          "Score the fat cap lightly before searing to prevent buckling.",
        ],
        commonMistakes: [
          "Not removing the tenderloin — it overcooks significantly faster than the loin.",
          "Sawing through bone rather than finding the joint — damages the blade and tears meat.",
          "Overcooking pork loin — target 63–65°C internal for optimum moisture and food safety.",
        ],
        cookingApplications: [
          "Roasted rack of pork",
          "Pan-seared pork cutlets",
          "Stuffed loin (butterflied and rolled)",
          "Pork schnitzel (from the eye of the loin, butterflied thin)",
        ],
        trimRecovery: [
          { use: "Stir-fry strips", notes: "End pieces and odd-shaped trim — thin-slice against the grain." },
          { use: "Pork mince for dumplings", notes: "Clean trim — mince and season for gyoza, har gow." },
          { use: "Sausage / bangers", notes: "Lean trim — blend with shoulder for balanced fat-to-lean ratio." },
        ],
      },
      {
        id: "pork-tenderloin",
        name: "Pork Tenderloin",
        aka: ["Pork fillet", "Filet de porc"],
        primal: "Loin",
        frenchName: "Filet de porc",
        description:
          "The most tender cut on the pig — a long, narrow muscle running under the backbone that does almost no work. Extremely lean with virtually no fat. Cooks rapidly and dries out fast. Often wrapped in prosciutto or caul fat to protect it during cooking.",
        expectedYieldPercent: "88–95%",
        typicalPortionGrams: "180–220g (whole or halved)",
        labourIntensity: "medium" as LabourIntensity,
        trimInstructions: [
          "Remove all silverskin using a flexible boning knife held almost flat against the muscle — it contracts and distorts the shape when cooked.",
          "Remove the chain muscle running alongside — set aside for stir-fry or staff meal.",
          "Trim any residual fat from the surface to a thin veil only.",
          "If stuffing: butterfly by cutting lengthwise almost through, open flat, fill, roll and tie.",
          "For medallions: portion at 3–4cm thick on a bias — gives a larger face for searing.",
        ],
        knifeTips: [
          "Silverskin removal technique: grip the skin with dry fingertips, keep the blade flat, and glide — not cut — along the muscle surface.",
          "The tenderloin is small and delicate — work on a clean board with a sharp, flexible knife. Minimal handling.",
          "For medallions on a bias: a single smooth pulling cut through the loin, not a sawing motion.",
        ],
        commonMistakes: [
          "Leaving silverskin — it contracts aggressively during cooking, distorting the shape and creating a chewy rubbery band.",
          "Over-cooking — pork tenderloin dries out at 68°C+. Target 63°C internal and rest.",
          "Cutting medallions perpendicular — angled cuts give a more attractive, larger surface for searing.",
        ],
        cookingApplications: [
          "Pan-seared whole (4 min each side then oven rest to 63°C)",
          "Wrapped in prosciutto and roasted",
          "Medallions with cream sauce (classic French bistro)",
          "Pork katsu (butterflied, crumbed, fried)",
        ],
        trimRecovery: [
          { use: "Pork stir-fry", notes: "Chain muscle and thin tail ends — slice thin against the grain and cook hot and fast." },
          { use: "Staff meal", notes: "Small off-cuts — best tenderloin cut you can offer. Season and sear." },
        ],
      },
      {
        id: "baby-back-ribs",
        name: "Baby Back Ribs",
        aka: ["Pork loin ribs", "Back ribs", "Canadian back ribs"],
        primal: "Loin",
        description:
          "Curved ribs from the upper rib cage where the loin meets the backbone. Shorter and more curved than spare ribs, with leaner meat between the bones. Generally 8–13 ribs per rack. More tender than spare ribs but less fall-off-the-bone rich — suited to higher-temp, shorter cooking.",
        expectedYieldPercent: "50–60% meat to bone",
        typicalPortionGrams: "Full rack 600–900g / Half rack 300–450g",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Remove the silverskin membrane from the bone side — grip a corner with a dry cloth and pull sharply. The membrane is clearly visible as a whitish skin.",
          "Trim any excess fat from the meat side to 4–5mm — enough for basting, not enough to prevent bark.",
          "Remove any loose flap meat hanging from the end of the rack — tie or remove for even cooking.",
          "Score between bones with a knife to assist with cutting post-cook.",
        ],
        knifeTips: [
          "The silverskin on the bone side is the most critical prep step — grip with paper towel for better purchase.",
          "To portion post-cooking: cut between each bone with a sharp, thin knife — the meat pulls easily from a well-cooked rack.",
          "For flanken-style (cross-cut): freeze the rack partially before cutting for a cleaner cross-section.",
        ],
        commonMistakes: [
          "Not removing the silverskin — it creates a rubbery, impenetrable barrier that steams the bones rather than allowing smoke/heat to penetrate.",
          "Over-cooking to the point of disintegration — baby back ribs should pull cleanly off the bone with a slight tug, not fall off.",
          "Under-seasoning the bone side — meat between bones needs penetration from both sides.",
        ],
        cookingApplications: [
          "Low-and-slow BBQ smoke (3–4 hours at 120°C)",
          "Oven-braised then chargrilled to finish",
          "Sticky glazed ribs (steam, then glaze and blast at 220°C)",
          "Asian-style (marinate in hoisin, five spice, char sui)",
        ],
        trimRecovery: [
          { use: "Pork rib tips", notes: "End sections trimmed from the rack — grill or deep fry as a bar snack." },
          { use: "Pork stock / ramen broth", notes: "Bones from picked racks — simmer 6+ hours with aromatics for a rich base." },
        ],
      },
      {
        id: "spare-ribs",
        name: "Spare Ribs",
        aka: ["St. Louis ribs (trimmed)", "Side ribs", "Meaty pork ribs"],
        primal: "Belly",
        description:
          "Longer, flatter ribs from the lower belly section. More fat between the bones than baby back ribs, which means more flavour and a richer result when slow-cooked. The St. Louis cut removes the sternum and cartilage section for a cleaner, more rectangular rack. The cartilage section (riblets) is a useful secondary.",
        expectedYieldPercent: "45–55% meat to bone",
        typicalPortionGrams: "Full rack 1–1.5kg / Half rack 500–750g",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Remove the silverskin membrane from the bone side — pull from a corner with a dry cloth.",
          "For St. Louis cut: remove the sternum and rib tips section with a sharp, decisive cut along the cartilage line — keep the off-cut for riblets.",
          "Trim any thick fat deposits from the meat side to 5–6mm.",
          "Score between bones for portion guidance after cooking.",
          "Remove the flap of meat hanging off the back if it is irregular — tie flat or remove.",
        ],
        knifeTips: [
          "The St. Louis trim requires a firm, confident single cut along the cartilage line — feel for the harder cartilage with the tip of the knife before committing.",
          "The sternum off-cut (riblets/rib tips) is a valuable secondary — braise or grill low-and-slow.",
          "Use a long, thin knife to cut between bones post-cook for clean service portions.",
        ],
        commonMistakes: [
          "Not removing the membrane — results in steamed, rubbery ribs regardless of cooking time.",
          "Cooking too hot — spare ribs need more time than baby backs due to higher collagen content. Minimum 4 hours at 120°C.",
          "Discarding the rib tips from St. Louis trim — they are a high-value secondary for braising or frying.",
        ],
        cookingApplications: [
          "Low-and-slow BBQ smoke (4–6 hours at 110–120°C)",
          "Kansas City style (dry rub, slow-smoked, sauced)",
          "Korean slow-braised spare ribs (galbijjim)",
          "Vietnamese caramelised spare ribs (suon ram man)",
        ],
        trimRecovery: [
          { use: "Rib tips / riblets", notes: "The sternum and cartilage section from St. Louis trim — braise until tender, then grill or fry. High-value bar snack." },
          { use: "Pork ramen broth", notes: "Post-service bones — simmer overnight for a collagen-rich ramen base." },
        ],
      },
      {
        id: "ham-hock",
        name: "Ham Hock",
        aka: ["Pork knuckle", "Schweinshaxe (German)", "Pork shank"],
        primal: "Ham / Leg",
        description:
          "The knuckle joint of the pig's rear leg — all skin, collagen, and deeply flavoured connective tissue surrounding the bone. When braised long and low, the collagen dissolves into rich, sticky gelatin. The skin can be roasted to crackling after braising. A workhorse of peasant cuisine, now a premium bar and casual menu item.",
        expectedYieldPercent: "50–65% after braising",
        typicalPortionGrams: "400–700g (one whole hock)",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Score the skin in a crosshatch at 1cm intervals if crisping — cut through skin only, not into the fat.",
          "Remove any stray hair from the skin surface — briefly torch or dry shave with a knife.",
          "If cooking in brine: submerge fully and press with a plate to keep under liquid.",
          "For pressing (terrine style): once braised, remove the bone while hot, shred, and press in a mould.",
        ],
        knifeTips: [
          "Score the skin while cold — the skin is rubbery at room temperature and the knife slips.",
          "To remove the bone post-braise: the joint should be soft enough to pull apart with two forks — if not, it needs more time.",
          "For crackling: dry the skin aggressively after braising, then blast at 240°C for 10–15 min.",
        ],
        commonMistakes: [
          "Under-cooking — the hock needs minimum 3 hours at 160°C (braised) or 4+ hours at 140°C for fall-off-the-bone results.",
          "Not scoring the skin — prevents crackling from forming evenly, creates bubbles and hard spots.",
          "Discarding the braising liquid — it becomes a highly gelatinous pork stock. Strain and reduce for sauce.",
        ],
        cookingApplications: [
          "Braised ham hock (pea and ham soup, terrine, French cassoulet)",
          "German crispy knuckle (Schweinshaxe — braised then oven-roasted for crackling)",
          "Pressed hock terrine (braised, pressed, sliced cold)",
          "Asian master-stock braised hock (soy, ginger, star anise)",
        ],
        trimRecovery: [
          { use: "Pea and ham soup", notes: "Pick all meat from the braised hock — shred into the soup." },
          { use: "Pork jelly / stock", notes: "Braising liquid is intensely gelatinous — strain, chill, and use as sauce or aspic base." },
          { use: "Pressed terrine", notes: "Braised hock meat with herbs — press in a terrine mould, chill, slice cold." },
        ],
      },
    ],
  },
  {
    id: "lamb",
    label: "Lamb",
    cuts: [
      {
        id: "lamb-rack",
        name: "Rack of Lamb",
        aka: ["Frenched rack", "Carré d'agneau"],
        primal: "Rib",
        description:
          "Premium cut from the rib section. Eight rib bones per rack. French-trimmed racks present with exposed, clean bones. Cap removed for leaner, more refined service.",
        expectedYieldPercent: "55–65%",
        typicalPortionGrams: "2–3 cutlets (160–220g)",
        trimInstructions: [
          "Remove the fat cap and meat from the rib bones (French trimming): measure 3–4cm from the eye of the rack and score across.",
          "Strip all meat and fat from the rib tips down to the bone using a boning knife tip.",
          "Scrape the exposed bone clean with the back of the blade.",
          "Trim the fat layer over the eye to 3–4mm — enough to protect during roasting.",
          "Remove the chine bone if still attached.",
        ],
        knifeTips: [
          "Use a thin, flexible boning knife for clean scraping.",
          "Score meat before pulling it away — tension cuts cleaner than tearing.",
          "Keep the eye of the meat intact and avoid cutting through it.",
          "For single cutlet portioning: cut between rib bones with a decisive downward cut.",
        ],
        commonMistakes: [
          "Removing too much fat from the eye — dries out rapidly in a hot oven.",
          "Tearing rather than cutting — ragged bones look unprofessional.",
          "Not securing the bones during service — the presentation cut can slip.",
        ],
        cookingApplications: [
          "Whole rack, hot roast (200°C, 15–18 min for medium)",
          "Individual cutlets — flash grill or pan sear",
          "Guard of honour (two racks interlocked)",
          "Lamb crown roast",
        ],
        trimRecovery: [
          { use: "Lamb mince / kofta", notes: "Cap meat and rib tip meat — excellent flavour for kofta or shepherd's pie." },
          { use: "Lamb stock", notes: "Chine bone and trimmings — essential base for jus." },
          { use: "Staff meal", notes: "French trim off-cuts — pan-fry with garlic and herbs." },
        ],
      },
      {
        id: "lamb-saddle",
        name: "Lamb Saddle",
        aka: ["Saddle of lamb", "Short loin"],
        primal: "Loin",
        description:
          "Whole double loin of the lamb, including both loins and the tenderloin running beneath. The most ceremonial of lamb cuts. Can be boned, stuffed, and rolled (baron) or cut into cannon (loin muscle only).",
        expectedYieldPercent: "58–68%",
        typicalPortionGrams: "160–200g boned loin",
        trimInstructions: [
          "For cannon: remove the loin muscle from both sides using a boning knife along the backbone.",
          "Peel away the outer fat and sinew layer from each cannon.",
          "Remove all silver skin from the loin muscles.",
          "The belly flap can be rolled around the cannon for a tied portion.",
          "For rolled saddle: bone out, lay flat, season interior, roll tight, tie at 2cm intervals.",
        ],
        knifeTips: [
          "Work the knife close to the vertebrae to minimise meat loss on the bone.",
          "The loin is tender — avoid over-handling; warm muscle tears easily.",
          "Silver skin on the cannon must be fully removed or it will draw up and distort the shape during cooking.",
        ],
        commonMistakes: [
          "Leaving silver skin on the cannon — it contracts and causes the meat to bow during cooking.",
          "Removing the belly flap without considering its use for rolling.",
          "Rushing the boning — saddle is an expensive cut, work methodically.",
        ],
        cookingApplications: [
          "Cannon of lamb (seared and rested whole, sliced for service)",
          "Rolled, stuffed saddle (whole roast)",
          "Noisettes (from the belly roll wrapped around loin)",
        ],
        trimRecovery: [
          { use: "Lamb jus / stock", notes: "Bones — roast until golden then simmer for 4 hours." },
          { use: "Lamb mince / moussaka", notes: "Belly flap and cap trimmings — mince for filling." },
          { use: "Lamb kofta", notes: "Belly and cap meat — spice and form on skewers." },
        ],
      },
      {
        id: "lamb-shoulder",
        name: "Lamb Shoulder",
        aka: ["Shoulder of lamb", "Blade shoulder"],
        primal: "Shoulder",
        description:
          "Heavily worked muscle with excellent flavour from the forequarter. More fat and connective tissue than the leg. Ideal for slow cooking — the connective tissue becomes gelatinous and rich over time.",
        expectedYieldPercent: "68–75%",
        typicalPortionGrams: "200–250g slow-cooked",
        trimInstructions: [
          "Trim external fat to 5–6mm for roasting.",
          "Bone out if rolling: work around the blade bone and shank knuckle.",
          "Remove any sinew and gland nodes embedded in the muscle.",
          "Score the fat cap for even rendering.",
        ],
        knifeTips: [
          "The blade bone has a complex shape — feel the edge with your fingers before cutting along it.",
          "For boneless rolling: keep the knife as flat as possible against the bone surface.",
        ],
        commonMistakes: [
          "Under-cooking — shoulder needs long, slow heat (3–5 hours at 150°C minimum).",
          "Not resting — juices haven't redistributed and the meat tears when pulled.",
        ],
        cookingApplications: [
          "Slow-roasted shoulder (6–8 hours at 130°C)",
          "Middle Eastern style — spiced, slow-cooked, pulled",
          "Rolled and braised",
          "Lamb tagine / stew",
        ],
        trimRecovery: [
          { use: "Shepherd's pie", notes: "Cooked pulled shoulder off-cuts — dice and mix with jus." },
          { use: "Lamb stock / jus", notes: "Bones and sinew — roast and simmer for rich base." },
          { use: "Lamb flatbread filling", notes: "Shredded shoulder with yoghurt and herbs — quick service item." },
        ],
      },
      {
        id: "lamb-shank",
        name: "Lamb Shank",
        aka: ["Osso buco of lamb (cross-cut)", "Shank end"],
        primal: "Leg",
        description:
          "The lower leg of the lamb — all connective tissue, collagen-rich meat and a thick centre bone. When braised long and slow, the collagen dissolves into a rich, glossy sauce and the meat falls from the bone effortlessly. One of the world's great comfort dishes and a cornerstone of casual fine dining menus globally.",
        expectedYieldPercent: "55–65% meat to bone",
        typicalPortionGrams: "350–500g (one whole shank)",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Remove the thicker sinew and fat deposits from the top of the shank — the lower leg needs minimal prep.",
          "French-trim the exposed bone at the narrow end 3–4cm for presentation — scrape clean with a small knife.",
          "Score the skin/sinew around the circumference at the top of the shank for even heat penetration.",
          "For cross-cut osso buco style: portion through the bone at 4–5cm thickness — requires a bone saw or heavy knife.",
        ],
        knifeTips: [
          "A small boning knife is all that is needed — the shank needs minimal knife work. The oven does the heavy lifting.",
          "French-trimming the bone: hold the knife perpendicular and scrape downward to clean back the meat and membrane.",
          "For osso buco cross-cuts: partially freeze the shank first for a cleaner cut through the bone.",
        ],
        commonMistakes: [
          "Under-cooking — lamb shank requires minimum 2.5 hours at 160°C (braised). The meat should fall from the bone when pressed.",
          "Not searing before braising — the Maillard crust from searing is essential for colour and depth of flavour.",
          "Over-crowding the braising vessel — each shank needs to be mostly submerged for even collagen conversion.",
        ],
        cookingApplications: [
          "Red wine braised lamb shank (the classic — stock, tomato, aromatics, 3 hours)",
          "Moroccan lamb shank with preserved lemon and harissa",
          "Persian-style braised shank with saffron, pomegranate, walnuts",
          "Slow-roasted shank (6 hours at 140°C — falls off the bone without braising liquid)",
        ],
        trimRecovery: [
          { use: "Lamb stock / jus", notes: "Braising liquid reduced — intensely flavoured lamb jus. Strain and reduce by half." },
          { use: "Lamb pie / shepherd's pie", notes: "Any pulled meat from trim or under-portioned shanks — high GP filling." },
        ],
      },
      {
        id: "butterflied-leg",
        name: "Butterflied Leg of Lamb",
        aka: ["Boned leg", "Flat leg", "Leg of lamb (open)"],
        primal: "Leg",
        description:
          "A whole leg of lamb, boned out and opened flat. The bone removal and the butterfly opening allows the leg to cook quickly over a grill or in a hot oven — cutting the cooking time from 2 hours to 30–40 minutes. The uneven thickness creates natural variation: well-done at the thinner edges, medium-rare in the thick centre.",
        expectedYieldPercent: "72–80%",
        typicalPortionGrams: "200–250g sliced per portion",
        labourIntensity: "high" as LabourIntensity,
        trimInstructions: [
          "Remove the aitch bone (pelvis) first — work around the socket joint with a boning knife.",
          "Follow the femur (thigh bone) along its length, cutting close to the bone on both sides.",
          "Remove the femur through the back of the leg — keep the bone for stock.",
          "Open the leg flat and remove the popliteal lymph node (the small fat cluster in the centre crease) — discard.",
          "Score the thicker muscle sections at 2cm intervals to ensure even cooking.",
        ],
        knifeTips: [
          "A flexible, long boning knife is essential for the curved femur — keep the blade pressed against the bone at all times.",
          "Work slowly around the ball-and-socket joint — the curved anatomy requires the blade to follow the bone, not cut through it.",
          "After boning: lay flat and check for any remaining sinew on the inner face — remove with the tip of the boning knife.",
        ],
        commonMistakes: [
          "Leaving the lymph node in — it has an off-putting flavour and texture when cooked.",
          "Not scoring the thick sections — the uneven thickness creates uneven cooking. Scoring helps the thick parts catch up.",
          "Removing too much fat — the fat cap bastes the lamb during grilling. Leave at least 3–4mm.",
        ],
        cookingApplications: [
          "Grilled butterflied leg (direct heat, 15 min per side, rest 10 min)",
          "Marinated and roasted (Middle Eastern spice crust — sumac, cumin, coriander)",
          "Barbecue butterflied leg with chimichurri",
          "Slow oven-roasted (140°C, 2 hours) with garlic and rosemary",
        ],
        trimRecovery: [
          { use: "Lamb stock", notes: "Femur and aitch bone — roast until golden, simmer 3 hours for a rich base." },
          { use: "Lamb mince / köfte", notes: "Off-cut seam muscles and trim — mince with spices for Middle Eastern kofte." },
        ],
      },
      {
        id: "lamb-chops",
        name: "Lamb Loin Chops",
        aka: ["Lamb T-bone", "Loin chop", "Lamb midloin chop"],
        primal: "Loin",
        description:
          "Cross-cut sections through the loin — a miniature T-bone containing both the loin muscle and a small slice of tenderloin, separated by the T-shaped vertebra. Sweet, tender, and cooks in minutes. The eye muscle is the most sought-after part — small but supremely tender. Often served as a pair (2 chops per portion).",
        expectedYieldPercent: "75–82% usable meat",
        typicalPortionGrams: "180–280g (2 chops)",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Trim the fat cap to 4–5mm — lamb fat is strongly flavoured, some is desirable but excess is not.",
          "Remove the flank flap if it is overly long — fold and skewer or remove entirely.",
          "French-trim the bone end if required for presentation — scrape clean.",
          "Portion between vertebrae — locate the cartilage gap with the knife tip before each cut.",
          "Score the fat cap lightly to prevent the chop from curling on the grill.",
        ],
        knifeTips: [
          "Never cut through the vertebra — locate the gap between discs. The knife should pass through cartilage.",
          "Use a smooth, sharp knife — sawing motion crushes the small muscles.",
          "A consistent cut angle gives uniform thickness — use a portioning guide if needed for high-volume.",
        ],
        commonMistakes: [
          "Cutting through vertebra bone rather than the gap — creates bone fragments and a splintered presentation.",
          "Over-cooking — lamb loin chops are best at medium-rare to medium (58–62°C). They dry rapidly past this.",
          "Not scoring the fat — the fat cap causes curling on direct heat, resulting in uneven cooking.",
        ],
        cookingApplications: [
          "Chargrill (3–4 min per side for medium-rare)",
          "Pan-seared with garlic and rosemary butter",
          "Tandoor or high-heat oven roasted",
          "Crumbed and fried (Italian cotoletta style)",
        ],
        trimRecovery: [
          { use: "Lamb flap trim", notes: "Flank flap off-cuts — mince or braise. High fat, high flavour." },
          { use: "Lamb stock", notes: "Vertebra trim from butchering — excellent body and flavour for stock." },
        ],
      },
      {
        id: "lamb-breast",
        name: "Lamb Breast",
        aka: ["Lamb belly", "Breast and flap", "Lamb brisket"],
        primal: "Breast",
        description:
          "The lower belly and breast plate of the lamb — layered fat, meat, and connective tissue. Inexpensive and intensely flavoured when braised and pressed. The entire breast can be rolled, stuffed, and slow-roasted. A chef's gem for value-driven menus — low food cost with high transformation potential.",
        expectedYieldPercent: "70–78%",
        typicalPortionGrams: "180–220g (sliced from rolled/pressed)",
        labourIntensity: "high" as LabourIntensity,
        trimInstructions: [
          "Remove the sternum cartilage and any exposed rib bone tips — use a boning knife along the bone edge.",
          "Trim the thick outer fat layer to 5mm — more fat than this becomes unpleasant in the finished dish.",
          "For rolled breast: open flat, remove bones if any remain, season the inner face, then roll tightly and tie at 3cm intervals.",
          "For pressing: braise until tender, remove from liquid, press under a weight overnight then slice cold.",
          "Score the outer skin in a crosshatch if crisping — 2–3mm deep only.",
        ],
        knifeTips: [
          "A thin, flexible boning knife is best for removing cartilage and rib bone tips — work close to the bone.",
          "When rolling: use two hands to keep even tension as you roll. Tie with butcher's twine at even intervals.",
          "For slicing pressed lamb breast: a thin, sharp slicing knife gives the cleanest cuts through the set layers.",
        ],
        commonMistakes: [
          "Not braising long enough — lamb breast needs 2–3 hours at 150°C to become tender. Rushing produces tough, fatty results.",
          "Not pressing after braising — without pressing, the rolled breast falls apart when sliced cold.",
          "Over-trimming the fat before cooking — the fat bastes the meat during braising. Trim after cooking and pressing.",
        ],
        cookingApplications: [
          "Rolled and braised lamb breast (stuffed with herbs, garlic, lemon zest)",
          "Pressed and sliced cold (charcuterie-style breast with capers and gherkins)",
          "Crispy slow-braised breast (braise, press, portion, pan-fry skin-down)",
          "Slow-roasted whole breast (Middle Eastern spice crust)",
        ],
        trimRecovery: [
          { use: "Lamb stock", notes: "Braising liquid and bones — rich, well-seasoned stock from the long braise." },
          { use: "Lamb mince / shepherd's pie", notes: "Any braised breast off-cuts — blend with jus and vegetable base." },
        ],
      },
    ],
  },
  {
    id: "chicken",
    label: "Chicken",
    cuts: [
      {
        id: "whole-chicken",
        name: "Whole Chicken",
        aka: ["Full bird"],
        primal: "Whole",
        description:
          "Standard breakdown yields: two breasts, two wings, two thighs, two drumsticks, and a carcass for stock. Yield varies significantly with bird size. Airline breast (with drumette attached) is a premium presentation cut.",
        expectedYieldPercent: "70–78% usable meat",
        typicalPortionGrams: "Breast 180–220g / Maryland 280–350g",
        trimInstructions: [
          "Remove wings first at the joint — locate the joint with your fingers, then cut through.",
          "Remove the legs (maryland): cut through the skin between leg and body, then press the leg flat to pop the joint, cut through the socket.",
          "Separate thigh from drumstick: cut through the knee joint.",
          "Remove breasts: cut along the breastbone keel, then follow the wishbone and rib cage down.",
          "Airline breast: leave the drumette wing bone attached, french-trim it.",
        ],
        knifeTips: [
          "Always find the joint with your fingertip before committing the knife.",
          "A 15cm boning knife is more controlled than a large chef's knife for breaking down poultry.",
          "Keep the bird stable on a non-slip surface — place a damp cloth under the board.",
          "Cold birds break down more cleanly — work from 1–4°C.",
        ],
        commonMistakes: [
          "Cutting through bone rather than through joints — dulls the knife and tears meat.",
          "Leaving the oyster on the carcass — the most flavourful part of the thigh side. Pull it free with the leg.",
          "Leaving skin ragged — untidy presentation is difficult to fix post-break-down.",
        ],
        cookingApplications: [
          "Whole roast chicken",
          "Spatchcock / butterflied (remove backbone with shears)",
          "Pan-roasted portioned pieces",
          "Poached for shredding (salads, sandwiches, tacos)",
        ],
        trimRecovery: [
          { use: "Chicken stock / consommé", notes: "Carcass, wings, neck — roast at 200°C until golden, then simmer 4–6 hours." },
          { use: "Chicken liver pâté", notes: "Livers from giblets — sauté, blend with butter and brandy." },
          { use: "Schmaltz", notes: "Skin trim and fat — render slowly over low heat for cooking fat." },
          { use: "Staff meal", notes: "Wing tips and odd pieces — toss in sauce and oven-roast." },
        ],
      },
      {
        id: "chicken-maryland",
        name: "Chicken Maryland",
        aka: ["Leg quarter", "Thigh-drumstick"],
        primal: "Leg",
        description:
          "The full leg section including thigh and drumstick, connected at the knee joint. Rich in flavour, forgiving to cook. Can be sold bone-in or boned-out for stuffing and rolling.",
        expectedYieldPercent: "78–85%",
        typicalPortionGrams: "280–360g bone-in",
        trimInstructions: [
          "Trim excess skin and fat from the edges — leave enough to cover the muscle when cooking.",
          "Tunnel-bone the thigh: make a lengthwise incision along the thigh bone, scrape clean around the bone, pull free. Leave the drumstick bone in for presentation.",
          "Remove the thigh bone tunnel-boning method and stuff the cavity.",
          "Score the skin once to prevent buckling during cooking.",
        ],
        knifeTips: [
          "A thin, flexible boning knife is essential for tunnel-boning.",
          "Work slowly around the thigh bone — it has a curved surface.",
          "Scrape, don't cut — less waste, cleaner bone.",
        ],
        commonMistakes: [
          "Cutting through the thigh bone rather than around it.",
          "Leaving excess skin that causes flare-ups when grilling.",
          "Not scoring the skin — skin buckles and becomes chewy without steam escape.",
        ],
        cookingApplications: [
          "Confit chicken maryland (72°C, 2–3 hours in fat)",
          "Stuffed, boned maryland",
          "Korean fried chicken",
          "Braised chicken (coq au vin, cacciatore)",
        ],
        trimRecovery: [
          { use: "Chicken mince / dumplings", notes: "Thigh trim — process to mince for gyoza filling." },
          { use: "Stock", notes: "Thigh bone from tunnel-boning — adds gelatin to stock." },
          { use: "Shredded chicken for tacos", notes: "Any poached/braised trim." },
        ],
      },
      {
        id: "chicken-breast",
        name: "Chicken Breast",
        aka: ["Chicken supreme (skin-on, wing joint on)", "Poitrine de poulet"],
        primal: "Breast",
        frenchName: "Poitrine",
        description:
          "The largest muscle on the chicken — lean, mild, and the most ordered poultry cut globally. Available boneless/bone-in and skin-on/skinless. The supreme (skin-on, with the first wing joint left on) is the fine-dining preparation. Very lean and cooks fast — prone to drying out at high temperatures.",
        expectedYieldPercent: "85–92% (skinless)",
        typicalPortionGrams: "180–220g",
        labourIntensity: "medium" as LabourIntensity,
        trimInstructions: [
          "Remove the tender (mini fillet on the underside) — set aside separately, it overcooks much faster than the breast.",
          "Remove the white sinew from the tender — grip the sinew end and pull against a knife held flat.",
          "For skin-on: leave the skin intact and run your finger between skin and flesh to loosen without tearing.",
          "For supreme: leave the first wing joint (drummette) attached and clean the bone tip — scrape back 3cm.",
          "Trim any excess fat or sinew from the edges for a clean presentation.",
        ],
        knifeTips: [
          "The tender sinew removal: place the sinew end over the edge of the board, grip with fingertips and pull the tender away while holding the sinew down with a knife.",
          "For butterflying: cut horizontally through the thickest part, stopping 1cm from the edge — open like a book.",
          "A thin, smooth knife prevents tearing the delicate flesh when portioning.",
        ],
        commonMistakes: [
          "Cooking with the tender attached — it overcooks before the breast reaches temperature. Remove it.",
          "Over-cooking — chicken breast becomes dry and mealy above 72°C. Target 68–70°C internal.",
          "Not patting dry before searing — moisture on the surface steams the skin instead of crisping it.",
        ],
        cookingApplications: [
          "Pan-seared supreme (skin-side down 6–7 min, flip, oven 2–3 min to 68°C)",
          "Chicken schnitzel (butterflied, crumbed, shallow-fried)",
          "Poached breast for cold plates and salads",
          "Chargrilled (marinated, direct heat 4–5 min per side)",
        ],
        trimRecovery: [
          { use: "Chicken tender / staff meal", notes: "Tenders removed during prep — season and pan-fry for staff. Premium quality offcut." },
          { use: "Chicken mousse / mousseline", notes: "Trim and tender scraps — blend with cream for a classical stuffing or sauce component." },
          { use: "Chicken stock", notes: "Bones and skin from any bone-in prep — simmer 3–4 hours." },
        ],
      },
      {
        id: "chicken-thigh",
        name: "Chicken Thigh",
        aka: ["Thigh fillet (boneless)", "Chicken thigh cutlet (bone-in)"],
        primal: "Maryland",
        description:
          "The most flavourful and forgiving chicken cut — higher fat content than breast means it is harder to dry out. Bone-in or boneless, skin-on or skinless. Thigh meat excels in braises, grills, and high-heat applications where breast would toughen. The first choice for Asian preparations, braising, and casual menus.",
        expectedYieldPercent: "80–88% (boneless skin-on)",
        typicalPortionGrams: "150–200g",
        labourIntensity: "medium" as LabourIntensity,
        trimInstructions: [
          "For boning: lay skin-down, cut along the thigh bone from end to end, then work the knife along either side of the bone to release.",
          "Remove the femur by cutting through the socket joint at one end and scraping along the bone length.",
          "Trim any excess fat from the edges and the back cavity — leave a thin layer for flavour.",
          "Remove any visible sinew from the inner face of the boned thigh.",
          "For skin-on: leave skin intact — the fat under the skin bastes the meat during cooking.",
        ],
        knifeTips: [
          "Use a short, flexible boning knife for the thigh bone — the curved bone requires the blade to follow it closely.",
          "When boning: always cut toward the bone, not toward your hand. Keep the knife angled against the bone surface.",
          "For uniform cooking: flatten the boned thigh with a mallet or press it flat — uneven thickness causes hot spots.",
        ],
        commonMistakes: [
          "Not flattening boned thighs before grilling — they curl and cook unevenly.",
          "Removing too much fat — thigh fat is essential for the cut's signature flavour and juiciness.",
          "Under-cooking bone-in thighs — the bone insulates the meat near the joint. Ensure 74°C minimum at the thickest point.",
        ],
        cookingApplications: [
          "Chargrilled skin-on thigh fillet (6 min per side direct heat)",
          "Braised thighs (red wine, tomato, olives — 45 min)",
          "Yakitori / Korean BBQ (boneless, marinated, grilled on skewers)",
          "Slow-roasted bone-in thighs (160°C, 45–50 min, crispy skin)",
        ],
        trimRecovery: [
          { use: "Chicken mince / larb", notes: "Thigh trim — mince finely for Thai larb or gyoza filling." },
          { use: "Chicken stock", notes: "Thigh bones from boning — rich, gelatin-producing bones for stock." },
        ],
      },
      {
        id: "chicken-wings",
        name: "Chicken Wings",
        aka: ["Party wings (jointed)", "Wingette / flat", "Drumette"],
        primal: "Wing",
        description:
          "Three sections — the drumette (closest to breast, most meat), the flat/wingette (middle, two bones, most flavour), and the tip (mostly skin and bone, for stock). High skin-to-meat ratio makes wings ideal for crispy cooking methods. One of the highest-margin items on any menu — inexpensive input, high perceived value.",
        expectedYieldPercent: "65–75% (tips removed, usable wing)",
        typicalPortionGrams: "5–6 wings per serving (400–500g)",
        labourIntensity: "low" as LabourIntensity,
        trimInstructions: [
          "Separate the three sections at the joints — find the joint gap with the knife tip, then cut through cartilage (not bone).",
          "Remove wing tips — save for stock.",
          "For drumettes: leave whole or trim the end for a cleaner presentation.",
          "For a flat/wingette: remove the smaller of the two bones by wiggling and pulling — creates a 'lollipop' effect.",
          "Score the skin in 2–3 places for even cooking and sauce penetration.",
        ],
        knifeTips: [
          "Always cut through the joint cartilage, not the bone — flex the wing at the joint to find the natural gap.",
          "The joint gap is easier to find when the wing is slightly warm (15°C) — the cartilage softens slightly.",
          "For removing the wingette bone: push the smaller bone through to one end, then grip and pull while twisting.",
        ],
        commonMistakes: [
          "Cutting through bone rather than the joint — creates bone splinters and blunts the knife rapidly.",
          "Not drying before frying or roasting — moisture on the skin creates steam and prevents crisping.",
          "Saucing before cooking (for crispy wings) — sauce causes steam. Always sauce after cooking, not before.",
        ],
        cookingApplications: [
          "Deep-fried then tossed in buffalo sauce",
          "Oven-roasted at 220°C until crispy (45–50 min), tossed in glaze",
          "Grilled charcoal wings (Korean or Middle Eastern style)",
          "Slow-braised then fried for sticky, falling-off-the-bone results",
        ],
        trimRecovery: [
          { use: "Chicken stock / ramen broth", notes: "Wing tips and any trimmings — wings produce the most gelatinous stock of any chicken part." },
          { use: "Fried wing tips (staff snack)", notes: "Crispy fried wing tips are a legitimate (and delicious) staff meal component in many Asian kitchens." },
        ],
      },
    ],
  },
  {
    id: "fish-round",
    label: "Fish (Round)",
    cuts: [
      {
        id: "salmon-side",
        name: "Salmon Side",
        aka: ["Salmon fillet", "Side of Atlantic salmon"],
        primal: "Whole salmon, broken to side",
        description:
          "Rich, fatty fillet from Atlantic or Pacific salmon. Pin bones run through the first third. High fat content means it's very forgiving — less susceptible to drying than lean fish. Pin bone removal is essential for service.",
        expectedYieldPercent: "82–90%",
        typicalPortionGrams: "160–200g",
        trimInstructions: [
          "Run your fingertip along the centre of the fillet to feel pin bones — they run diagonally into the flesh.",
          "Remove pin bones with fish tweezers (pin bone pliers): grip firmly and pull in the direction they sit (not straight up — they will tear).",
          "Remove the belly trim (thin fatty strip along the lower edge) — or portion it separately as salmon belly special.",
          "Trim the tail portion to a consistent rectangle — tail thins dramatically and overcooks quickly.",
          "Score the skin at 5mm intervals if pan-frying to prevent buckling.",
        ],
        knifeTips: [
          "Portion using a smooth, single drawing cut — pulling the knife toward you at a slight angle.",
          "A long, flexible salmon slicer gives the cleanest portions.",
          "For consistent portions: use a ruler and mark with the knife tip before committing the cut.",
          "Cut skin-side down for portioning — the skin stabilises the fillet on the board.",
        ],
        commonMistakes: [
          "Pulling pin bones straight up — tears the flesh. Pull at the natural angle they lie.",
          "Cutting through the portion rather than drawing the knife — compresses and tears the flesh.",
          "Not removing the belly trim before portioning — thin belly edge overcooks instantly.",
          "Missing pin bones on the last third of the fillet — they stop abruptly; don't stop checking early.",
        ],
        cookingApplications: [
          "Pan-seared salmon fillet (skin-on, sear skin-down first)",
          "Salmon en papillote",
          "Cured salmon / gravlax (belly and tail offcuts)",
          "Cold smoked (whole side, sliced thin)",
          "Tartare (trim and belly offcuts)",
        ],
        trimRecovery: [
          { use: "Salmon belly special", notes: "Belly strip — score skin, sear hot, 90 seconds. Serve as garnish or special." },
          { use: "Salmon tartare", notes: "Trim pieces from pin bone area — dice fine, season, serve chilled." },
          { use: "Gravlax / cure", notes: "Tail section and belly — excellent for a 48-hour cure with salt, sugar, dill." },
          { use: "Staff meal / salmon patties", notes: "Any trim — flake and form with potato and herb." },
          { use: "Fish stock", notes: "Skin (if not pin-boned): not suitable. Head and frame: simmer 20 min only." },
        ],
      },
      {
        id: "snapper-fillet",
        name: "Snapper Fillet",
        aka: ["Red emperor (similar)", "Sea bream (similar)"],
        primal: "Whole round fish",
        description:
          "Sweet, white-fleshed fish. Lean with a delicate texture — less forgiving than fatty fish. Yield from whole fish to portion is significantly lower. Skin is edible and crisps well when cooked correctly.",
        expectedYieldPercent: "35–45% from whole fish",
        typicalPortionGrams: "160–200g skin-on",
        trimInstructions: [
          "Scale the fish first if skin-on portions are planned — work tail to head against the scales.",
          "Fillet: lay fish flat, cut behind the pectoral fin to the backbone, then follow the backbone from head to tail with a flexible knife.",
          "Remove pin bones: feel along the lateral line with fingertips — fewer bones than salmon but present.",
          "Trim the belly cavity and any bloodline membrane.",
          "Portion skin-side down, cutting through with smooth strokes.",
        ],
        knifeTips: [
          "Use a flexible filleting knife — a rigid knife tears the flesh.",
          "Keep the blade flat against the backbone to minimise waste.",
          "Score skin before cooking to prevent buckling — one score per portion, parallel to the grain.",
          "Dry the skin well before searing — moisture steams the skin rather than crisping it.",
        ],
        commonMistakes: [
          "Not scaling before filleting skin-on portions — loose scales contaminate exposed flesh.",
          "Using a stiff knife on delicate white fish — tears rather than cuts.",
          "Over-handling — white fish is fragile at temperature. Minimise manipulation.",
        ],
        cookingApplications: [
          "Pan-seared, skin-side crispy (cook 70% on skin side before flipping)",
          "Whole roasted (whole fish, scored sides)",
          "Crumbed / panko snapper",
          "Steamed with ginger and soy",
        ],
        trimRecovery: [
          { use: "Fish cakes / patties", notes: "Off-cuts and belly trim — combine with potato, herbs, bind with egg." },
          { use: "Fish tartare / crudo", notes: "Clean, sushi-grade trim — dice and dress immediately." },
          { use: "Fish stock", notes: "Head, frame, bones — simmer 20 min max with white wine and aromatics. No longer or it becomes bitter." },
          { use: "Staff meal", notes: "Off-cuts — batter and fry, or crumb and oven-bake." },
        ],
      },
    ],
  },
  {
    id: "seafood",
    label: "Seafood",
    cuts: [
      {
        id: "prawns",
        name: "Prawns / Shrimp",
        aka: ["King prawns", "Tiger prawns", "Banana prawns"],
        primal: "Whole crustacean",
        description:
          "Yield from whole to peeled, deveined prawn varies significantly by size. Larger prawns yield better. Leaving the tail shell on is common for presentation. The digestive tract (vein) must be removed for quality presentation.",
        expectedYieldPercent: "55–70% (size-dependent)",
        typicalPortionGrams: "5–6 prawns per portion (king size)",
        trimInstructions: [
          "Twist and pull the head off — can be used for bisque or stock.",
          "Peel shell from the body, starting from the underside, working toward the tail.",
          "Leave the tail shell on for presentation (optional) or remove for bisque/sauce.",
          "Devein: make a shallow incision along the back, expose the dark intestinal tract, lift and remove.",
          "Butterfly: extend the back incision further for presentation or crumbing.",
        ],
        knifeTips: [
          "A small paring knife is most controlled for deveining.",
          "Score the back incision just 2–3mm — too deep and the prawn opens unevenly when cooked.",
          "For butterflying: cut almost to the belly, press flat.",
          "Work cold — warm prawns are slippery and harder to handle cleanly.",
        ],
        commonMistakes: [
          "Incomplete deveining — the vein is noticeable on a plate and indicates poor prep standard.",
          "Over-cutting when butterflying — prawns fall apart during cooking.",
          "Discarding heads — excellent flavour base for bisque, ramen broth, shellfish oil.",
        ],
        cookingApplications: [
          "Chargrill, pan-sear, tempura",
          "Prawn cocktail (poached, chilled)",
          "Butter-poached prawns",
          "Bisque / prawn stock (from heads and shells)",
        ],
        trimRecovery: [
          { use: "Shellfish bisque", notes: "Heads and shells — roast in oil until bright orange, add aromatics, deglaze, simmer and strain." },
          { use: "Shellfish oil / XO sauce", notes: "Dried shells — infuse in neutral oil for an intensely flavoured cooking medium." },
          { use: "Prawn butter", notes: "Shells blended with butter — strain and use as finishing butter for fish or pasta." },
          { use: "Staff meal / fritters", notes: "Broken or odd-shaped prawns — batter and fry, or mix into corn fritters." },
        ],
      },
      {
        id: "mussels",
        name: "Mussels",
        aka: ["Blue mussels", "Green lip mussels"],
        primal: "Whole live bivalve",
        description:
          "Live bivalves that must be treated carefully. Any open mussel that does not close when tapped sharply is dead and must be discarded. High-yield protein, low in waste when fresh.",
        expectedYieldPercent: "70–80% (discarding dead/broken shells)",
        typicalPortionGrams: "300–400g shell-on per serve",
        trimInstructions: [
          "Scrub shells under cold running water to remove any sediment or barnacles.",
          "Pull or cut the beard (byssus threads) from the side of the shell — pull toward the hinge, not the opening.",
          "Tap any open mussels firmly on the bench. Discard any that do not close within 5–10 seconds.",
          "Discard any with cracked or broken shells.",
          "Keep covered in a perforated container over ice — never in fresh water or a sealed bag.",
        ],
        knifeTips: [
          "Use a blunt mussel knife (or butter knife) for shucking if serving raw.",
          "For steaming whole: no knife required — cook just until shells open (2–3 minutes).",
          "Discard any shells that have not opened after cooking — do not force them open.",
        ],
        commonMistakes: [
          "Storing in water — dilutes flavour, accelerates death.",
          "Not discarding open mussels before cooking — a dead mussel is a food safety risk.",
          "Overcooking — mussels become rubbery within 30 seconds of opening. Pull immediately.",
          "Pulling the beard toward the opening (from the shell mouth) — tears the mussel body.",
        ],
        cookingApplications: [
          "Moules marinière (steamed in white wine, shallot, parsley)",
          "Moules frites",
          "Thai coconut mussels",
          "Baked half-shell (remove one shell, top with compound butter, bake)",
          "Mussel soup / chowder",
        ],
        trimRecovery: [
          { use: "Shellfish stock / clam juice substitute", notes: "Cooking liquid from steaming — strain through muslin for a pure shellfish broth." },
          { use: "Mussel oil", notes: "Cooking liquor reduced and blended with butter — finishing oil for fish." },
          { use: "Staff meal", notes: "Open mussels that lost presentation quality — toss with pasta and butter." },
        ],
      },
    ],
  },
];

// ── Pattern matching helpers ──────────────────────────────────────────────────

const PROTEIN_PATTERNS: Array<{ pattern: RegExp; categoryId: string; cutId?: string }> = [
  { pattern: /\bstriploin\b/i,                  categoryId: "beef",     cutId: "striploin" },
  { pattern: /\bny\s*strip\b/i,                 categoryId: "beef",     cutId: "striploin" },
  { pattern: /\beye\s*fillet\b/i,               categoryId: "beef",     cutId: "eye-fillet" },
  { pattern: /\btenderloin\b/i,                 categoryId: "beef",     cutId: "eye-fillet" },
  { pattern: /\brump\b/i,                       categoryId: "beef",     cutId: "rump" },
  { pattern: /\boyster\s*blade\b/i,             categoryId: "beef",     cutId: "oyster-blade" },
  { pattern: /\bflat\s*iron\b/i,                categoryId: "beef",     cutId: "oyster-blade" },
  { pattern: /\bbrisket\b/i,                    categoryId: "beef",     cutId: "brisket" },
  { pattern: /\bpork\s*shoulder\b/i,            categoryId: "pork",     cutId: "pork-shoulder" },
  { pattern: /\bpork\s*belly\b/i,               categoryId: "pork",     cutId: "pork-belly" },
  { pattern: /\bpork\s*loin\b/i,                categoryId: "pork",     cutId: "pork-loin" },
  { pattern: /\blamb\s*rack\b/i,                categoryId: "lamb",     cutId: "lamb-rack" },
  { pattern: /\brack\s*of\s*lamb\b/i,           categoryId: "lamb",     cutId: "lamb-rack" },
  { pattern: /\blamb\s*saddle\b/i,              categoryId: "lamb",     cutId: "lamb-saddle" },
  { pattern: /\blamb\s*shoulder\b/i,            categoryId: "lamb",     cutId: "lamb-shoulder" },
  { pattern: /\bchicken\s*maryland\b/i,         categoryId: "chicken",  cutId: "chicken-maryland" },
  { pattern: /\bleg\s*quarter\b/i,              categoryId: "chicken",  cutId: "chicken-maryland" },
  { pattern: /\bwhole\s*chicken\b/i,            categoryId: "chicken",  cutId: "whole-chicken" },
  { pattern: /\bsalmon\s*side\b/i,              categoryId: "fish-round", cutId: "salmon-side" },
  { pattern: /\bsalmon\s*fillet\b/i,            categoryId: "fish-round", cutId: "salmon-side" },
  { pattern: /\bsnapper\b/i,                    categoryId: "fish-round", cutId: "snapper-fillet" },
  { pattern: /\bprawn\b/i,                      categoryId: "seafood",  cutId: "prawns" },
  { pattern: /\bshrimp\b/i,                     categoryId: "seafood",  cutId: "prawns" },
  { pattern: /\bmussel\b/i,                     categoryId: "seafood",  cutId: "mussels" },
  // Generic protein matches (category-level only)
  { pattern: /\bbeef\b/i,                       categoryId: "beef" },
  { pattern: /\bpork\b/i,                       categoryId: "pork" },
  { pattern: /\blamb\b/i,                       categoryId: "lamb" },
  { pattern: /\bchicken\b/i,                    categoryId: "chicken" },
  { pattern: /\bsalmon\b/i,                     categoryId: "fish-round", cutId: "salmon-side" },
  { pattern: /\bfish\b/i,                       categoryId: "fish-round" },
  { pattern: /\bseafood\b/i,                    categoryId: "seafood" },
];

export type ButcheryMatch = {
  categoryId: string;
  cutId?: string;
  cut?: CutEntry;
  category?: ProteinCategory;
};

export function matchButcheryContext(text: string): ButcheryMatch | null {
  for (const { pattern, categoryId, cutId } of PROTEIN_PATTERNS) {
    if (pattern.test(text)) {
      const category = BUTCHERY_REFERENCE.find(c => c.id === categoryId);
      const cut = cutId ? category?.cuts.find(c => c.id === cutId) : undefined;
      return { categoryId, cutId, cut, category };
    }
  }
  return null;
}
