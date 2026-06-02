// ─── Subprimal Intelligence Layer ─────────────────────────────────────────────
//
// READ-ONLY. STATIC. EXPLANATORY ONLY.
//
// This layer describes structural decomposition, tissue behaviour, fabrication
// pathways, cooking implications, and menu construction possibilities per zone.
//
// HARD CONSTRAINTS:
//   - NO scoring, NO ranking, NO decision outputs
//   - NO imports from engine, decision, or ontology layers
//   - NO state, NO side effects
//   - Keyed by "animalId:zoneId" — same convention as ZoneIntelligence
//
// Language rules: explanatory + anatomical/culinary-technical + non-prescriptive.
//   ✓ "high collagen density requires prolonged thermal conversion for gelatin breakdown"
//   ✗ "best cooked slowly for tenderness"
//
// System position:
//   Engine → Intelligence → Ontology → Subprimal Intelligence → Chef Decision (read-only)

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SubprimalIntelligence = {
  zoneId:       string;
  canonicalCut: string;

  structuralBreakdown: Array<{
    name:             string;
    description:      string;
    separationMethod: string;
  }>;

  tissueLogic: {
    collagenDensity:  "low" | "medium" | "high";
    fatDistribution:  string;
    muscleType:       string;
  };

  fabricationPathways: Array<{
    derivedCut: string;
    technique:  string;
    outcome:    string;
  }>;

  cookingImplications: Array<{
    principle:   string;
    explanation: string;
  }>;

  menuApplications: Array<{
    concept:   string;
    reasoning: string;
  }>;
};

// ─── Dataset ───────────────────────────────────────────────────────────────────

const SUBPRIMAL: Record<string, SubprimalIntelligence> = {

  // ── COW ────────────────────────────────────────────────────────────────────

  "cow:rib": {
    zoneId:       "rib",
    canonicalCut: "Ribeye / Prime Rib",

    structuralBreakdown: [
      {
        name:             "Ribeye eye (longissimus dorsi)",
        description:      "The primary cylindrical muscle of the rib primal, running parallel to the vertebrae. Characterised by heavy intramuscular marbling distributed throughout the cross-section.",
        separationMethod: "Removed from rib bones by following the contour of the vertebral column; the eye separates cleanly from the surrounding cap muscle along a natural fat seam.",
      },
      {
        name:             "Ribeye cap (spinalis dorsi)",
        description:      "A crescent-shaped muscle wrapping the superior arc of the eye. Considered the most heavily marbled muscle in the rib section with a looser, coarser grain than the longissimus.",
        separationMethod: "Peeled away from the eye by cutting along the fat seam that runs between the spinalis and longissimus; the separation is blunt and follows the natural fascial plane.",
      },
      {
        name:             "Intercostal muscles and rib bones",
        description:      "Thin layers of muscle lying between the rib bones. Collagen-dense relative to the eye, with a tighter, tougher fibre structure from the mechanical work of respiration.",
        separationMethod: "Scraped from the bone using the tip of a boning knife, running flush with the bone surface; not typically incorporated into premium cuts.",
      },
    ],

    tissueLogic: {
      collagenDensity: "low",
      fatDistribution: "Heavy intramuscular marbling distributed uniformly through the longissimus cross-section; substantial intermuscular fat between the eye and cap; a thick external fat cap over the superior surface.",
      muscleType:      "Predominantly fast-twitch (type II) muscle fibres — the longissimus dorsi performs minimal postural work, resulting in fine grain, low connective tissue content, and high tenderness potential.",
    },

    fabricationPathways: [
      {
        derivedCut: "Bone-in ribeye steak (cowboy/tomahawk)",
        technique:  "Cross-section sawing between ribs at a defined thickness (typically 38–50mm); Frenching the rib bone by scraping periosteum and meat from a measured length of bone.",
        outcome:    "A thick, bone-in steak with the bone acting as a heat conductor and presentation element; the Frenched portion serves as a handle in tableside service.",
      },
      {
        derivedCut: "Boneless ribeye (scotch fillet)",
        technique:  "Rib bones removed by following the vertebral contour; intercostal muscle and dorsal fat trimmed; the resulting muscle roll is portioned across the grain.",
        outcome:    "A boneless cylindrical steak that displays the eye and cap in cross-section; yields a uniform portion weight across the roll.",
      },
      {
        derivedCut: "Standing prime rib roast",
        technique:  "Bones retained and chine bone removed for carving access; fat cap left intact to a defined thickness (6–10mm); tied between bones for structural stability during roasting.",
        outcome:    "A multi-bone roasting joint where bones conduct heat and provide visual structure; yields carved slices showing the full rib cross-section.",
      },
      {
        derivedCut: "Isolated spinalis dorsi (ribeye cap roll)",
        technique:  "Cap separated along the spinalis-longissimus seam; the cap is rolled, tied, and portioned transversely to produce individual medallions.",
        outcome:    "Highly marbled medallions with a coarser grain than the eye; the rolled format standardises portion thickness.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Low connective tissue permits rapid high-heat application",
        explanation: "The near-absence of collagen in the longissimus means heat does not need to be sustained long enough to convert collagen to gelatin. Rapid surface browning via Maillard reaction is achievable without risking internal toughening from collagen contraction.",
      },
      {
        principle:   "Intramuscular fat renders between 35–50°C, influencing texture and perceived juiciness",
        explanation: "Marbling fat liquefies within the cooking process before the muscle proteins reach full coagulation temperature (60–65°C). This renders fat into the muscle matrix rather than expelling it, contributing to the lubricated mouthfeel characteristic of high-marbled rib cuts.",
      },
      {
        principle:   "Grain orientation affects slice texture",
        explanation: "The longissimus runs longitudinally along the carcass. Portioning steaks across the grain (perpendicular to the muscle fibres) shortens individual fibre length in the eating slice, reducing perceived chewiness relative to along-the-grain cutting.",
      },
    ],

    menuApplications: [
      {
        concept:   "Dry-aged bone-in ribeye for tableside carving",
        reasoning: "Extended dry-ageing (28–45 days) concentrates umami compounds via enzymatic protein breakdown and moisture reduction. The bone-in format is structurally stable during extended ageing and the visual presentation supports tableside theatre.",
      },
      {
        concept:   "Spinalis cap medallion as a course component",
        reasoning: "The isolated cap muscle yields uniform medallions from the roll format, allowing precise portion control in a tasting-menu context. The coarser grain and higher fat content differentiate it texturally from tenderloin-style courses.",
      },
    ],
  },

  "cow:chuck": {
    zoneId:       "chuck",
    canonicalCut: "Chuck Roll / Flat Iron",

    structuralBreakdown: [
      {
        name:             "Flat iron (infraspinatus)",
        description:      "A fan-shaped muscle lying against the blade bone (scapula), separated from adjacent muscles by a prominent line of silverskin. One of the more tender muscles in the chuck despite the surrounding tough tissue.",
        separationMethod: "Isolated by following the scapular surface and removing the blade bone; the infraspinatus then separates from the under-blade muscles along a seam of connective tissue. The central line of silverskin running longitudinally through the muscle is removed after seaming.",
      },
      {
        name:             "Chuck roll eye",
        description:      "The longissimus muscle as it continues from the rib into the chuck. Less marbled than the rib extension, with heavier connective tissue wrapping and more pronounced seam fat between component muscles.",
        separationMethod: "Extracted after blade bone removal by following the contour of the cervical vertebrae; the eye separates from the under-blade and neck muscles along natural fat and fascial seams.",
      },
      {
        name:             "Under-blade muscles (complexus, multifidus)",
        description:      "A group of postural muscles lying beneath the blade bone, characterised by dense intramuscular connective tissue and coarse fibres from sustained vertebral support work.",
        separationMethod: "Removed from the blade bone by blunt and sharp dissection along the periosteum; typically used for grinding or braising applications due to the high connective tissue content.",
      },
    ],

    tissueLogic: {
      collagenDensity: "high",
      fatDistribution: "Heavy fat deposits between muscle groups (intermuscular); moderate intramuscular fat in the chuck roll eye; the flat iron contains relatively uniform fine marbling compared to surrounding muscles.",
      muscleType:      "Mixed slow-twitch (type I) and fast-twitch (type II) fibres depending on the specific muscle — postural neck and shoulder muscles are predominantly slow-twitch with high collagen; the flat iron is an outlier with finer fibre structure.",
    },

    fabricationPathways: [
      {
        derivedCut: "Flat iron steaks",
        technique:  "Infraspinatus seamed out from the blade; the central longitudinal silverskin strip is removed by running a boning knife parallel to the muscle surface on each half; the two halves are portioned across the grain.",
        outcome:    "Uniform steaks with consistent marbling; the silverskin removal is critical as it does not soften under heat and creates a hard barrier in the finished steak.",
      },
      {
        derivedCut: "Chuck roll steaks or Denver steaks",
        technique:  "Chuck roll eye seamed free; sub-muscles identified within the roll and selected portions (particularly the serratus ventralis) are isolated for steak cutting; portioned cross-grain at 20–30mm thickness.",
        outcome:    "Steaks with moderate to good marbling requiring longer cook times than rib equivalents due to higher connective tissue; often used in applications with mechanical or thermal pre-treatment.",
      },
      {
        derivedCut: "Short rib sections",
        technique:  "Rib bones retained with a defined thickness of overlying meat; cross-cut into flanken-style or left as plate-style English cut short ribs.",
        outcome:    "Bone-in braising pieces with high collagen and intramuscular fat that converts to gelatin and rendered fat during prolonged moist-heat cooking.",
      },
    ],

    cookingImplications: [
      {
        principle:   "High collagen density necessitates sustained moist heat for full gelatin conversion",
        explanation: "The dominant muscles of the chuck contain collagen concentrations that require temperatures of 80–95°C sustained over 3–6 hours to denature and convert to gelatin. Short heat exposure causes collagen to contract without converting, resulting in a tough, fibrous texture.",
      },
      {
        principle:   "Seam fat creates self-basting zones during long cooking",
        explanation: "The inter-muscle fat seams in the chuck liquefy progressively during prolonged cooking, migrating into adjacent muscle tissue and lubricating the protein matrix. This partially offsets the moisture loss from sustained high temperatures.",
      },
    ],

    menuApplications: [
      {
        concept:   "Braised short rib as a plated protein course",
        reasoning: "The bone-in format and high collagen content of the short rib produces a gelatinous, self-saucing result after extended braising. The bone provides structural integrity for portioning and presentation; the rendered collagen enriches the braising liquid.",
      },
      {
        concept:   "Flat iron as a value steak on the à la carte menu",
        reasoning: "The flat iron's relatively fine grain and moderate marbling — in contrast to surrounding chuck muscles — supports medium-rare service at a lower cost-per-portion than rib or loin equivalents. Silverskin removal is a non-negotiable preparation step.",
      },
    ],
  },

  "cow:brisket": {
    zoneId:       "brisket",
    canonicalCut: "Brisket Point + Flat",

    structuralBreakdown: [
      {
        name:             "Flat (pectoralis profundus)",
        description:      "The larger, leaner lower section of the brisket. A broad, thin muscle with long parallel fibres and a relatively uniform cross-section. The ventral fat cap covers the external surface of the flat.",
        separationMethod: "Separated from the point by cutting through the fat seam that runs diagonally between the two muscles; the flat is typically left intact for smoking or slicing applications.",
      },
      {
        name:             "Point (deckle / pectoralis superficialis)",
        description:      "The thicker, heavily marbled upper portion sitting atop the flat. Characterised by a dense concentration of intramuscular fat and a coarser, less uniform grain than the flat.",
        separationMethod: "Separated from the flat post-cook in smoked preparations by following the internal fat seam; raw separation follows the same seam and is used when point and flat are to be prepared differently.",
      },
      {
        name:             "Ventral fat cap",
        description:      "The thick external fat layer covering the flat's upper surface. A combination of subcutaneous fat and intermuscular fat, with typical raw thickness of 10–25mm.",
        separationMethod: "Trimmed to a defined residual thickness (typically 6–10mm for smoking) using a long slicing knife; complete removal is used for corned beef or pastrami applications requiring cure penetration.",
      },
    ],

    tissueLogic: {
      collagenDensity: "high",
      fatDistribution: "Thick external ventral fat cap over the flat; dense intramuscular marbling throughout the point; a prominent internal fat seam running between point and flat at their junction.",
      muscleType:      "Predominantly slow-twitch (type I) — the pectoral muscles bear a significant proportion of the animal's body weight during locomotion, resulting in heavily exercised fibres with high collagen content and a dense connective tissue matrix.",
    },

    fabricationPathways: [
      {
        derivedCut: "Whole packer brisket (point + flat intact)",
        technique:  "Minimal fabrication — fat cap trimmed to 6–10mm; hard fat deposits and excess point fat removed; the seam between point and flat left intact.",
        outcome:    "A single large piece retaining both muscles; the fat cap insulates the flat during long cooks and the point provides self-basting fat migration into the flat throughout the cooking process.",
      },
      {
        derivedCut: "Corned beef / pastrami",
        technique:  "Fat cap fully trimmed or reduced to 3mm; the flat is immersed in a sodium chloride and nitrate cure for 5–10 days under refrigeration; for pastrami, dried and coated in spice crust post-cure before smoking.",
        outcome:    "The salt cure draws moisture via osmosis, simultaneously denaturing some proteins and penetrating the muscle with salt and cure agents; the cured flat yields a stable colour (pink) via myoglobin-nitrite reaction.",
      },
      {
        derivedCut: "Sliced flat portions",
        technique:  "Post-cook flat separated from the point; sliced against the grain at 8–12mm thickness; grain direction in the flat changes across the muscle length and requires tracking.",
        outcome:    "Uniform slices displaying the flat's layered structure; grain direction is critical — with-grain slicing produces stringy results; against-grain disrupts fibre continuity and reduces perceived toughness.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Collagen-to-gelatin conversion requires sustained internal temperature of 88–96°C for 12–18 hours",
        explanation: "The brisket's collagen matrix is among the densest in the carcass. Full conversion to gelatin requires not just reaching temperature but maintaining it long enough for the triple-helix collagen structure to fully denature. Premature removal results in collagen contraction without gelatin production — perceived as tight, dry texture despite adequate internal temperature.",
      },
      {
        principle:   "The stall (evaporative plateau) occurs at approximately 65–75°C internal temperature",
        explanation: "Evaporative cooling from surface moisture loss temporarily equalises with the heat input rate, creating a temperature plateau that can last several hours. The fat cap retards surface moisture loss, extending the stall but also maintaining the flat's moisture content through this phase.",
      },
      {
        principle:   "Fat cap orientation relative to heat source affects moisture retention in the flat",
        explanation: "Positioning the fat cap between the heat source and the flat meat causes rendered fat to migrate toward the flat rather than away from it, providing ongoing lubrication of the muscle fibres during the extended cook.",
      },
    ],

    menuApplications: [
      {
        concept:   "Smoked whole brisket as a carved centrepiece",
        reasoning: "The visual presentation of a whole smoked brisket — bark formation, smoke ring, contrasting point and flat textures — supports both à la carte carving service and large-format sharing presentations. The point provides fatty, shredded portions while the flat yields structured slices.",
      },
      {
        concept:   "Pastrami as a cured preparation for cold or hot service",
        reasoning: "The nitrate cure converts the brisket flat to a stable shelf-life product that can be held, sliced cold, or steamed to order. The cure penetration depth is directly proportional to flat thickness and brine concentration, making the flat's uniform cross-section preferable to the irregular point.",
      },
    ],
  },

  "cow:short_loin": {
    zoneId:       "short_loin",
    canonicalCut: "Strip Loin / Tenderloin (T-bone/Porterhouse)",

    structuralBreakdown: [
      {
        name:             "Strip loin (longissimus lumborum)",
        description:      "The lumbar extension of the longissimus, running along the dorsal surface of the lumbar vertebrae. Finer-grained and less marbled than the rib equivalent due to reduced fat deposition in the lumbar region.",
        separationMethod: "Separated from the vertebral column by running a knife along the transverse processes and vertebral bodies; the strip loin is removed as a single continuous muscle roll with fat cap intact.",
      },
      {
        name:             "Tenderloin (psoas major)",
        description:      "The least-worked muscle in the carcass, lying beneath the lumbar vertebrae in the sub-lumbar region. Characterised by an extremely fine grain, minimal connective tissue, and a tapered bullet shape from the butt end to the chain end.",
        separationMethod: "Pulled and seamed free from the vertebral attachment with minimal knife work; the silver skin (fascia) along the top surface is removed by angling a boning knife beneath it and running along the muscle surface; the chain (psoas minor) is removed separately.",
      },
      {
        name:             "T-bone and Porterhouse (whole cross-section)",
        description:      "The vertebrae, strip loin, and tenderloin combined into a single cross-sectional cut. The T-bone is defined by a smaller tenderloin section (from the anterior short loin); the Porterhouse by a larger tenderloin section (from the posterior short loin).",
        separationMethod: "Sawn perpendicular to the vertebral column at defined thicknesses using a band saw; chine bone sawed free from the vertebral bodies for carving access.",
      },
    ],

    tissueLogic: {
      collagenDensity: "low",
      fatDistribution: "Moderate intermuscular fat cap on the strip loin (3–8mm after trimming); minimal intramuscular fat in the tenderloin; light marbling in the strip loin relative to the rib.",
      muscleType:      "The psoas major is the anatomical definition of low-activity muscle — it performs no postural or locomotion function, resulting in near-zero connective tissue and the finest fibre diameter of any primal. The strip loin (longissimus lumborum) is similarly low-activity compared to the chuck or round.",
    },

    fabricationPathways: [
      {
        derivedCut: "NY strip steak (boneless strip loin)",
        technique:  "Vertebrae removed; fat cap trimmed to 6–8mm; the strip is squared and portioned across the grain at 25–38mm thickness.",
        outcome:    "A rectangular steak with a defined fat margin on one edge; the trimmed fat cap provides flavour during cooking and a visual boundary for portion presentation.",
      },
      {
        derivedCut: "Filet mignon",
        technique:  "Tenderloin trimmed of chain and silverskin; the centre section is portioned at defined thickness (50–65mm); tail end is folded and tied for uniform thickness; head (butt) end is reserved for châteaubriand or tournedos.",
        outcome:    "Cylindrical medallions with no connective tissue; silverskin removal is critical as it contracts under heat and deforms the medallion shape.",
      },
      {
        derivedCut: "T-bone / Porterhouse",
        technique:  "Band-saw cutting perpendicular to the vertebral column at 32–50mm; chine bone removed with a hand saw for carving; the distinction between T-bone and Porterhouse is defined by the USDA as the minimum tenderloin width at the cut face.",
        outcome:    "A compound steak presenting both strip and tenderloin in a single cut; the bone conducts heat differently between the two muscles, requiring the cook to account for each muscle's different thermal response.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Near-absence of collagen in the psoas major eliminates any requirement for collagen conversion time",
        explanation: "The tenderloin contains virtually no intramuscular collagen beyond the fascial surface layer. All thermal work goes directly toward protein coagulation in the muscle fibres themselves, making the tenderloin the most responsive cut to rapid high-heat application in the carcass.",
      },
      {
        principle:   "Compound cuts (T-bone/Porterhouse) present two muscles with different thermal responses in a single piece",
        explanation: "The strip loin and tenderloin reach the same internal temperature at different rates and textures due to differences in fibre density, fat content, and proximity to the bone. Managing the differential requires either accepting variance in doneness or adjusting heat application to balance the two muscles.",
      },
    ],

    menuApplications: [
      {
        concept:   "Chilled tenderloin carpaccio as a cold course",
        reasoning: "The tenderloin's near-zero connective tissue and fine grain structure allows it to be sliced paper-thin when well-chilled. The absence of collagen means it does not toughen when sliced raw, and the fine grain presents a smooth surface texture on the plate.",
      },
      {
        concept:   "Bone-in strip steak as an à la carte centrepiece",
        reasoning: "The bone-in strip retains the vertebral section adjacent to the strip loin, adding mass and visual scale to the plate. Bone contact slows the rate of heat penetration at the adjacent muscle surface, producing a gradient of doneness away from the bone that is a characteristic of bone-in service.",
      },
    ],
  },

  "cow:round": {
    zoneId:       "round",
    canonicalCut: "Round (Top / Bottom / Eye / Tip)",

    structuralBreakdown: [
      {
        name:             "Top round (semimembranosus)",
        description:      "The largest single muscle of the round, with a broad, flat cross-section and long, parallel fibres oriented along the leg axis. Lean with minimal intramuscular fat.",
        separationMethod: "Seamed free by following the fascial plane between the semimembranosus and biceps femoris; the separation runs along the natural boundary without knife penetration into the muscle itself.",
      },
      {
        name:             "Bottom round (biceps femoris)",
        description:      "A longer, more cylindrical muscle on the outer face of the round. Divided internally into a short head (more tender) and long head (tougher) by a partial fascial boundary.",
        separationMethod: "Seamed from the top round along the fascial plane; the long and short heads can be further separated by blunt dissection following the internal partial seam.",
      },
      {
        name:             "Eye of round (semitendinosus)",
        description:      "A cylindrical muscle with a distinctive cross-sectional circular profile, running along the posterior of the round. Very lean with tight, long fibres and a prominent silverskin wrapping.",
        separationMethod: "Pulled free from surrounding muscles with minimal knife work; the external silverskin is retained for whole-muscle preparations (bresaola, roast beef) as it provides structural integrity.",
      },
      {
        name:             "Sirloin tip / knuckle (quadriceps group)",
        description:      "A cluster of four muscles on the anterior face of the round forming the stifle joint cap. Each muscle has a different grain orientation, making the group amenable to seam separation.",
        separationMethod: "Individual muscles (rectus femoris, vastus medialis, vastus lateralis, vastus intermedius) seamed apart along fascial boundaries; the rectus femoris is the most tender and is typically separated for steak cutting.",
      },
    ],

    tissueLogic: {
      collagenDensity: "medium",
      fatDistribution: "Minimal intramuscular fat throughout — the round muscles are among the leanest in the carcass; intermuscular fat between muscle groups is moderate; a thin external fat layer covers the round's outer surface.",
      muscleType:      "Predominantly slow-twitch (type I) — the hindquarter muscles perform continuous postural and locomotion work, resulting in dense fibre packing and elevated collagen relative to loin or rib, but not as high as the brisket or shank.",
    },

    fabricationPathways: [
      {
        derivedCut: "Bresaola (cured eye of round)",
        technique:  "Eye of round silverskin intact; wet or dry-cured with salt, sodium nitrate, and aromatics for 7–14 days; air-dried under controlled humidity and temperature until approximately 30% weight loss is achieved.",
        outcome:    "A compact, deep-red cylindrical cured product. The silverskin retains the uniform shape during drying and prevents excessive external case-hardening. The lean fibre structure allows even cure penetration.",
      },
      {
        derivedCut: "Minute steaks / sandwich steaks",
        technique:  "Top or bottom round sliced against the grain at 10–15mm; mechanically tenderised by blade or needle tenderisation to disrupt the long fibre continuity; sometimes pounded between plastic film.",
        outcome:    "Thin steaks with disrupted fibre structure that reduces perceived toughness at the eating stage; the mechanical disruption also accelerates marinade penetration.",
      },
      {
        derivedCut: "Roast beef joint",
        technique:  "Top round left intact; silverskin and external sinew removed; tied into a cylindrical shape for consistent heat distribution; optional flavour crust applied to the surface.",
        outcome:    "A large roasting joint suited to slicing service; the absence of fat throughout means the internal temperature rise is faster than fattier cuts, and the target window for moist carving is narrower.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Lean muscle mass accelerates moisture loss above 70°C internal temperature",
        explanation: "Without the insulating and lubricating effects of intramuscular fat, protein coagulation above 70°C rapidly expels intracellular moisture from the lean fibres. The round's low fat content means the window between adequate internal temperature and excessive dryness is narrower than for marbled cuts.",
      },
      {
        principle:   "Long fibre orientation along the leg axis makes grain direction critical for every preparation",
        explanation: "The round muscles have some of the longest fibre runs in the carcass. Cutting along the grain maintains fibre continuity and produces a stringy, chewy eating result. Perpendicular cross-grain cutting minimises fibre length in the eating slice and is the standard approach for all steak applications.",
      },
    ],

    menuApplications: [
      {
        concept:   "Bresaola as a cured meat course or antipasto component",
        reasoning: "The eye of round's cylindrical shape, lean profile, and dense fibre structure make it the reference muscle for bresaola production. The uniform cross-section produces consistent slice dimensions throughout the entire muscle. The low fat content accepts cure flavour without the competing richness that higher-fat muscles introduce.",
      },
      {
        concept:   "Slow-roasted top round for carving station or charcuterie service",
        reasoning: "The top round's size and relatively uniform shape suit large-format roasting for sliced carving service. The lean profile means the roast is sliced thin; the absence of fat renders it well-suited to preparations where the accompanying sauce or garnish carries the fat component of the dish.",
      },
    ],
  },

  // ── PIG ────────────────────────────────────────────────────────────────────

  "pig:shoulder": {
    zoneId:       "shoulder",
    canonicalCut: "Boston Butt / Picnic Shoulder",

    structuralBreakdown: [
      {
        name:             "Boston butt (upper shoulder)",
        description:      "The upper portion of the shoulder above the elbow joint, containing the blade bone (scapula). A heavily marbled collection of muscles with pronounced inter-muscle fat seams and coarse fibre structure.",
        separationMethod: "Separated from the picnic shoulder at the elbow joint; the blade bone is removed by following the scapular surface with a boning knife, separating the muscle groups from the periosteum without destroying the inter-muscle seams.",
      },
      {
        name:             "Money muscle (pectoralis major section)",
        description:      "A distinct cylindrical column of muscle on the lower exterior face of the Boston butt, with a finer grain and higher intramuscular fat than the surrounding muscles. Identifiable by its location near the lateral surface.",
        separationMethod: "Located and marked before cooking; in competition preparation, scored or separated partially to allow full smoke penetration; in service, removed as an intact cylinder for slicing.",
      },
      {
        name:             "Picnic shoulder (lower shoulder)",
        description:      "The lower portion of the shoulder including the foreshank and skin. Higher collagen content than the butt due to the shank musculature; the skin layer adds structural complexity.",
        separationMethod: "Skin-on preparations leave the hide intact; skinless preparations use a scraping technique to remove skin without penetrating the subcutaneous fat layer; the foreshank is separated at the elbow for individual preparation if required.",
      },
    ],

    tissueLogic: {
      collagenDensity: "high",
      fatDistribution: "Heavy intermuscular fat seams between major muscle groups; moderate to high intramuscular marbling throughout the Boston butt; a defined subcutaneous fat cap over the external surface of the picnic.",
      muscleType:      "Mixed slow-twitch and fast-twitch fibres — the shoulder performs heavy mechanical work in foraging and locomotion; collagen content is elevated throughout, particularly in the picnic section.",
    },

    fabricationPathways: [
      {
        derivedCut: "Whole bone-in Boston butt for slow cooking",
        technique:  "Blade bone retained; fat cap trimmed or scored for heat penetration; minimal surface preparation; the bone-in format slows heat transfer to the centre and extends cooking time.",
        outcome:    "A large bone-in roasting piece where the scapula acts as a heat sink and structural anchor; yields both pulled and sliceable portions depending on the internal muscles reached.",
      },
      {
        derivedCut: "Coppa / capicola",
        technique:  "The neck-collar section (serratus ventralis and surrounding neck muscles) seamed from the butt; cured with salt and aromatics; tied into a cylinder and air-dried for 6–12 weeks at defined humidity.",
        outcome:    "A cured whole-muscle product with visible fat marbling in cross-section; the salt cure and drying process concentrates flavour and firms the texture to a sliceable consistency.",
      },
      {
        derivedCut: "Ground pork",
        technique:  "Picnic and under-blade muscles ground through a defined plate size (coarse or fine depending on application); fat content adjusted by incorporating or excluding fat trim.",
        outcome:    "A ground product with a defined fat percentage; the high collagen content of shoulder muscles partially emulsifies during grinding and contributes binding properties in formed products (sausages, patties).",
      },
    ],

    cookingImplications: [
      {
        principle:   "High collagen content requires internal temperature of 85–96°C sustained for 8–14 hours for full gelatin conversion",
        explanation: "The dense collagen matrix of pork shoulder undergoes full triple-helix denaturation only with prolonged exposure at elevated temperature. Insufficient time at temperature results in partial conversion — the muscle will seem cooked but will resist the fibre separation characteristic of pulled preparations.",
      },
      {
        principle:   "Intermuscular fat seams migrate during slow cooking and self-baste the surrounding lean muscle",
        explanation: "As the fat between muscle groups liquefies, it follows gravity and capillary action into the adjacent muscle tissue. This migration is a function of cooking time and orientation; positioning the fat seams above the lean muscle sections maximises downward fat migration.",
      },
    ],

    menuApplications: [
      {
        concept:   "Pulled pork as a high-yield shared plate or base protein",
        reasoning: "The Boston butt's collagen conversion during slow cooking produces a gelatinous matrix that coats the shredded fibres, creating the characteristic moist, sticky texture of pulled preparations. High collagen content is advantageous here rather than a constraint — it becomes the mechanism of succulence.",
      },
      {
        concept:   "Coppa as a charcuterie board anchor",
        reasoning: "The neck-collar section's visible intramuscular fat marbling produces an aesthetically structured cross-section in the sliced cured product. The fat distribution in this section is more uniform than in the butt proper, supporting consistent slice quality throughout the muscle.",
      },
    ],
  },

  "pig:loin": {
    zoneId:       "loin",
    canonicalCut: "Pork Loin / Rack / Tenderloin",

    structuralBreakdown: [
      {
        name:             "Loin eye (longissimus dorsi)",
        description:      "The primary muscle of the pork loin, running along the dorsal vertebrae from the shoulder to the hip. A large, cylindrical muscle with fine grain and low intramuscular fat relative to pork shoulder.",
        separationMethod: "Removed from the vertebral column and rib bones by following the vertebral contours; rib bones are sawn or hand-cut at the desired length for rack presentations.",
      },
      {
        name:             "Tenderloin (psoas major)",
        description:      "The sub-lumbar muscle of the pork loin, lying beneath the lumbar vertebrae. The leanest and most tender muscle in the pork carcass, with a fine fibre structure and a tapered shape.",
        separationMethod: "Pulled free from the vertebral attachment with minimal knife work; the silver skin along the surface is removed by running a boning knife beneath it at a shallow angle.",
      },
      {
        name:             "Back fat layer",
        description:      "The subcutaneous fat running over the dorsal surface of the loin. Thickness varies by breed and feeding regime; used in charcuterie as lardo or incorporated into sausages and pâtés.",
        separationMethod: "Removed by running a knife between the subcutaneous fat and the muscle surface; the separation follows the fascia layer at the fat-muscle boundary.",
      },
    ],

    tissueLogic: {
      collagenDensity: "low",
      fatDistribution: "Thin external back fat layer; minimal intramuscular fat in the loin eye; the tenderloin has near-zero fat. Fat is predominantly subcutaneous (back fat) rather than intramuscular.",
      muscleType:      "Predominantly fast-twitch (type II) — the pork loin muscles perform less sustained mechanical work than the shoulder, resulting in lower collagen content, finer grain, and higher tenderness potential.",
    },

    fabricationPathways: [
      {
        derivedCut: "French-trimmed rack of pork",
        technique:  "Rib bones exposed by scraping periosteum and meat from a defined length; chine bone removed for carving access; fat cap scored in a crosshatch for rendering and presentation.",
        outcome:    "A bone-in roasting joint with exposed rib bones for visual presentation; the fat cap scoring allows rendered fat to drain rather than pool, producing a more even surface texture.",
      },
      {
        derivedCut: "Back bacon / Canadian bacon",
        technique:  "Loin eye removed from ribs and fat; cured with salt, nitrate, and aromatics; cold-smoked or unsmoked depending on style; sliced against the grain.",
        outcome:    "A leaner cured product than belly bacon due to the loin eye's low fat content; the cure penetrates more rapidly through lean muscle than through fatty tissue.",
      },
      {
        derivedCut: "Pork tenderloin roulade",
        technique:  "Tenderloin butterflied by a single longitudinal cut; laid flat and filled with a stuffing; rolled and tied at defined intervals; portioned into medallions or left whole for roasting.",
        outcome:    "A compact cylinder with a stuffing core; the rolled format standardises portion thickness and provides a cross-sectional visual element when the medallion is cut.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Low collagen content creates a narrow window between target doneness and dryness",
        explanation: "Without collagen conversion to gelatin compensating for moisture loss, the lean loin eye dries rapidly above 65°C internal temperature. The pork loin reaches food-safe internal temperature (63°C) at a point where moisture content is still high; exceeding 70°C progressively expels intracellular moisture without any gelatin matrix to compensate.",
      },
      {
        principle:   "Back fat renders at 35–40°C, influencing surface texture during high-heat cooking",
        explanation: "The subcutaneous back fat begins rendering at relatively low temperatures. In high-heat applications (roasting, grilling), surface fat can be rendered to a crisp texture while the adjacent loin muscle is still reaching target internal temperature. The fat cap thickness directly affects the rate and degree of external rendering.",
      },
    ],

    menuApplications: [
      {
        concept:   "Rack of pork as a sharing roast",
        reasoning: "The French-trimmed rack format provides the visual structure and carving theatre of a rack of lamb at a different price point. The fat cap scoring and bone-in format maintain internal moisture during oven roasting, partially compensating for the loin eye's low intramuscular fat content.",
      },
      {
        concept:   "Tenderloin as a precise portion-controlled protein in a tasting menu",
        reasoning: "The psoas major's uniform cylindrical shape across its centre section produces consistent portioning with predictable cooking behaviour. The near-zero connective tissue and low fat content make it the pork equivalent of a beef tenderloin — a rapid-cooking, high-delicacy item.",
      },
    ],
  },

  "pig:belly": {
    zoneId:       "belly",
    canonicalCut: "Pork Belly / Spare Ribs",

    structuralBreakdown: [
      {
        name:             "Belly skin",
        description:      "The external dermis layer covering the belly. Primarily collagen (elastin and collagen fibres) with minimal fat immediately beneath; produces crackling when rendered under high heat.",
        separationMethod: "Scored in parallel lines with a sharp knife to a depth that penetrates the skin without cutting into the fat layer beneath; full skin removal (for skinless preparations) achieved by running a knife along the skin-fat boundary.",
      },
      {
        name:             "Alternating fat and lean striations",
        description:      "The defining structural feature of belly — multiple layers of subcutaneous fat and lean muscle (serratus ventralis and related muscles) alternating in parallel horizontal bands. The ratio of fat to lean varies by breed and feeding.",
        separationMethod: "The striation layers are not typically separated in belly preparations; they are maintained intact for the visual cross-section. Individual layers can be separated after curing for specific applications.",
      },
      {
        name:             "Spare ribs (costal bones and intercostal muscle)",
        description:      "The rib bones running through the belly section with thin intercostal muscles between them. Higher collagen density than the belly muscle above due to the ribcage's mechanical role.",
        separationMethod: "Removed from the belly by running a knife along the rib bone surfaces (St. Louis cut trims the cartilaginous end; baby back ribs are separated at the spine).",
      },
    ],

    tissueLogic: {
      collagenDensity: "medium",
      fatDistribution: "High overall fat proportion (35–55% of raw weight depending on breed); fat is distributed in defined horizontal layers rather than intramuscularly; skin collagen converts to gelatin during prolonged moist or dry cooking.",
      muscleType:      "Mixed slow-twitch fibres in the lean striations; the intercostal muscles have higher collagen from respiratory function; the overall belly structure is dominated by adipose tissue rather than contractile muscle.",
    },

    fabricationPathways: [
      {
        derivedCut: "Streaky bacon",
        technique:  "Belly cured with salt and sodium nitrate (and optionally smoke); cured at 2–4°C for 5–10 days; cold-smoked or left green; sliced against the grain at 2–4mm on a reciprocating slicer.",
        outcome:    "Thin rashers showing the fat-lean striations in cross-section; slice thickness affects the ratio of rendering to crisping under heat.",
      },
      {
        derivedCut: "Porchetta",
        technique:  "Belly laid flat skin-side down; seasoned and layered with aromatics; rolled around the loin or with a vegetable filling; tied at close intervals; the skin is on the exterior of the roll and is scored.",
        outcome:    "A cylindrical preparation where the fat layers are distributed radially within the roll; the skin on the exterior renders to crackling during the roasting process.",
      },
      {
        derivedCut: "Rillettes",
        technique:  "Belly cut into cubes; confited in its own rendered fat at 80–90°C for 3–4 hours; shredded and packed into containers with the rendered fat covering the surface.",
        outcome:    "A spreadable preparation where the collagen converts to gelatin (which sets the rillettes on cooling) and the fat provides the carrying medium and preservation layer.",
      },
    ],

    cookingImplications: [
      {
        principle:   "The fat-to-lean ratio determines cure penetration rate and final product character",
        explanation: "Salt and cure agents penetrate lean muscle tissue faster than fat tissue due to the water-based nature of osmotic diffusion. High-fat belly sections require extended cure times relative to lean cuts of equivalent thickness, as penetration must proceed through fat layers to reach the lean striations beneath.",
      },
      {
        principle:   "Skin collagen converts to gelatin and then to crackling depending on cooking method and temperature",
        explanation: "Skin collagen first converts to soft gelatin during initial moist heat or low-temperature cooking. Subsequent high-heat application dehydrates this gelatin layer rapidly, producing the expansion and crisping associated with pork crackling. The sequence — collagen conversion first, then dehydration — is required for the characteristic blistered texture.",
      },
    ],

    menuApplications: [
      {
        concept:   "Slow-cooked then seared pork belly as a plated protein",
        reasoning: "The two-stage preparation (confit or sous-vide for collagen conversion, then searing for surface texture) exploits the belly's structural duality — the collagen converts during the low phase, and the fat renders and the skin crisps during the high-heat phase. The contrast between the gelatinous interior and the crisp exterior is the characteristic textural presentation.",
      },
      {
        concept:   "Rillettes as a charcuterie or entrée component",
        reasoning: "The belly's high fat and collagen content make it the reference material for rillette production — the fat provides the carrying medium, the lean provides the textured mass, and the converted collagen (gelatin) sets the structure at refrigeration temperature. The resulting texture is coarser and richer than a mousse-style preparation.",
      },
    ],
  },

  "pig:ham": {
    zoneId:       "ham",
    canonicalCut: "Ham (Rear Leg)",

    structuralBreakdown: [
      {
        name:             "Cushion muscle (semimembranosus)",
        description:      "The largest single muscle of the pork ham, with a broad, flat shape and relatively fine grain. The primary muscle in bone-in ham preparations and the reference for whole-muscle prosciutto production.",
        separationMethod: "Seamed from adjacent muscles by following the fascial boundary; the cushion's broad face separates cleanly from the inside round (biceps femoris) along a natural connective tissue plane.",
      },
      {
        name:             "Inside round (biceps femoris)",
        description:      "A cylindrical muscle on the outer face of the ham. Slightly coarser grain than the cushion with a defined seam running between its two heads.",
        separationMethod: "Separated from the cushion along the natural seam; the short and long heads can be further divided if required for specific fabrication.",
      },
      {
        name:             "Shank portion",
        description:      "The lower section of the ham including the tibia and associated shank musculature. Higher collagen density than the upper ham due to the shank muscles' postural and locomotion work.",
        separationMethod: "Separated at the stifle joint for bone-in shank preparations; boneless shank meat is typically incorporated into formed or ground products.",
      },
    ],

    tissueLogic: {
      collagenDensity: "low",
      fatDistribution: "Thin intermuscular fat seams between major muscle groups; a defined subcutaneous fat cap on the exterior surface; the cushion and inside round muscles are lean with minimal intramuscular fat.",
      muscleType:      "Predominantly slow-twitch with moderate collagen — the hindquarter performs sustained locomotion work, but pork ham muscles are generally less collagen-dense than equivalent beef round muscles due to differences in body weight borne per limb.",
    },

    fabricationPathways: [
      {
        derivedCut: "Whole bone-in cured ham",
        technique:  "Femur retained; the natural cavities around the aitch bone and femur are injected with cure brine or packed with dry cure; the surface is cured and the ham is held under refrigeration for 3–10 days per kilogram of weight.",
        outcome:    "A large bone-in cured joint where cure penetration follows the natural seams and bone cavities; the bone-in format preserves shape during curing and provides structural integrity for extended ageing.",
      },
      {
        derivedCut: "Prosciutto / Jamón serrano (air-dried whole ham)",
        technique:  "Femur retained; salt-cured at refrigeration temperature for a defined period based on weight; hung vertically and air-dried under controlled temperature and humidity for 12–36 months; the 'maestro' trims and monitors the suet (lard) surface coating during ageing.",
        outcome:    "A dense, deeply flavoured cured product where enzymatic activity during ageing breaks down proteins and fats, developing characteristic amino acid compounds (glutamate, inosinate) contributing umami intensity. Moisture loss reaches 25–35% of original green weight.",
      },
      {
        derivedCut: "Gammon steaks",
        technique:  "Boneless ham (femur removed); cured as a whole muscle; sliced across the grain at 15–20mm thickness.",
        outcome:    "Individual cured steaks with a defined lean cross-section; the cure gives a characteristic pink colour (nitrosomyoglobin) and a defined salt penetration throughout.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Salt cure penetrates lean ham muscle via osmosis at a rate dependent on temperature, salt concentration, and tissue density",
        explanation: "Osmotic pressure drives salt from the high-concentration cure medium into the lower-concentration muscle tissue. Penetration rate slows as the concentration gradient equalises. Bone-in hams require longer cure periods as the bone and sheath tissue slow penetration into the deeper muscle groups.",
      },
      {
        principle:   "Extended air-drying concentrates flavour via enzymatic protein and fat breakdown (proteolysis and lipolysis)",
        explanation: "During prolonged drying, the ham's endogenous enzymes (proteases and lipases) remain active at refrigeration-range temperatures and progressively break down muscle proteins into free amino acids and fat into free fatty acids. These compounds — particularly glutamate, inosinate, and specific fatty acid derivatives — accumulate and contribute the flavour complexity associated with long-aged hams.",
      },
    ],

    menuApplications: [
      {
        concept:   "Prosciutto crudo as a charcuterie or antipasto component",
        reasoning: "The long-aged ham's sliceability, concentrated flavour, and translucent fat distribution make it a reference charcuterie product. Slicing at 1–1.5mm reveals the fat seams and lean muscle cross-section; the fat at room temperature should be soft and the lean firm but not brittle.",
      },
      {
        concept:   "Glazed whole ham as a celebratory or carving centrepiece",
        reasoning: "The whole bone-in cured ham provides a visually dramatic carving format with a defined presentation side. The fat cap and skin surface, when scored and glazed with a sugar-based reduction, produce a caramelised crust via Maillard reaction and caramelisation that contrasts with the moist interior.",
      },
    ],
  },

  // ── LAMB ───────────────────────────────────────────────────────────────────

  "lamb:rack": {
    zoneId:       "rack",
    canonicalCut: "Rack of Lamb",

    structuralBreakdown: [
      {
        name:             "Eye of loin (longissimus dorsi)",
        description:      "The primary muscle of the lamb rack, lying along the dorsal rib cage. Smaller in diameter than the beef equivalent, with fine grain and a distinct fat cap. The eye is the primary eating muscle in all rack preparations.",
        separationMethod: "Exposed by removing rib bones for boneless preparations, or left bone-in for rack presentations; in both cases, the cap muscle is either removed or retained depending on the preparation style.",
      },
      {
        name:             "Fat cap and fell membrane",
        description:      "A defined layer of subcutaneous fat covering the dorsal surface of the eye, overlaid by the 'fell' — a thin, paper-like membrane of connective tissue. The fell can be retained or removed before cooking.",
        separationMethod: "Fell is removed by pinching and peeling; the fat cap is trimmed to a defined thickness (3–6mm for rack presentations); French-trimming of the bones removes meat and periosteum from the rib bones above the eye.",
      },
      {
        name:             "Rib bones (8 ribs per rack)",
        description:      "The rib bones serve as structural elements in the rack presentation and as heat conductors during cooking. Each bone corresponds to a single cutlet when the rack is portioned.",
        separationMethod: "French-trimming is achieved by scoring around the bone 50–75mm from the eye of the meat; meat and periosteum above the score line are removed using the back of a knife or a metal scraper, leaving clean bone.",
      },
    ],

    tissueLogic: {
      collagenDensity: "low",
      fatDistribution: "External fat cap over the dorsal surface; minimal intramuscular marbling (lamb's fat deposition pattern is predominantly subcutaneous); the fat has a lower melting point than beef (approx. 35–40°C) due to its fatty acid composition.",
      muscleType:      "Fast-twitch (type II) dominant — the longissimus dorsi of a young lamb performs minimal sustained mechanical work, resulting in fine-grained muscle with low connective tissue and high tenderness potential.",
    },

    fabricationPathways: [
      {
        derivedCut: "French-trimmed rack",
        technique:  "Score line made 50–75mm from the eye; meat and periosteum scraped from the rib bones above the score; chine bone removed with a hand or band saw; fat cap trimmed to 3–5mm; rack can be left as 6–8 bones or divided into smaller sections.",
        outcome:    "A visually structured preparation where the exposed white rib bones provide a natural handle for cutlet service; the French-trimmed bone length is standardised for consistent plate presentation.",
      },
      {
        derivedCut: "Individual lamb cutlets",
        technique:  "Rack portioned between each rib bone; each cutlet yields a single bone with the eye of loin and fat cap attached.",
        outcome:    "Individual portions from the rack; the bone acts as a handle in plated service; the small eye diameter of lamb produces a more delicate portion than beef rib equivalents.",
      },
      {
        derivedCut: "Crown roast",
        technique:  "Two French-trimmed racks formed into a circle with the rib bones pointing upward; the inner curve is scored to allow bending; the two racks are tied together at the base to form the crown shape.",
        outcome:    "A whole-table centrepiece preparation; the hollow crown interior can be filled for presentation; carved tableside by separating between each rib bone.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Young animal muscle with minimal collagen responds rapidly to high-heat application",
        explanation: "Lamb rack from young animals (lamb up to 12 months) has a collagen content significantly lower than mature sheep. The absence of connective tissue means heat work goes directly to muscle protein coagulation, and the narrow window between rare and medium is reached quickly.",
      },
      {
        principle:   "Rib bones conduct heat inward toward the eye, creating a temperature gradient adjacent to the bone",
        explanation: "Bone has a lower specific heat than muscle tissue and conducts heat differently. The muscle immediately adjacent to the rib bone reaches higher temperatures faster than the centre of the eye, creating a cooked margin around the bone. This is a structural characteristic of bone-in preparations.",
      },
      {
        principle:   "Lamb fat has a low melting point and begins rendering at approximately 35–40°C",
        explanation: "The fatty acid composition of lamb fat — with a higher proportion of lower-chain saturated fatty acids than beef — results in a lower melting point. The fat cap begins to render at temperatures below full muscle protein coagulation, meaning external fat rendering and internal doneness can be managed relatively independently.",
      },
    ],

    menuApplications: [
      {
        concept:   "Whole French-trimmed rack as a sharing or centrepiece course",
        reasoning: "The rack format's visual clarity — white exposed bones, fat cap, compact eye — produces a structural plate presentation without additional garnish manipulation. The portion format (one or two cutlets per person) is precise and consistent throughout the rack.",
      },
      {
        concept:   "Individual lamb cutlets for high-volume or function service",
        reasoning: "Pre-portioned cutlets allow service without carving; each portion is self-contained. The bone handle facilitates service and eating without cutlery in canape or standing formats. The small eye size relative to beef allows broader deployment in tasting or multi-course contexts.",
      },
    ],
  },

  "lamb:leg": {
    zoneId:       "leg",
    canonicalCut: "Leg of Lamb",

    structuralBreakdown: [
      {
        name:             "Topside (semimembranosus)",
        description:      "The largest muscle on the inner face of the leg, with a broad, flat cross-section and long parallel fibres. The primary lean muscle in whole leg roasting preparations.",
        separationMethod: "Seamed from the silverside by following the fascial plane on the inner face of the leg; the topside separates cleanly with minimal knife work along the natural boundary.",
      },
      {
        name:             "Silverside (biceps femoris)",
        description:      "A cylindrical muscle on the outer face of the leg with a coarser grain than the topside. Contains a partial internal seam between its two heads.",
        separationMethod: "Separated from the topside and knuckle along natural seam lines; the two heads can be divided further by blunt dissection.",
      },
      {
        name:             "Knuckle (stifle joint muscles)",
        description:      "A group of muscles around the stifle joint with varying grain orientations. More collagen-dense than the topside and silverside due to the joint-stabilising function of these muscles.",
        separationMethod: "Removed from the leg by seaming around the joint; individual muscles (patella, rectus femoris equivalent) can be separated along fascial boundaries.",
      },
      {
        name:             "Aitch bone and femur",
        description:      "The pelvis (aitch bone) and femur are the structural bones of the leg, with muscle groups attached on all faces. The femur runs the length of the upper leg; the aitch bone forms the hip attachment point.",
        separationMethod: "Femur removed for boneless preparations by following the bone surface with a boning knife along its entire length; the aitch bone is removed at the hip socket by following the round head of the femur.",
      },
    ],

    tissueLogic: {
      collagenDensity: "medium",
      fatDistribution: "Moderate intermuscular fat between major muscle groups; a thin external fat layer over the leg's surface; minimal intramuscular fat — the leg muscles are lean relative to the shoulder and belly.",
      muscleType:      "Slow-twitch (type I) dominant — the leg muscles perform sustained locomotion; moderate collagen content relative to the shoulder, but higher than the rack or loin.",
    },

    fabricationPathways: [
      {
        derivedCut: "Whole bone-in leg roast",
        technique:  "Aitch bone removed for carving access (or left for presentation); femur retained; surface fat trimmed to 3–5mm; leg can be tied through the shank loop for compact roasting.",
        outcome:    "A large bone-in roasting joint; the femur acts as a heat conductor along the axis of the leg; carving follows the bone to yield slices of different muscles — each with its own grain direction.",
      },
      {
        derivedCut: "Butterflied leg",
        technique:  "All bones removed; the leg is opened along the femur line and spread flat; the thicker sections are scored to equalise depth; the butterflied surface is marinated or seasoned before cooking.",
        outcome:    "A flat, boneless preparation that cooks faster than a bone-in leg; the uneven thickness of the natural muscles produces a gradient of doneness — thinner areas cook faster than the thick topside section.",
      },
      {
        derivedCut: "Shawarma / doner (vertical spit) preparation",
        technique:  "Leg muscles seamed apart; individual muscles stacked alternately lean-fat-lean on a vertical spit; compressed and tied to form a uniform cylinder.",
        outcome:    "The stacked muscle format creates an artificial uniform density that rotates consistently and shaves evenly from the exterior as the outer layer reaches temperature.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Moderate collagen requires careful thermal management — insufficient heat time results in tight connective tissue; excessive heat dries the lean muscle",
        explanation: "The leg's collagen content is intermediate between the rack (low) and the shoulder (high). Short roasting times can leave connective tissue in the knuckle and silverside underconverted; prolonged roasting at high temperatures dries the lean topside. The two constraints operate in opposite directions.",
      },
      {
        principle:   "Bone-in cooking produces a gradient of doneness along the femur axis",
        explanation: "The femur conducts heat along its length from the external surfaces of the joint. Muscle tissue adjacent to the bone near the exposed shank cooks faster than the deep topside against the aitch end. Carving order (shank end first) can manage this gradient in whole-table carving service.",
      },
    ],

    menuApplications: [
      {
        concept:   "Carved whole bone-in leg for table or carving station service",
        reasoning: "The whole leg's visual scale and the theatre of tableside carving supports large-format and banquet applications. The variety of muscles (topside, silverside, knuckle) along the leg produces different textures and doneness levels in the carved slices, providing natural variation across a shared portion.",
      },
      {
        concept:   "Butterflied grilled leg as a quick-service format",
        reasoning: "Removing the bones and butterflying the leg dramatically reduces cooking time compared to the bone-in equivalent, enabling à la carte service. The open surface maximises Maillard browning exposure. The thickness gradient across the butterflied leg accommodates different doneness preferences across the joint.",
      },
    ],
  },

  "lamb:shoulder": {
    zoneId:       "shoulder",
    canonicalCut: "Lamb Shoulder",

    structuralBreakdown: [
      {
        name:             "Blade muscle group",
        description:      "The primary muscles overlying the scapula — including the infraspinatus, supraspinatus, and teres major — forming the upper face of the shoulder. Moderate collagen content with visible seam fat between the individual muscles.",
        separationMethod: "Separated from the neck end muscles along the natural fascial boundaries; individual muscles (infraspinatus equivalent as a mini flat iron) can be seamed out for specific applications.",
      },
      {
        name:             "Neck end muscles",
        description:      "The cervical muscles connecting the shoulder to the neck vertebrae — a collection of highly worked postural muscles with elevated collagen density. Characterised by tight, coarse fibres with dense connective tissue sheaths.",
        separationMethod: "Separated from the blade section by following the natural boundary between the cervical and thoracic musculature; the neck muscles are incorporated into ground, minced, or braised preparations due to their high collagen content.",
      },
      {
        name:             "Scapula and arm bone",
        description:      "The blade bone (scapula) and the humerus, to which the primary shoulder muscles attach. The scapula's flat surface allows the blade muscles to be mapped and removed cleanly.",
        separationMethod: "Scapula removed by following the dorsal and ventral surfaces; the humerus is removed at the elbow joint for boneless preparations; retained for presentation in bone-in shoulder roasts.",
      },
    ],

    tissueLogic: {
      collagenDensity: "high",
      fatDistribution: "Moderate to heavy intermuscular fat seams between muscle groups; an external fat cap on the dorsal surface; lamb shoulder fat has a lower melting point than beef due to fatty acid composition differences.",
      muscleType:      "Slow-twitch (type I) dominant — the shoulder muscles perform sustained postural and locomotion work; collagen content is high relative to the rack and leg, requiring extended thermal treatment for full conversion.",
    },

    fabricationPathways: [
      {
        derivedCut: "Bone-in shoulder roast (whole)",
        technique:  "Scapula and humerus retained; excess surface fat removed; the shoulder is tied or netted for a compact shape; scored if the fell membrane is present.",
        outcome:    "A large, irregular bone-in roasting piece; the scapula's flat surface creates an uneven shape that requires the cook to account for hot spots during roasting.",
      },
      {
        derivedCut: "Rolled boneless shoulder",
        technique:  "Scapula and humerus removed by following bone surfaces; the shoulder is spread flat, seasoned, rolled around the muscle axis, and tied at close intervals.",
        outcome:    "A cylindrical boneless roast with uniform cross-section; rolling aligns the muscle groups radially, producing a consistent slice profile throughout the joint.",
      },
      {
        derivedCut: "Lamb merguez / spiced sausages",
        technique:  "Shoulder muscle trimmed of excess sinew; ground at coarse setting (6–8mm plate); mixed with spice paste; filled into natural casings under pressure.",
        outcome:    "A fresh sausage product using the shoulder's high collagen content for binding — collagen particles in the ground mix hydrate and partially gel during cooking, contributing cohesion to the finished sausage.",
      },
    ],

    cookingImplications: [
      {
        principle:   "High collagen density requires 4–8 hours of moist heat at 80–95°C for full gelatin conversion in slow-roasting applications",
        explanation: "The lamb shoulder's collagen matrix, while similar to beef shoulder in structural role, benefits from the lower operating temperatures possible with lamb's smaller muscle mass. Full collagen conversion in the bone-in shoulder typically requires longer cooking than the leg at equivalent temperatures due to the density of the cervical and blade muscle collagen.",
      },
      {
        principle:   "Lamb shoulder fat renders at lower temperatures than beef, beginning around 35°C",
        explanation: "The fatty acid profile of lamb fat includes a higher proportion of shorter-chain saturated acids than beef, lowering the melting point. Surface fat on the shoulder begins to liquefy during the initial temperature rise, before muscle protein coagulation begins, and can be used to self-baste if the fat cap is positioned above the lean.",
      },
    ],

    menuApplications: [
      {
        concept:   "Slow-roasted whole shoulder for sharing or tableside carving",
        reasoning: "The shoulder's high collagen content and irregular bone-in shape are assets rather than constraints in a long-slow format — full collagen conversion produces a gelatinous, fall-apart texture that is difficult to achieve with leaner lamb cuts. The irregular shape of the whole shoulder produces varied portions (from different muscle groups) that provide textural diversity across a shared plate.",
      },
      {
        concept:   "Ground lamb from shoulder for kebab or kofta applications",
        reasoning: "The shoulder's fat and collagen content supports the binding and moisture retention required for formed ground preparations on a grill or skewer. The moderate fat proportion — higher than leg, lower than belly — produces a ground mix with adequate fat for moisture and binding without the richness of higher-fat cuts.",
      },
    ],
  },

  // ── CHICKEN ────────────────────────────────────────────────────────────────

  "chicken:breast": {
    zoneId:       "breast",
    canonicalCut: "Chicken Breast / Crown",

    structuralBreakdown: [
      {
        name:             "Pectoralis major (outer breast)",
        description:      "The large, flat-to-oval primary breast muscle. The dominant muscle of the bird's wing-stroke action, though in domesticated poultry it is largely non-functional. White fast-twitch muscle with minimal connective tissue.",
        separationMethod: "Removed from the keel bone by running a boning knife along the sternum (keel) from the wishbone to the rear; the muscle pulls cleanly from the keel, following the curvature of the ribcage.",
      },
      {
        name:             "Pectoralis minor (inner breast / tenderloin)",
        description:      "A narrow, elongated secondary muscle running along the inner face of the pectoralis major, attached to the coracoid bone. Has a fine grain and a prominent tendon running along one face.",
        separationMethod: "Separated from the pectoralis major by pulling along the tendon; the tendon itself is removed by gripping with a knife-and-cloth technique, pulling it away from the muscle while holding the muscle firm.",
      },
      {
        name:             "Keel bone (sternum) and wishbone",
        description:      "The structural bone to which the pectoral muscles attach bilaterally. The wishbone (furcula) at the neck end of the keel is a common structural feature that affects airline breast preparation.",
        separationMethod: "The wishbone is removed prior to breakdown by running a finger or small knife along the bone and pulling; this facilitates clean breast removal and carving in bone-in preparations.",
      },
    ],

    tissueLogic: {
      collagenDensity: "low",
      fatDistribution: "Minimal intramuscular fat throughout the breast; a thin subcutaneous fat layer beneath the skin; skin fat composition is predominantly unsaturated relative to mammalian equivalents.",
      muscleType:      "Fast-twitch (type II) white muscle — the pectoralis of domesticated poultry is a largely sedentary muscle with near-zero slow-twitch fibres. This results in the lowest connective tissue content of any poultry section and the highest sensitivity to thermal overdone.",
    },

    fabricationPathways: [
      {
        derivedCut: "Airline breast (skin-on, wing drumette attached)",
        technique:  "Wishbone removed; breast removed from the keel with the first wing joint (drumette) intact; wing tip and second joint (flat) removed; the drumette bone is frenched.",
        outcome:    "A skin-on breast with a single Frenched wing bone as a handle; the skin provides a surface for rendering and colour development; the bone provides a plating element and structural reference for doneness assessment (the bone-adjacent muscle is last to reach temperature).",
      },
      {
        derivedCut: "Ballotine / stuffed breast",
        technique:  "Breast butterflied by a single lateral cut; pounded to even thickness; filled with a mousse or vegetable stuffing; rolled and tied or wrapped in caul fat or cling film for poaching.",
        outcome:    "A cylindrical preparation; the even thickness after pounding ensures uniform heat distribution; the rolled format standardises portion weight and cross-sectional visual presentation.",
      },
      {
        derivedCut: "Escalope / schnitzel",
        technique:  "Breast placed between cling film and pounded to 6–8mm with a meat mallet, working from centre outward; breadcrumbed or left plain.",
        outcome:    "A thin, flat piece with disrupted fibre structure; pounding disrupts the fibre alignment and mechanically tenderises; the increased surface area per gram of protein accelerates both browning and heat penetration.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Fast-twitch white muscle fibres contract sharply above 60–65°C and expel moisture rapidly",
        explanation: "The pectoralis major is composed almost entirely of fast-twitch type II fibres that undergo rapid, pronounced contraction upon heat application. Above 65°C internal temperature, the fibre contraction expels intracellular moisture rapidly and the absence of intramuscular fat or collagen provides no compensating mechanism for moisture retention.",
      },
      {
        principle:   "The narrow window between food-safe internal temperature (74°C) and dryness is compressive in the breast muscle",
        explanation: "Unlike collagen-rich cuts where collagen conversion at extended temperatures compensates for moisture loss, the breast offers no such mechanism. From 74°C to 82°C the texture transitions from moist to dry. Sous-vide or temperature-monitored cooking allows the breast to be held at the lower end of the food-safe range.",
      },
      {
        principle:   "Skin acts as a moisture barrier and fat reservoir during cooking",
        explanation: "The skin's subcutaneous fat layer and collagen structure create a partial barrier to surface moisture evaporation. During high-heat cooking, the skin renders and its collagen begins to crisp, progressively transitioning from a moisture barrier to a textural element. Skin-on cooking retains more moisture in the underlying breast muscle than skinless.",
      },
    ],

    menuApplications: [
      {
        concept:   "Airline breast as a plated protein course",
        reasoning: "The airline format combines portion precision (consistent weight from a single bone-in piece), surface colour development (skin-on), and a visual structure (Frenched bone) that provides plate height and serves as a carving reference. The skin separates cleanly for guests who wish to avoid it, while providing moisture protection during cooking.",
      },
      {
        concept:   "Escalope for high-volume or quick-service applications",
        reasoning: "Pounded to even thinness, the breast cooks to food-safe temperature in 2–3 minutes per side — enabling rapid à la minute service. The disrupted fibre structure from pounding reduces perceived toughness, partially compensating for the moisture loss at high heat. Breadcrumbing adds a textural crust and insulates the meat surface during cooking.",
      },
    ],
  },

  "chicken:thigh": {
    zoneId:       "thigh",
    canonicalCut: "Chicken Thigh",

    structuralBreakdown: [
      {
        name:             "Biceps femoris (main thigh muscle)",
        description:      "The primary red muscle of the thigh, forming the bulk of the eating mass. A slow-twitch muscle with moderate intramuscular fat, higher collagen than the breast, and a deeper, more complex flavour profile from myoglobin content.",
        separationMethod: "Removed from the femur by running a boning knife along the bone surface from joint to joint; the muscle peels cleanly from the bone once all tendon attachments are severed.",
      },
      {
        name:             "Femur (thigh bone)",
        description:      "The single bone of the thigh, running from the hip socket to the knee joint. Acts as a heat conductor during bone-in cooking; retained for structural integrity in bone-in preparations.",
        separationMethod: "Removed in boneless preparations by cutting the tendon at the knee end, running the boning knife along the shaft, and lifting the bone free; the hip end requires a scraping cut along the ball of the femur head.",
      },
      {
        name:             "Skin layer",
        description:      "The external skin covering the thigh, with subcutaneous fat immediately beneath. The skin's collagen and fat composition allow it to render and crisp under high heat — more effectively than breast skin due to the higher fat content of the thigh's subcutaneous layer.",
        separationMethod: "Removed by pulling from the muscle surface (the skin is loosely attached to the thigh); the subcutaneous fat layer remains with the muscle unless specifically scraped off.",
      },
    ],

    tissueLogic: {
      collagenDensity: "medium",
      fatDistribution: "Moderate intramuscular fat throughout the thigh muscle; a significant subcutaneous fat layer beneath the skin; the thigh's fat content is substantially higher than the breast, contributing to both flavour and moisture retention during cooking.",
      muscleType:      "Slow-twitch (type I) red muscle — the thigh performs sustained locomotion work in all poultry breeds including domesticated chickens. The slow-twitch character produces higher myoglobin (responsible for the red colour), more intramuscular fat, and higher collagen than the sedentary breast muscle.",
    },

    fabricationPathways: [
      {
        derivedCut: "Bone-in skin-on thigh",
        technique:  "Separated from the drumstick at the knee joint; femur retained; skin left intact. Minimal fabrication.",
        outcome:    "The reference format for braising, slow-roasting, and confit; the bone and skin both contribute to cooking performance — the femur conducts heat into the muscle and the skin self-bastes the exterior.",
      },
      {
        derivedCut: "Boneless skinless thigh",
        technique:  "Femur removed; skin pulled free; the thigh is spread flat; excess fat trimmed if required for specific applications.",
        outcome:    "A flat, boneless piece with uniform (if irregular) thickness; without bone or skin, the thigh cooks faster and is suitable for quick-fire or formed preparations.",
      },
      {
        derivedCut: "Confit thigh",
        technique:  "Bone-in thigh salted and held for 12–24 hours; excess salt rinsed; submerged in rendered fat at 75–80°C for 2–4 hours; cooled and stored under the confiting fat.",
        outcome:    "A fully cooked thigh preserved in fat; the low-temperature confit converts collagen slowly without rapidly expelling moisture; stored under fat indefinitely at refrigeration temperature. Finished by high-heat searing to crisp the skin before service.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Slow-twitch muscle tolerates extended heat and collagen converts at 70–80°C during prolonged cooking",
        explanation: "Unlike the breast's fast-twitch muscle, the thigh's slow-twitch fibres contract less aggressively under heat and begin collagen conversion at sustained 70–80°C. The collagen converted to gelatin lubricates the muscle fibre matrix, partially compensating for moisture expelled from the fibres — making the thigh significantly more forgiving of overcooking than the breast.",
      },
      {
        principle:   "Intramuscular fat in the thigh migrates into surrounding muscle tissue during slow cooking",
        explanation: "The thigh's moderate intramuscular fat content begins to liquefy during the cooking process and redistributes through the muscle fibre matrix, contributing to perceived juiciness. This mechanism operates in addition to collagen gelatin formation and is absent in the near-fat-free breast muscle.",
      },
    ],

    menuApplications: [
      {
        concept:   "Confit thigh finished to order for a plated course",
        reasoning: "The confit preparation separates the long cooking phase (collagen conversion, fat-preservation) from the service phase (skin-crisping). The cooked thigh can be held in fat for extended periods, enabling batch preparation. The high-heat finish produces rapid skin crisping without overcooking the already-cooked muscle underneath.",
      },
      {
        concept:   "Yakitori (bone-in skewered thigh) for grill applications",
        reasoning: "The thigh's higher collagen and fat content than the breast allows it to withstand the repeated high-heat exposure of basting-and-grilling without drying. The bone-in format provides structural integrity on the skewer and insulates the meat adjacent to the bone, keeping the innermost point moister during grilling.",
      },
    ],
  },

  // ── FISH ───────────────────────────────────────────────────────────────────

  "fish:loin": {
    zoneId:       "loin",
    canonicalCut: "Fish Loin / Fillet",

    structuralBreakdown: [
      {
        name:             "Dorsal loin (epaxial musculature)",
        description:      "The muscle mass above the lateral line, comprising the largest portion of edible fish flesh. Structured as a series of W-shaped myomeres (muscle blocks) separated by thin myocommata (connective tissue sheets). The dorsal loin is the reference for loin portions and prime fillet cuts.",
        separationMethod: "Removed from the dorsal fin and backbone by running a filleting knife along the lateral line from head to tail; the knife follows the backbone curvature without penetrating the ribs.",
      },
      {
        name:             "Belly flap (hypaxial musculature)",
        description:      "The muscle mass below the lateral line, covering the abdominal cavity. Thinner than the dorsal loin, with a higher fat content in fatty species (salmon, mackerel). The belly flap is often trimmed from the fillet for premium loin portions.",
        separationMethod: "Separated from the dorsal loin along the lateral line; for pin-bone removal, the pin bones are located by running a finger against the grain of the fillet and removed using bone tweezers or pliers, pulling against the grain of the flesh.",
      },
      {
        name:             "Pin bones and lateral line",
        description:      "The pin bones are a row of intermuscular bones running from the head end of the fillet toward the centre-posterior of the fish. The lateral line is the sensory organ running along the midpoint of the fillet, often visible as a darker stripe.",
        separationMethod: "Pin bones pulled individually with bone tweezers in the direction of the grain (toward the head end); the lateral line muscle strip can be removed for premium presentations by cutting along each side of it and lifting it free.",
      },
    ],

    tissueLogic: {
      collagenDensity: "low",
      fatDistribution: "Fat distribution is highly species-dependent — lean white fish (cod, halibut) have near-zero intramuscular fat; fatty fish (salmon, mackerel, tuna) have significant intramuscular and intermuscular fat deposits. In fatty species, fat concentrates in the belly flap and along the lateral line.",
      muscleType:      "Myomere-based (fish muscle does not map directly to mammalian fast/slow-twitch classifications) — fish myomeres are composed of short, parallel fibres separated by myocommata (collagen sheets). The myocommata dissolve at 40–45°C, causing the characteristic flaking behaviour of cooked fish distinct from mammalian muscle.",
    },

    fabricationPathways: [
      {
        derivedCut: "Skin-on fillet",
        technique:  "Fish filleted along the backbone; pin bones removed; the skin is retained as a structural layer for cooking. The skin prevents the fillet from curling during high-heat cooking.",
        outcome:    "A fillet with the skin providing structural integrity during pan or grill cooking; skin-side-down cooking renders the skin to a crisp texture. The skin is typically scored at intervals to prevent contraction curling.",
      },
      {
        derivedCut: "Skinless loin portion",
        technique:  "Fillet skinned by running a thin knife between the skin and the flesh with the skin face down, pressing the blade flat against the cutting board; belly flap trimmed; portioned across the grain to defined weight.",
        outcome:    "A clean, rectangular skinless portion showing the dorsal loin cross-section; the square-cut format is standard for plated course service. Skin removal is performed cold (chilled fish holds its shape better for skinning).",
      },
      {
        derivedCut: "Gravlax / cured fillet",
        technique:  "Skin-on fillet placed flesh-side down; covered with a cure of salt, sugar, and aromatics; held under weight at 2–4°C for 24–48 hours; scraped and sliced thin against the grain at a low angle.",
        outcome:    "The salt and sugar draw moisture from the flesh via osmosis, simultaneously firming and flavouring the muscle. The cured fillet is sliced thinly — the cure penetration depth is clearly visible as a colour and texture change from the surface inward.",
      },
      {
        derivedCut: "Tartare / ceviche (raw preparation)",
        technique:  "Skinless loin diced finely (tartare) or sliced thin (ceviche); ceviche acid-marinaded in citrus juice at refrigeration temperature for a defined period (5–20 minutes depending on cut size and desired degree of acid denaturation).",
        outcome:    "In ceviche, the acid (citric acid) denatures myosin and other surface proteins, producing the characteristic opaque appearance associated with cooked fish — but via chemical denaturation rather than thermal. The internal structure remains uncooked; only the exterior protein layer is acid-denatured.",
      },
    ],

    cookingImplications: [
      {
        principle:   "Myocommata dissolve at 40–45°C, causing the structural flaking behaviour characteristic of cooked fish",
        explanation: "The connective tissue sheets (myocommata) separating the myomere muscle blocks are primarily collagen that dissolves at temperatures significantly lower than mammalian muscle collagen. Once dissolved, the myomeres separate along these planes, producing the characteristic flaking texture of cooked fish. This dissolution occurs well before the muscle proteins themselves fully coagulate.",
      },
      {
        principle:   "The thermal window for fish (target: 50–60°C internal) is significantly narrower than for mammalian proteins",
        explanation: "Fish muscle proteins begin coagulating at approximately 40°C and are fully set by 60°C; above 60°C, moisture is expelled rapidly and the dissolved myocommata provide no compensating gelatin matrix. The optimal eating texture (opaque but still moist and just-separating) exists in a 10°C internal temperature window.",
      },
      {
        principle:   "Pin bones must be removed against the grain to extract cleanly without tearing the flesh",
        explanation: "The pin bones are oriented diagonally within the myomere structure. Pulling them in the direction of the grain (toward the tail) tears the surrounding muscle fibres. Pulling against the grain (toward the head) draws the bone out along its own axis and minimises tearing of the fillet surface.",
      },
    ],

    menuApplications: [
      {
        concept:   "Pan-seared skin-on fillet as a plated course",
        reasoning: "Skin-on cooking on a flat pan surface scores the skin to prevent curling, renders the skin collagen and fat to a crisp texture, and the skin acts as an insulating layer that slows heat penetration into the flesh above — allowing the upper surface of the fillet to stay cooler while the skin side crisps. The result is a textural contrast between the crisp skin and the barely-set flesh.",
      },
      {
        concept:   "Gravlax as a cured preparation for cold service",
        reasoning: "The curing process firms the flesh to a sliceable consistency without heat application; the intact skin provides a structural backing for thin diagonal slicing. The salt-sugar cure ratio determines the balance between moisture extraction (higher salt) and flavour penetration (higher sugar and aromatics). The raw character of the flesh is preserved beneath the cured surface layer.",
      },
    ],
  },

  "fish:tail": {
    zoneId:       "tail",
    canonicalCut: "Fish Tail / Caudal Section",

    structuralBreakdown: [
      {
        name:             "Caudal peduncle musculature",
        description:      "The dense, compressed muscle section immediately anterior to the tail fin. The most heavily exercised muscle region of the fish body — the primary source of propulsive force during swimming. Noticeably denser and firmer than the dorsal loin myomeres.",
        separationMethod: "The caudal peduncle is defined by its position posterior to the anal fin; portioned by cross-cutting perpendicular to the backbone at defined intervals. The tail fin itself is removed by cutting through the caudal peduncle at the fin base.",
      },
      {
        name:             "Tail fin (caudal fin) and caudal skeleton",
        description:      "The fin rays and skeletal support structure of the caudal fin. In most culinary preparations the fin is removed; in some preparations (whole roasted tail, certain Asian presentations) the fin is retained and may be crisped.",
        separationMethod: "Tail fin removed by a clean cut through the caudal peduncle at the fin base; for tail steaks, the cut is made further anterior, retaining a section of the peduncle on each steak.",
      },
      {
        name:             "Skin (caudal section)",
        description:      "The skin over the tail section is typically thicker and more elastic than the skin over the body loin, reflecting the mechanical demands of propulsion. Higher collagen content than the body skin in most species.",
        separationMethod: "Removed by the same knife-between-skin-and-flesh technique as the body fillet; retained for structural integrity in tail steak preparations where the skin prevents the steak from falling apart during cooking.",
      },
    ],

    tissueLogic: {
      collagenDensity: "low",
      fatDistribution: "The caudal peduncle musculature is typically leaner than the dorsal loin of the same fish, due to the dense, compact nature of the propulsive muscle fibres; very low intramuscular fat.",
      muscleType:      "The caudal musculature is the most active muscle region in the fish — more densely packed myomeres, slightly elevated collagen in the myocommata compared to the body loin, and a firmer texture. In culinary terms, the tail section is often described as having more 'bite' or 'resistance' than the loin.",
    },

    fabricationPathways: [
      {
        derivedCut: "Tail steaks (round cuts / darnes)",
        technique:  "The tail section of the fish is cross-cut perpendicular to the spine at defined thickness (30–40mm); the backbone and skin are retained on the steak; the result is a round steak showing the backbone cross-section in the centre.",
        outcome:    "A robust, bone-in steak format that holds together well during cooking due to the skin and bone providing structural support; the compact tail muscle resists flaking during high-heat applications better than loin portions.",
      },
      {
        derivedCut: "Smoked tail portions",
        technique:  "Tail section separated from the main fillet; cured in a light salt brine for 4–12 hours; cold-smoked at 18–25°C for 4–8 hours or hot-smoked at 60–80°C until internal temperature reaches 65°C.",
        outcome:    "The compact caudal muscle absorbs smoke and cure flavour more uniformly than the thicker loin due to its smaller cross-section. In hot-smoked preparations, the firmer tail texture remains intact better than the body loin sections.",
      },
      {
        derivedCut: "Fish pie / flaked preparations",
        technique:  "Tail section poached or steamed; the flesh is flaked from the skin and bones by hand once cooled; larger flakes are preferable to fine shredding for textural presence in composite preparations.",
        outcome:    "The denser caudal muscle produces larger, more intact flakes when poached compared to the body loin. The flakes hold their structure in the finished dish rather than dispersing into the surrounding sauce.",
      },
    ],

    cookingImplications: [
      {
        principle:   "The thinner cross-section of the tail section accelerates heat penetration compared to the body loin",
        explanation: "Tail steaks and tail portions have a smaller radius than the equivalent body loin cross-section. Heat penetrates from all sides simultaneously in a round steak format, reaching the centre faster than it would in a thicker loin portion. This requires reduced cooking time relative to body portions of the same target internal temperature.",
      },
      {
        principle:   "Skin retention in tail steaks provides structural integrity that the relatively compact caudal muscle does not provide alone",
        explanation: "The caudal musculature, while denser than the body loin, still follows the myomere-myocommata structure and will separate along these planes when the myocommata dissolve during cooking. The encircling skin in a round steak format holds the steak together through the cooking and plating process, acting as a structural casing.",
      },
    ],

    menuApplications: [
      {
        concept:   "Tail steak as a rustic or informal plated fish course",
        reasoning: "The bone-in round steak format — with the backbone visible in the cross-section — communicates a less processed, more direct presentation of the fish than a skinless loin portion. The skin-on format renders during cooking; the steak format suits grilling, roasting, and pan applications where the round shape produces even browning on both cut faces.",
      },
      {
        concept:   "Smoked tail sections for charcuterie or terrine applications",
        reasoning: "The compact, dense muscle of the caudal peduncle takes smoke flavour penetration evenly due to its small cross-section. In a smoked fish terrine or pâté, flaked tail meat contributes a firmer textural element than body loin flakes, providing contrast within the composite preparation.",
      },
    ],
  },

};

// ─── Accessor ──────────────────────────────────────────────────────────────────

export function getSubprimalIntelligence(
  animalId: string,
  zoneId:   string,
): SubprimalIntelligence | null {
  return SUBPRIMAL[`${animalId}:${zoneId}`] ?? null;
}
