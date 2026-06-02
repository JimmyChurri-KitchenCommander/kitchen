import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export type TechniqueEntry = {
  id: string;
  label: string;
  patterns: RegExp[];
  what: string;
  why: string;
  tip?: string;
};

export const TECHNIQUES: TechniqueEntry[] = [
  {
    id: "searing",
    label: "Searing",
    patterns: [/\bsear(ed|ing)?\b/i, /\bseared?\b/i, /\bhot pan\b/i, /\bbrown(ing)? (the )?protein/i, /\bbrown(ed|ing)? (the )?(meat|chicken|fish|duck|beef|lamb|steak|pork)\b/i],
    what: "High dry heat creates a flavour crust on the surface of the protein.",
    why: "When protein hits a hot dry pan, amino acids and sugars react above 140°C in what's called the Maillard reaction — producing hundreds of new flavour compounds in seconds. That crust only forms on a dry surface; moisture on the protein or a cold pan will steam the meat instead, leaving it grey and flavourless.",
    tip: "Pat the protein completely dry before it hits the pan. If the pan isn't smoking, you're not hot enough.",
  },
  {
    id: "resting",
    label: "Resting meat",
    patterns: [/\brest\s+(the\s+)?(meat|protein|beef|lamb|duck|chicken|pork|steak|fillet)\b/i, /\blet\s+(it|the\s+\w+)\s+rest\b/i, /\ballow\s+(to\s+)?rest\b/i, /\bresting\s+time\b/i],
    what: "Resting lets muscle fibres relax and reabsorb the juices pushed to the centre by heat.",
    why: "Heat forces liquid out of muscle cells and drives it inward. If you cut straight after cooking, those juices run straight onto the board. Resting gives the muscle fibres time to relax and pull the liquid back through — so it stays in the meat, not on the board.",
    tip: "A rough guide: rest for half the cooking time, up to 15 minutes for large cuts. Tent loosely with foil — don't wrap tight or you'll soften the crust.",
  },
  {
    id: "reducing",
    label: "Reducing",
    patterns: [/\breduc(e|ed|ing|tion)\b/i, /\bsimmer\s+(down|until\s+thick)/i, /\bcoat(s)?\s+(the\s+)?back\s+of\s+a\s+spoon\b/i, /\bnappe\b/i],
    what: "Liquid is cooked down to concentrate flavour and tighten consistency.",
    why: "Reduction removes water through evaporation. What stays behind is a higher concentration of flavour compounds, natural sugars, and dissolved gelatin from bones — which is why a properly reduced sauce tastes more intense, coats the spoon cleanly, and feels richer. The water leaving is doing nothing for flavour; the solids staying behind are doing everything.",
    tip: "Use a wide-based pan — more surface area means faster, more even evaporation. Reduce uncovered and don't stir constantly; let the surface work.",
  },
  {
    id: "blanching",
    label: "Blanching",
    patterns: [/\bblanch(ed|ing)?\b/i, /\bice\s+bath\b/i, /\bshock(ed|ing)?\s+(in|the)/i, /\bboiling\s+water.{0,30}ice/i],
    what: "Brief boiling followed by an ice bath stops cooking instantly and locks in colour.",
    why: "Vegetables get their green colour from chlorophyll. Heat deactivates the enzymes that break chlorophyll down — but prolonged heat destroys it too. The window is short. The ice bath arrests cooking the moment the vegetable comes out, preserving both colour and texture. Leave it even 30 seconds too long and the cell walls soften and the colour dulls.",
    tip: "Salt your blanching water generously. Vegetables absorb water as they cook — that's your only window to season them from the inside.",
  },
  {
    id: "braising",
    label: "Braising",
    patterns: [/\bbrais(e|ed|ing)\b/i, /\bslow\s+cook/i, /\bcollagen\b/i, /\blow\s+and\s+slow\b/i, /\bcovered.{0,30}(oven|heat)/i],
    what: "Long moist heat converts tough connective tissue into rich, glossy gelatin.",
    why: "The tough protein in secondary cuts is collagen — it forms the connective tissue around muscles that get worked hard. Above 70°C collagen begins to convert to gelatin, but only slowly. Low and slow gives it the time it needs to fully dissolve, which transforms a tough cut into something tender and silky. The braising liquid absorbs that gelatin too — that's what makes it glossy and rich.",
    tip: "The meat should be about two-thirds submerged. Too much liquid and flavour leaches out into the sauce rather than concentrating in the meat.",
  },
  {
    id: "deglazing",
    label: "Deglazing",
    patterns: [/\bdeglaz(e|ed|ing)\b/i, /\bscraping?\s+(up\s+)?(the\s+)?brown\s+(bits|pieces)\b/i, /\bfond\b/i, /\bwine.{0,20}(hot\s+)?pan\b/i],
    what: "Liquid added to a hot pan dissolves the caramelised residue stuck to the base.",
    why: "Those brown bits on the pan base — called fond — are concentrated Maillard reaction products and caramelised proteins. They're pure flavour. Adding liquid while the pan is still hot dissolves them instantly, incorporating all of that depth directly into your sauce. Skip this step and you're leaving the best part of the flavour behind.",
    tip: "Add the liquid while the pan is still smoking hot and scrape immediately with a wooden spoon. Cold pan, no dissolving.",
  },
  {
    id: "rendering",
    label: "Rendering",
    patterns: [/\brender(ed|ing)?\b/i, /\bfat.{0,20}melt/i, /\bcrisp(y|ing)?.{0,15}(fat|skin|duck|pork belly)/i, /\bskin.{0,20}down\b/i],
    what: "Gentle heat melts fat out of the meat's fat cells, leaving the skin or fat cap crisp.",
    why: "Meat fat is stored in fat cells. Gentle, patient heat causes the cell membranes to break down and release the fat — it bastes the surface as it melts, self-basting the protein underneath. High heat burns the surface before the fat has a chance to release, which is why a smoking hot pan for duck breast or pork belly is counterproductive.",
    tip: "Start in a cold or warm pan, low to medium heat. Press gently to keep the skin flat and in contact with the pan surface.",
  },
  {
    id: "emulsifying",
    label: "Emulsifying",
    patterns: [/\bemulsif(y|ied|ying|ication)\b/i, /\bbeurre\s+blanc\b/i, /\bmount(ed|ing)?\s+(with\s+)?butter\b/i, /\bhollandaise\b/i, /\bmayonnaise\b/i, /\bcream(ing)?\s+butter/i],
    what: "Fat and water are combined into a stable, unified sauce.",
    why: "Fat and water naturally want to separate — fat molecules repel water. Emulsifiers like the lecithin in egg yolk or the proteins in butter act as a molecular bridge, surrounding fat droplets and holding them suspended in the water. Break the emulsion — by adding fat too fast, or with too much heat — and the sauce splits: the fat pools separately and the structure collapses.",
    tip: "Add fat in a slow, steady stream while constantly working the mixture. If it splits, start with a fresh base and slowly whisk the split sauce back in.",
  },
  {
    id: "caramelising",
    label: "Caramelising",
    patterns: [/\bcaramelise\b/i, /\bcaramelize\b/i, /\bcaramelised?\b/i, /\bsugar.{0,30}(golden|amber|colour|colour)/i, /\bonion.{0,30}(low|slow|caramel)/i],
    what: "Sugar molecules break down under high heat into complex flavour compounds.",
    why: "Above 160°C, sucrose molecules fragment and recombine into hundreds of new compounds — some bitter, some nutty, some fruity. The colour change from clear to pale amber to dark brown tracks the increasing complexity and bitterness. The same process happens more slowly with the natural sugars in onions or root vegetables at lower temperatures.",
    tip: "Don't stir dry caramel — it triggers crystallisation and the whole batch seizes. Swirl the pan instead. For onions, go low and slow — rushing with high heat gives you browned, not caramelised.",
  },
  {
    id: "tempering",
    label: "Tempering",
    patterns: [/\btemper(ed|ing)?\b/i, /\bgradual(ly)?.{0,20}(heat|warm|add)\b/i, /\bhot.{0,30}slowly.{0,30}(eggs?|yolks?)\b/i, /\bscrambl/i],
    what: "Temperature is raised gradually to avoid proteins seizing or structure collapsing.",
    why: "Egg proteins coagulate (seize) rapidly above around 65°C. If you add cold eggs directly to a hot liquid, they scramble instantly — the proteins denature in a chaotic tangle. Tempering adds the hot liquid a spoonful at a time, raising the egg temperature slowly so the proteins can blend without seizing. The same principle applies to chocolate: gradual temperature control during cooling creates stable cocoa butter crystals that give chocolate its snap.",
    tip: "Whisk constantly as you add the hot liquid. Go slowly — one spoonful, whisk fully, then the next.",
  },
  {
    id: "marinating",
    label: "Marinating",
    patterns: [/\bmarinat(e|ed|ing|ade)\b/i, /\bsoak(ed|ing)?.{0,20}(in\s+)?(acid|citrus|wine|buttermilk|brine)/i, /\bbrin(e|ing|ed)\b/i],
    what: "Acid, salt, or enzymes in the marinade begin modifying the surface proteins.",
    why: "Acid partially denatures proteins on the surface — unfolding them, making the meat more permeable, and beginning to tenderise. Salt works by osmosis: first drawing moisture out, then pulling it back in along with dissolved flavour. Enzymes in ingredients like pineapple or papaya physically break down muscle fibres. Each mechanism affects flavour and texture differently.",
    tip: "Marinating beyond 12–24 hours in an acid-heavy marinade can over-denature the surface, giving a soft, mushy texture. Time it to the protein and the acid strength.",
  },
  {
    id: "folding",
    label: "Folding",
    patterns: [/\bfold(ed|ing)?\s+(in|together)\b/i, /\bgently\s+(fold|combine|mix)\b/i, /\bpreserv.{0,20}(air|bubble|volume)/i],
    what: "A gentle combining motion that preserves the air already beaten into the mixture.",
    why: "Beating or whipping a mixture forces air in, creating bubbles that give soufflés, mousses, and batters their lightness. Stirring or whisking would burst those bubbles. Folding — a slow, sweeping motion from the bottom of the bowl up and over — incorporates new ingredients without collapsing the foam structure that makes the dish light.",
    tip: "Use a large, flexible spatula. Turn the bowl as you fold rather than moving the spatula in circles. Stop as soon as it's just combined — overmixing defeats the purpose.",
  },
  {
    id: "scoring",
    label: "Scoring",
    patterns: [/\bscor(e|ed|ing)\b/i, /\bslash(ed|ing)?.{0,20}(skin|fat|dough|bread|surface)\b/i, /\bcut(ting)?.{0,20}(cross.?hatch|diamond|pattern).{0,20}(skin|fat|surface)\b/i],
    what: "Cuts in the surface control where and how the protein or dough expands under heat.",
    why: "Heat causes the interior to expand rapidly. Without scoring, steam and pressure build until the crust cracks at its weakest, most random point — leaving an uneven shape. A score guides that expansion deliberately — controlling where it opens and giving you a predictable result. On duck skin and pork belly fat, scoring also accelerates fat rendering by giving the melting fat a direct escape route.",
    tip: "Score skin or fat with a sharp knife, cutting through to the fat layer but not into the flesh. On bread, angle the blade at 30–45 degrees for maximum bloom.",
  },
  {
    id: "blooming",
    label: "Blooming spices",
    patterns: [/\bbloom(ed|ing)?\s+(the\s+)?(spice|spices)\b/i, /\btoast(ed|ing)?\s+(the\s+)?(spice|spices|seeds|cumin|coriander|cardamom)\b/i, /\bdry.toast\b/i, /\bfry.{0,20}(the\s+)?(spice|spices|seeds)\b/i],
    what: "Heat releases the volatile oils locked inside whole or ground spices.",
    why: "Spice flavour and aroma come from volatile oil compounds. In a dry or unheated spice, these oils are trapped inside cell walls. Heat — whether dry toasting or frying in fat — breaks down those walls, releasing the oils and making them immediately available. Fat-bloomed spices disperse flavour through the dish more evenly, since fat carries flavour compounds throughout the dish in a way water cannot.",
    tip: "Watch the heat — 30 seconds in a dry pan is enough for most spices. The moment you smell them, they're done. A few more seconds and they'll be bitter.",
  },
  {
    id: "poaching",
    label: "Poaching",
    patterns: [/\bpoach(ed|ing)?\b/i, /\bgently\s+simmer.{0,20}(fish|chicken|egg|quenelle)/i, /\b(just\s+)?below\s+(a\s+)?simmer\b/i],
    what: "Gentle sub-boiling heat cooks delicate proteins without toughening them.",
    why: "Protein fibres coagulate (tighten) when heated. The faster and hotter the cooking, the more violently they contract — squeezing out moisture and toughening the texture. Poaching holds the liquid just below a simmer, applying heat gradually so proteins coagulate slowly and evenly, retaining moisture and staying tender. Boiling a delicate fish or an egg violently produces a tough, rubbery result for the same reason.",
    tip: "The liquid should barely move — an occasional bubble breaking the surface, not a rolling boil. Maintain temperature rather than letting it climb.",
  },
  {
    id: "gluten_rest",
    label: "Resting dough",
    patterns: [/\brest.{0,20}(the\s+)?dough\b/i, /\bgluten.{0,20}(relax|rest|develop)/i, /\bproof(ed|ing)?\b/i, /\bautolyse\b/i],
    what: "Resting dough allows the gluten network to relax and become workable.",
    why: "Mixing flour and water forms gluten — a network of proteins that gives dough structure and elasticity. Freshly mixed dough is tight and elastic because the gluten network is under tension. Resting gives the gluten strands time to relax and rehydrate — making the dough extensible rather than just elastic. Without rest, it snaps back when you try to shape it and resists rolling.",
    tip: "Cover the dough completely during rest to prevent the surface from drying and forming a skin. Even 15–20 minutes makes a significant difference to workability.",
  },
  {
    id: "salting_early",
    label: "Salting ahead",
    patterns: [/\bsalt\s+(the\s+)?(protein|meat|fish|chicken|beef|steak|lamb|veg).{0,30}(ahead|early|night before|hour)/i, /\bdry.brin(e|ing)\b/i, /\bseason.{0,30}(rest|sit|stand)\b/i],
    what: "Salting ahead draws moisture out then back into the protein — seasoning from within.",
    why: "Salt initially draws moisture out of the protein by osmosis. Left long enough, that moisture dissolves the salt and is reabsorbed back in — carrying seasoning deep into the muscle fibres rather than just coating the surface. The surface also dries out, which helps enormously with browning later. A properly dry-brined protein browns faster and seasons more evenly than one salted just before cooking.",
    tip: "For thick proteins, salt at least an hour ahead — overnight in the fridge is ideal for large cuts. Pat dry before cooking to remove any surface moisture.",
  },
  {
    id: "steaming",
    label: "Steaming",
    patterns: [/\bsteam(ed|ing|er)?\b/i, /\bover\s+boiling\s+water\b/i, /\bsteamer\s+basket\b/i, /\bbamboo\s+steamer\b/i],
    what: "Moist heat circulates around food without submerging it, cooking gently and preserving colour and texture.",
    why: "Steam sits at 100°C at sea level and transfers heat efficiently to the food surface without washing away water-soluble flavours or nutrients. No Maillard reaction occurs — there's no browning — which is a deliberate choice for delicate proteins like fish, dumplings, or bao where colour change would indicate overcooking. The food cooks in its own moisture and doesn't absorb the cooking medium.",
    tip: "Keep the lid on. Every time you lift it you drop the temperature by 10–15°C and add time. Make sure the water level is below the basket — boiling water touching the food turns steaming into poaching.",
  },
  {
    id: "confit",
    label: "Confit",
    patterns: [/\bconfit\b/i, /\bsubmerged?.{0,20}(duck|pork|fat|oil).{0,20}(low|slow|oven)/i, /\bfat.{0,20}(cook|slow|submer)/i],
    what: "Food is slow-cooked fully submerged in fat at low temperature — typically 70–90°C — until silky and tender.",
    why: "Fat conducts heat gently and evenly, maintaining a temperature well below boiling. At this low temperature, collagen in tougher cuts converts to gelatin without the aggressive muscle contraction that squeezes moisture out at higher temperatures. The fat doesn't penetrate the muscle fibres — the food isn't absorbing the cooking fat, it's being cooked by it. Originally a preservation technique: cooled in its own fat, confited meat lasts weeks.",
    tip: "The fat temperature matters more than the time. Use a thermometer — 80°C is the sweet spot for duck or pork. Too hot and you get braised rather than confited. A slow oven at 120°C with the pot covered gives consistent results without a thermometer.",
  },
  {
    id: "sweating",
    label: "Sweating",
    patterns: [/\bsweat(ed|ing)?\s+(the\s+)?(onion|shallot|celery|carrot|veg|mirepoix|aromatics?)\b/i, /\bsoften.{0,30}without\s+colour\b/i, /\bno\s+colour\b/i, /\bover\s+low\s+heat.{0,30}(soften|translucent)\b/i],
    what: "Low gentle heat softens vegetables and releases their moisture without any colour developing.",
    why: "Below the Maillard threshold (around 140°C), vegetable cell walls soften and water inside the cells releases as steam. The goal is to develop aromatic flavour through natural sugars without browning. Sweat aromatics — onion, celery, carrot — that form the base of a sauce or soup and you build a soft, rounded foundation without a fried note. Colour means you've gone too far and into sautéeing territory.",
    tip: "Keep the heat low and cover the pan partially — trapped steam accelerates softening without browning. If you see colour forming, reduce the heat immediately and add a splash of water.",
  },
  {
    id: "sauteing",
    label: "Sautéing",
    patterns: [/\bsaut[ée](ed|ing)?\b/i, /\bhigh\s+heat.{0,30}(toss|move|shake|stir)\b/i, /\btoss(ed|ing)?\s+(in\s+)?the\s+pan\b/i],
    what: "Quick cooking over high heat in a small amount of fat, with constant movement to prevent burning.",
    why: "Sauté comes from the French sauter — to jump. High heat combined with movement produces rapid Maillard browning while evaporating surface moisture immediately, preventing steaming. Because cooking is so fast, delicate cuts and vegetables retain texture while building a flavourful surface crust. Overcrowding is the most common mistake — too much food drops the pan temperature and the food steams in its own moisture rather than browning.",
    tip: "Get the pan hot before the fat, and the fat hot before the food. A crowded pan is why food won't colour — reduce the batch size. Keep the food moving and keep the heat high.",
  },
  {
    id: "roasting",
    label: "Roasting",
    patterns: [/\broast(ed|ing)?\b/i, /\boven.{0,20}(cook|bake|heat).{0,20}(uncovered|rack)\b/i, /\boven\s+temperature\b/i, /\boven-proof\b/i],
    what: "Dry oven heat surrounds food and cooks it through convection while the surface browns.",
    why: "Oven heat operates simultaneously through convected hot air circulating around the food and radiant heat from the oven walls. Surface temperatures are high enough for Maillard browning. In the interior, heat penetrates more slowly, giving you control over internal temperature based on time and oven setting. Covering the pan traps steam and converts roasting into braising — the result is completely different.",
    tip: "Start at higher heat to establish surface colour, then reduce to finish the interior if needed. Always rest the item before carving — the internal temperature continues to rise off the heat, and resting reabsorbs juices lost during cooking.",
  },
  {
    id: "deep_frying",
    label: "Deep frying",
    patterns: [/\bdeep.fr(y|ied|ying|ier)\b/i, /\bfry(ing)?\s+(in|at).{0,20}(180|190|175|170)°?[Cc]?\b/i, /\bsubmerge.{0,20}(hot\s+)?oil\b/i, /\bfrying\s+(oil|fat|bath)\b/i],
    what: "Food submerged in hot oil (170–190°C) cooks through extreme heat transfer while surface moisture flashes to steam.",
    why: "Hot oil transfers heat far more rapidly than water or steam. When food hits the oil, surface moisture flashes to steam almost instantly — that violent bubbling is water leaving the food. As moisture is driven out, the oil doesn't replace it; fat can't penetrate a moist surface. The surface dehydrates and sets into a crisp, Maillard-browned crust. When the bubbling slows, the surface moisture has largely been expelled — a key indicator of doneness.",
    tip: "Never overcrowd. Too many pieces drop the oil temperature sharply, and instead of crisping, the food absorbs oil and turns greasy. Fry in small batches and allow the oil to return to temperature between each.",
  },
  {
    id: "smoking",
    label: "Smoking",
    patterns: [/\bsmok(e|ed|ing|er|ehouse|ed?\s+salmon|ed?\s+duck)\b/i, /\bcold.smok/i, /\bhot.smok/i, /\bwood\s+(chip|chunk|plank|smoke)\b/i],
    what: "Smouldering wood deposits hundreds of flavour compounds onto the surface of food while cooking it gently.",
    why: "Wood smoke contains phenolic compounds that bond to surface proteins. Some phenols are antimicrobial — the original reason smoking was used for preservation. Cold smoking (below 30°C) adds flavour without cooking. Hot smoking (70–120°C) cooks the food simultaneously. The wood species determines the dominant flavour: hardwoods like oak give robust, earthy notes; fruit woods like apple or cherry are gentler and suit delicate proteins.",
    tip: "Match the wood to the protein. Hickory and mesquite can overpower delicate fish — use fruit woods for lighter proteins. White, steady smoke is what you want. Acrid grey smoke means incomplete combustion and bitter flavour.",
  },
  {
    id: "basting",
    label: "Basting",
    patterns: [/\bbast(e|ed|ing)\b/i, /\bspoon.{0,20}(over|juices|fat|liquid)\b/i, /\bbrush.{0,20}(with\s+)?(glaze|butter|juices|fat)\b/i],
    what: "Spooning or brushing cooking juices or fat over food during cooking adds flavour and slows moisture loss.",
    why: "The surface of a protein dries and sets as it cooks. Basting adds a layer of flavoured liquid that re-moistens the surface and carries concentrated flavour compounds from the pan onto the food. Pan drippings contain rendered fat, Maillard products, and evaporated proteins — basting repeatedly concentrates these on the surface. Fat also slows moisture evaporation from the exterior, acting as a barrier.",
    tip: "Baste every 10–15 minutes in a hot oven. Keep the oven door open for the minimum time possible — oven temperature drops fast and recovery takes several minutes.",
  },
  {
    id: "glazing_food",
    label: "Glazing",
    patterns: [/\bglaz(e|ed|ing)\s+(with|the)\b/i, /\bcoat.{0,20}(jus|glaze|reduction|sauce)\b/i, /\bgloss(y|ing)?.{0,20}(coat|layer|finish)\b/i],
    what: "Reducing a cooking liquid until it concentrates and coats food with a glossy, intensely flavoured layer.",
    why: "As liquid reduces, water evaporates and natural sugars, gelatin, and flavour compounds concentrate. When this concentrated liquid coats food, dissolved gelatin makes it cling rather than run off. The result is a glossy, flavour-dense surface. Glazed vegetables or a jus-glazed protein get their shine from gelatin and reduced natural sugars, not from added fat. Beyond nappe consistency, the sugars begin to burn.",
    tip: "The glaze is ready when the liquid moves slowly off a spoon and holds a clean line — not runny, not sticky. Cook past this point and the sugars scorch and the glaze turns bitter.",
  },
  {
    id: "roux",
    label: "Making a roux",
    patterns: [/\broux\b/i, /\bflour.{0,20}butter.{0,20}(cook|stir|whisk)/i, /\bbutter.{0,20}flour.{0,20}(cook|stir|whisk)/i, /\bwhite\s+roux\b/i, /\bbrown\s+roux\b/i],
    what: "Equal parts fat and flour cooked together to form the thickening base for sauces and soups.",
    why: "Raw flour added directly to liquid clumps and tastes raw. Cooking flour in fat coats the starch granules in fat, which prevents clumping when liquid is added. When hot liquid is introduced, the starch granules absorb it and swell (gelatinise), thickening the sauce evenly. The longer a roux cooks before liquid is added, the darker it gets — and the less thickening power it has, but the more complex the flavour. A dark roux is fundamental to gumbo and espagnole.",
    tip: "Add hot liquid to a hot roux, or cold liquid to a hot roux — never cold to cold or you get lumps. Whisk constantly as the liquid goes in and bring to a simmer before judging the thickness.",
  },
  {
    id: "proving",
    label: "Proving dough",
    patterns: [/\bprov(e|ed|ing|er)\b/i, /\bproof(ed|ing)?\s+(the\s+)?dough\b/i, /\byeast.{0,20}(rise|doubl|activ)/i, /\blet\s+(it|the\s+dough)\s+(rise|double)\b/i],
    what: "Dough rests at warm temperature while yeast consumes sugars and produces CO₂, causing it to rise.",
    why: "Yeast converts sugars in the flour to carbon dioxide and ethanol. The CO₂ bubbles are trapped by the gluten network, which stretches as the gas expands. As proving continues, the gluten relaxes and the flavour of the dough develops — fermentation produces organic acids and esters that give bread its complexity. Over-proving collapses the gluten structure: the walls between bubbles become too thin and tear.",
    tip: "Prove in a warm but not hot environment — 25–35°C. A damp cloth or lightly oiled cling film prevents the surface from drying and forming a skin that restricts rise. When pressing with a finger leaves an impression that springs back slowly, the dough is proved.",
  },
  {
    id: "laminating",
    label: "Laminating pastry",
    patterns: [/\blaminat(e|ed|ing|ion)\b/i, /\bturn(s|ing)?.{0,20}(dough|pastry|croissant|puff)\b/i, /\bpuff\s+pastry\b/i, /\bcroissant\s+(dough|making)\b/i, /\bbook\s+fold\b/i],
    what: "Thin layers of butter are folded repeatedly into dough to create hundreds of distinct fat layers that expand in the oven.",
    why: "Each fold doubles the number of layers. After several folds (called turns), you have hundreds of alternating layers of fat and dough. In the oven, the water in the butter converts to steam, physically pushing the layers apart. Each layer sets individually as the pastry cooks — creating the flaky, airy structure of croissants and puff pastry. The butter must stay cold and firm throughout; if it melts into the dough, the layers merge and the pastry becomes dense.",
    tip: "Keep everything cold. If at any point the butter starts to soften into the dough, stop, wrap it, and refrigerate for 20 minutes before continuing. Work quickly and decisively on a cool surface.",
  },
  {
    id: "pickling",
    label: "Pickling",
    patterns: [/\bpickl(e|ed|ing|es)\b/i, /\bacid.{0,20}brine\b/i, /\bquick.pickl/i, /\blacto.ferment/i, /\bvinegar.{0,20}(brine|solution|pickle)\b/i],
    what: "Food is preserved and flavoured in an acidic solution — vinegar or fermentation-produced lactic acid.",
    why: "Acid lowers the pH to a level where most spoilage bacteria cannot survive. Simultaneously, acid penetrates the food's cells, softening cell walls and infusing flavour. Quick-pickling uses vinegar for immediate results with a clean, sharp flavour. Lacto-fermentation uses salt to suppress competing bacteria while naturally occurring lactic-acid bacteria acidify the brine over days or weeks, producing a more complex, funky flavour.",
    tip: "The ratio of acid to water and salt concentration affect how fast and how deeply the pickle penetrates. Thin cuts pickle in hours; dense vegetables need days. Always use a non-reactive vessel — acid reacts with aluminium and unlined copper.",
  },
  {
    id: "curing",
    label: "Curing",
    patterns: [/\bcur(e|ed|ing)\b/i, /\bsalt.{0,20}(cure|rub|pack)\b/i, /\bsugar.{0,20}(cure|rub)\b/i, /\bgravlax\b/i, /\bpancetta\b/i, /\bcold.cur/i],
    what: "Salt — sometimes combined with sugar — draws moisture out through osmosis to preserve and season the protein.",
    why: "Salt draws moisture out of cells because water moves from areas of lower concentration to higher concentration across the cell membrane. This reduces water activity and creates an environment hostile to bacteria. Left long enough, some salt is reabsorbed — seasoning the protein from within. Sugar in a cure slows the harshness of the salt and contributes flavour. Nitrates and nitrites in curing salt also inhibit specific dangerous bacteria and fix the characteristic pink colour in cured meats.",
    tip: "Weight-based curing is more reliable than time-based. Apply a percentage of the protein's weight in salt (2–3% is standard) and cure refrigerated. At some point the cure penetrates fully — leaving it longer over-cures without benefit.",
  },
  {
    id: "flambeing",
    label: "Flambéing",
    patterns: [/\bflambé\b/i, /\bflambe\b/i, /\bignite.{0,20}(brandy|alcohol|spirit|cognac|rum)\b/i, /\bburn\s+off.{0,20}(alcohol|brandy|spirit)\b/i],
    what: "Alcohol added to a hot pan is ignited, burning off the spirit while leaving aromatic flavour compounds.",
    why: "Raw alcohol contributes a harsh, sharp flavour. Burning it off removes the spirit taste while leaving the aromatic compounds — the fruit esters in brandy, the botanicals in rum, the sweetness of Grand Marnier. The flame also creates a brief moment of very high surface heat, which adds a subtle char note. The technique is dramatic in service, but the culinary effect is genuine — a finished sauce with depth rather than raw spirit bite.",
    tip: "The pan must be warm for the alcohol to ignite. Tilt the pan away from you and use a long match or taper. Never flambé under an overhead hood or near an exhaust fan — the flame can travel back along the vapour trail.",
  },
  {
    id: "whipping",
    label: "Whipping cream or egg whites",
    patterns: [/\bwhip(ped|ping)?\s+(cream|double|egg\s+white|whites)\b/i, /\bbeat.{0,20}(to\s+)?soft\s+peaks?\b/i, /\bbeat.{0,20}(to\s+)?stiff\s+peaks?\b/i, /\bwhisk.{0,20}(to\s+)?ribbon\b/i],
    what: "Rapid agitation forces air into liquid which is then trapped by fat or protein to form a stable foam.",
    why: "In cream, fat globules partially coalesce around air bubbles under mechanical agitation, forming a foam held in place by the fat network. In egg whites, proteins denature under stress, unfold, and bond around air bubbles to form a stable foam. Both are fragile: continue agitating cream beyond soft peaks and the fat globules fully coalesce into butter. Even a trace of fat — including egg yolk — in egg whites prevents the protein foam forming.",
    tip: "Cold cream whips best — the fat needs to be firm to hold structure. For egg whites, ensure the bowl and whisk are completely clean and grease-free. Work up gradually through soft peaks and stop the moment you reach the texture you need.",
  },
  {
    id: "trussing",
    label: "Trussing",
    patterns: [/\btruss(ed|ing)?\b/i, /\btie?.{0,20}(the\s+)?(bird|chicken|duck|leg|wing)\b/i, /\bstring.{0,20}(around|the\s+)(bird|leg|joint)\b/i],
    what: "Tying a bird or joint into a compact, uniform shape ensures even heat penetration during roasting.",
    why: "An untrussed bird has protruding legs and wings that cook faster than the breast and dry out before the breast is done. Trussing compacts the bird so heat penetrates more uniformly — the legs are tucked close to the body, slowing their cooking, and the cavity is closed, helping the breast retain moisture. The result is more even internal temperatures across the whole bird at the point of carving.",
    tip: "Don't truss too tightly — some airflow between the skin and meat helps fat render and skin crisp. The goal is a compact shape, not a tight bundle.",
  },
  {
    id: "stir_frying",
    label: "Stir-frying",
    patterns: [/\bstir.fr(y|ied|ying)\b/i, /\bwok\b/i, /\bwok\s+hei\b/i, /\bhigh\s+heat.{0,20}(toss|wok|stir)\b/i],
    what: "Extreme high heat and rapid movement cook small, uniform pieces in seconds with a distinct char and smoke.",
    why: "The key to wok cooking is wok hei — the breath of the wok. At extreme temperatures (over 300°C on a professional burner), the Maillard reaction accelerates and a thin char forms in seconds. Rapid tossing prevents burning by keeping the food moving and exposing all surfaces to the heat. Small uniform pieces are essential — they cook through before the surface burns. Domestic burners rarely achieve the heat needed; the result is steamed, flavourless food rather than seared.",
    tip: "Prep everything before you start — once the wok is hot there is no time. Cook in small batches so the temperature doesn't drop. Velveting proteins (coating in cornstarch and egg white) before cooking keeps them tender at high heat.",
  },
  {
    id: "en_papillote",
    label: "En papillote",
    patterns: [/\ben\s+papillote\b/i, /\bparchment.{0,20}(parcel|pouch|wrap|seal)\b/i, /\bfoil.{0,20}(parcel|pouch|seal|packet)\b/i, /\bseal(ed|ing)?.{0,20}(parcel|parchment|foil)\b/i],
    what: "Food sealed in a parchment or foil parcel steams in its own moisture and aromatics in the oven.",
    why: "The sealed parcel creates a pressurised environment. As the oven heats the parcel, moisture from the food and any added liquid converts to steam. This steam cooks the food quickly and efficiently while carrying the flavours of aromatics — herbs, citrus, wine — across the whole parcel. No moisture or flavour escapes. The technique is ideal for delicate fish and vegetables that would dry out under direct heat.",
    tip: "Seal the parcel tightly — an incomplete seal lets steam escape and defeats the purpose. The parcel should puff noticeably in the oven. Open carefully at the table to let the steam escape away from you.",
  },
  {
    id: "mounting_butter",
    label: "Mounting with butter",
    patterns: [/\bmont(er|é)?\s+(au\s+)?beurre\b/i, /\bwhisk.{0,20}cold\s+butter\b/i, /\bfinish.{0,20}(with\s+)?butter\b/i, /\bmount.{0,20}(with\s+)?butter\b/i, /\bcold\s+butter.{0,20}(sauce|into|whisk)\b/i],
    what: "Cold butter is whisked into a hot sauce off the heat to add richness, gloss, and a silky body.",
    why: "Cold butter contains both fat and water. When agitated into a hot (but not boiling) sauce, the butter melts gradually — the milk proteins and water emulsify into the liquid while the fat disperses in tiny droplets, creating a smooth, glossy emulsion. If the sauce is too hot, the emulsion breaks and fat pools separately. The butter's own lecithin acts as an emulsifier, binding the fat and water together.",
    tip: "The sauce should be hot but not simmering — 70–80°C is the range. Add cold butter a piece at a time and whisk constantly. Take the pan fully off the heat before you start, and never let it return to a simmer once the butter is in.",
  },
  {
    id: "blowtorching",
    label: "Blowtorching",
    patterns: [/\bblowtorch(ed|ing)?\b/i, /\btorch(ed|ing)?\s+(the\s+)?(top|sugar|surface|skin)\b/i, /\bsalaman(der|dre)\b/i, /\bgratin(ée|ate|ating)?\b/i, /\bcrème\s+brûlée\b/i],
    what: "Intense direct flame is applied to the surface to achieve rapid browning or caramelisation without cooking the interior.",
    why: "A blowtorch or salamander applies extreme localised heat to one surface only. The surface temperature rises rapidly through the Maillard range and into caramelisation — creating a browned or glazed crust while the interior remains cold or at serving temperature. This is why crème brûlée is possible: the custard stays set and chilled while the sugar layer caramelises in seconds above it.",
    tip: "Keep the torch moving in circular passes — hold in one spot and you'll scorch rather than caramelise. For brûlée, apply a thin, even layer of fine sugar and work in steady passes until evenly amber. Stop before dark brown.",
  },
  {
    id: "setting_gelatin",
    label: "Setting with gelatin",
    patterns: [/\bgelat(in|ine)\b/i, /\bbloom.{0,20}gelat/i, /\bsoaking?.{0,20}(leaf|sheet|gelatin)\b/i, /\bpanna\s+cotta\b/i, /\bset.{0,20}(to\s+a\s+)?(gel|jelly|firm)\b/i],
    what: "Gelatin dissolved in hot liquid forms a protein network when cooled, trapping the liquid in a gel.",
    why: "Gelatin is a protein derived from collagen in animal connective tissue. When dissolved in liquid above 35°C and then cooled below around 15°C, the gelatin molecules form bonds with each other, creating a three-dimensional network that traps the surrounding liquid. Concentration controls firmness — a light set for panna cotta, a firm set for a terrine. Agar, derived from seaweed, sets higher and produces a more brittle, stiff gel.",
    tip: "Bloom sheet gelatin in cold water for 5 minutes — it softens and swells. Squeeze out excess water before dissolving in warm liquid. Never boil gelatin; prolonged high heat breaks down the protein chains and weakens their setting ability.",
  },
  {
    id: "sous_vide",
    label: "Sous vide",
    patterns: [/\bsous\s+vide\b/i, /\bvacuum.seal(ed|ing)?.{0,20}(water\s+bath|cook)\b/i, /\bwater\s+bath.{0,20}(cook|hold|circulator)\b/i, /\bimmersion\s+circulator\b/i],
    what: "Vacuum-sealed food cooks in a precisely temperature-controlled water bath — cooking edge-to-edge to an exact internal temperature.",
    why: "Traditional cooking exposes food to temperatures well above the target internal temperature — the exterior overcooks while you wait for the centre. Sous vide sets the water to exactly the target temperature, so the food can never exceed it regardless of how long it cooks. This produces edge-to-edge uniform doneness impossible any other way. Collagen in tougher cuts still converts to gelatin at low temperatures — it just takes far longer (48–72 hours at 65°C for short rib, compared to 3 hours at 160°C in a braise).",
    tip: "Time and temperature work differently here. Proteins can be held safely at temperature for extended periods. But sous vide-cooked proteins must still be finished in a hot pan or under a grill — the Maillard reaction doesn't happen in a water bath.",
  },
  {
    id: "velveting",
    label: "Velveting",
    patterns: [/\bvelvet(ed|ing)?\b/i, /\bcoat.{0,20}(cornstarch|egg\s+white).{0,20}(before|marinate|chicken|beef|pork)\b/i, /\bbaking\s+soda.{0,20}(tender|beef|meat)\b/i],
    what: "Coating protein in egg white, cornstarch, and sometimes baking soda before cooking to shield it from intense heat.",
    why: "The coating forms a physical barrier between the protein and the hot pan or oil. As the exterior sets, it seals in moisture that would otherwise be driven out by extreme heat. Baking soda raises the pH of the surface, which slows protein coagulation and keeps the meat more tender. The result is meat that stays silky inside even under very high temperatures — the technique behind the smooth texture of Chinese restaurant beef and chicken.",
    tip: "Rinse velveted protein before stir-frying to remove excess cornstarch — too much clouds the wok and muddles the dish. Pat lightly dry before it hits the heat.",
  },
  {
    id: "clarifying_butter",
    label: "Clarifying butter",
    patterns: [/\bclarif(y|ied|ying).{0,20}butter\b/i, /\bghee\b/i, /\bbeurre\s+clarifi[eé]\b/i, /\bmilk\s+solid.{0,20}(remove|skim|float|separate)\b/i],
    what: "Removing the water and milk solids from butter to leave pure butterfat with a significantly higher smoke point.",
    why: "Whole butter is approximately 80% fat, 16% water, and 4% milk solids. Those milk solids burn at around 160°C — which is why butter browns and scorches so fast in a hot pan. Removing them produces clarified butter (or ghee, when the solids are cooked out completely), which can withstand temperatures above 250°C without burning. Clarified butter also won't cause emulsion sauces to split the way whole butter would if overheated.",
    tip: "Melt the butter gently without stirring. The water evaporates, the milk solids sink to the bottom or foam on top. Skim the foam and pour off the clear golden fat, leaving the solids behind. Don't rush it on high heat or the solids burn before they separate.",
  },
  {
    id: "grilling",
    label: "Grilling",
    patterns: [/\bgrill(ed|ing)?\b/i, /\bchargrill(ed|ing)?\b/i, /\bgriddle(d|ing)?\b/i, /\bchar(red|ring)?\b/i, /\bbbq\b/i, /\bbarbecue\b/i, /\bchar\s+grill\b/i],
    what: "Intense direct radiant heat applied to the surface of food, triggering rapid Maillard browning and char flavour.",
    why: "A hot grill or griddle applies radiant heat directly to the contact surface — temperatures can exceed 300°C on a char grill. This extreme surface heat triggers rapid Maillard browning and, at the highest temperatures, partial carbonisation. The char compounds — including phenols — contribute a distinct bitter, smoky flavour that is part of the character of grilled food. Grill marks represent intense localised browning that adds both texture and flavour.",
    tip: "Get the grill ripping hot before the food goes on — cold food on a cold grill steams rather than sears. Lay the food down and leave it. It will release naturally when a proper sear has formed. Forcing it off early tears the surface.",
  },
  {
    id: "kneading",
    label: "Kneading",
    patterns: [/\bknead(ed|ing)?\b/i, /\bwork.{0,20}(the\s+)?dough\b/i, /\bstretch.{0,20}(and\s+)?fold.{0,20}dough\b/i, /\bwindowpane\s+test\b/i],
    what: "Mechanically working dough to develop and align the gluten network into a strong, elastic structure.",
    why: "When flour and water combine, proteins (gliadin and glutenin) join to form gluten. Kneading stretches these strands repeatedly, causing them to align and cross-link into a tight, elastic network. A properly kneaded dough is smooth, extensible, and holds the gas produced by yeast or steam. Under-kneaded dough tears easily, doesn't hold its shape, and produces a dense, irregular crumb.",
    tip: "Windowpane test: take a small piece of dough and stretch it between your fingers. If it stretches thin enough to see light through without tearing, the gluten is fully developed. If it tears, keep kneading.",
  },
  {
    id: "liaison",
    label: "Liaison finish",
    patterns: [/\bliaison\b/i, /\begg\s+yolk.{0,20}cream.{0,20}(finish|thicken|enrich|stir)\b/i, /\bcream.{0,20}egg\s+yolk.{0,20}(finish|thicken|stir)\b/i],
    what: "Egg yolk and cream mixed together and stirred into a hot soup or sauce to enrich and thicken it at the very end.",
    why: "Egg yolk proteins thicken as they warm but scramble and seize if the liquid boils. A liaison is added off the heat or at very low temperature — the yolk gently thickens the sauce while cream adds richness and a velvety mouthfeel. The result is a more delicate, refined finish than a flour-thickened sauce and adds the flavour of egg and cream directly into the dish.",
    tip: "Always temper the liaison first: ladle a small amount of the hot sauce into the yolk-cream mixture and whisk to combine before stirring the liaison back into the pot. This raises the temperature gradually and prevents the yolk from seizing.",
  },
  {
    id: "crumbing",
    label: "Crumbing and breading",
    patterns: [/\bbread(ed|ing|crumb)\b/i, /\bcrumb(ed|ing)?\b/i, /\bpanko\b/i, /\bflour.{0,20}egg.{0,20}breadcrumb\b/i, /\bpané\b/i],
    what: "Coating food in flour, egg wash, and breadcrumbs creates a crisp, sealed exterior that protects the interior from direct heat.",
    why: "The three stages work as a system. Flour dries the surface and gives the egg wash something to grip. Egg wash is the adhesive that bonds breadcrumbs to the food. Breadcrumbs form the outer layer that crisps in the oil. When the coated food hits hot oil, breadcrumbs brown rapidly while egg proteins set and seal the coating — trapping moisture inside. The interior steams gently rather than frying directly against the oil.",
    tip: "Season at every stage — flour, egg, breadcrumbs. Dry hands, wet hands: keep one hand for the dry stages and one for the egg to avoid clumping. Press the crumbs firmly onto the surface to seal gaps.",
  },
];

export function detectTechniques(text: string): TechniqueEntry[] {
  const found: TechniqueEntry[] = [];
  for (const technique of TECHNIQUES) {
    if (technique.patterns.some(p => p.test(text))) {
      found.push(technique);
    }
  }
  return found;
}

function TechniquePopover({ technique, apprenticeMode }: { technique: TechniqueEntry; apprenticeMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTipOpen(false); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border transition-colors focus:outline-none",
            "border-primary/40 text-primary bg-primary/8 hover:bg-primary/15",
          )}
        >
          <FlaskConical className="w-2.5 h-2.5" />
          Why?
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 p-0 bg-card border-border shadow-xl overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {apprenticeMode && (
          <div className="bg-primary/10 border-b border-border px-3 py-1.5">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              {technique.label}
            </p>
          </div>
        )}
        {!apprenticeMode && (
          <div className="px-3 pt-3 pb-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{technique.label}</p>
          </div>
        )}
        <div className="p-3 space-y-2.5">
          <p className="text-xs font-medium text-foreground leading-relaxed">{technique.what}</p>
          <div className="border-t border-border pt-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">What's happening</p>
            <p className="text-xs text-foreground leading-relaxed">{technique.why}</p>
          </div>
          {technique.tip && (
            <div className="border-t border-border pt-2">
              <button
                type="button"
                className="text-[10px] font-semibold text-primary uppercase tracking-wider hover:underline flex items-center gap-0.5"
                onClick={() => setTipOpen(v => !v)}
              >
                Chef tip {tipOpen ? "▲" : "▼"}
              </button>
              {tipOpen && (
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed italic">
                  {technique.tip}
                </p>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface StepTechniqueHintsProps {
  stepText: string;
  apprenticeMode: boolean;
  className?: string;
}

export function StepTechniqueHints({ stepText, apprenticeMode, className }: StepTechniqueHintsProps) {
  const techniques = detectTechniques(stepText);
  if (techniques.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1 mt-1", className)}>
      {techniques.map(t => (
        <TechniquePopover key={t.id} technique={t} apprenticeMode={apprenticeMode} />
      ))}
    </div>
  );
}
