import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type GlossaryEntry = {
  short: string;
  detail?: string;
};

const GLOSSARY: Record<string, GlossaryEntry> = {
  "GP%": {
    short: "What's left after ingredient cost, as a percentage of the selling price.",
    detail: "A kitchen targeting 70% GP on a $30 dish keeps $21 after ingredient cost to cover wages, rent, and overheads.",
  },
  "GP": {
    short: "Gross profit — revenue minus ingredient cost.",
    detail: "GP is what the kitchen earns before fixed costs. Protecting it means watching portion size and waste closely.",
  },
  "Yield": {
    short: "The usable percentage of an ingredient after prep and trim.",
    detail: "A fillet with 70% yield means 30% is lost to skin, bones, and trim. You buy more than you use.",
  },
  "Yield %": {
    short: "The usable percentage of an ingredient after prep and trim.",
    detail: "A fillet with 70% yield means 30% is lost to skin, bones, and trim. You buy more than you use.",
  },
  "Trim loss": {
    short: "Weight lost during prep — skin, bones, offcuts.",
    detail: "Trim loss raises your effective cost per usable kilo. Accurate yield tracking keeps costing honest.",
  },
  "Par level": {
    short: "The minimum stock level that triggers a reorder.",
    detail: "Running below par risks stock-outs during service. Par levels are set based on usage and delivery frequency.",
  },
  "Portion cost": {
    short: "The ingredient cost to produce one serving.",
    detail: "Portion cost is the foundation of menu pricing. Over-portioning quietly erodes GP every cover.",
  },
  "Food cost": {
    short: "Ingredient cost as a percentage of the selling price.",
    detail: "Industry benchmarks vary — 28–35% is common. High food cost means less margin left for the business.",
  },
  "Food cost %": {
    short: "Ingredient cost as a percentage of the selling price.",
    detail: "If a dish costs $9 to make and sells for $30, food cost is 30%. Lower is better for the business.",
  },
  "Margin": {
    short: "The gap between what a dish costs and what you charge.",
    detail: "A wider margin gives the kitchen more resilience when supplier prices rise.",
  },
  "Mise en place": {
    short: "Everything in its place — all prep done and organised before service.",
    detail: "Strong mise en place is the foundation of a smooth service. Gaps during service usually trace back to gaps in prep.",
  },
  "Nappe": {
    short: "When a sauce coats the back of a spoon and holds a clean line.",
    detail: "Run your finger across the back of the spoon — if the line holds without running, the sauce is at nappe.",
  },
  "Julienne": {
    short: "Fine matchstick cuts — roughly 3mm × 3mm × 5cm.",
    detail: "Used for garnishes, stir-fries, and anything needing quick, even cooking. Consistency in size = consistent cooking time.",
  },
  "Brunoise": {
    short: "Very fine dice — typically 3mm cubes — from julienned strips.",
    detail: "Brunoise is used where you want flavour distributed evenly without texture. Start from julienne and cross-cut.",
  },
  "Blanching": {
    short: "Brief boiling followed immediately by an ice bath to stop cooking.",
    detail: "Blanching sets colour and texture. The ice bath is as important as the boil — skip it and the vegetable keeps cooking.",
  },
  "Fond": {
    short: "The brown, caramelised residue left on the pan base after cooking protein.",
    detail: "Fond is pure Maillard reaction product — concentrated flavour. Deglazing with liquid dissolves it directly into the sauce. Never wash it away.",
  },
  "Mirepoix": {
    short: "A base of diced onion, carrot, and celery — roughly 2 parts onion to 1 part each carrot and celery.",
    detail: "Mirepoix is sweated or roasted to build the aromatic foundation of stocks, braises, and soups. It's about flavour, not texture — the veg is usually strained out.",
  },
  "Bouquet garni": {
    short: "A bundle of herbs — typically bay, thyme, and parsley stalks — used to flavour stocks and braises.",
    detail: "The bundle is tied or wrapped in muslin so it can be removed cleanly before serving. The herbs flavour the liquid without ending up in the finished dish.",
  },
  "Roux": {
    short: "Equal parts butter and flour cooked together to form a thickening base for sauces.",
    detail: "The fat coats the starch granules, preventing lumps when liquid is added. Whisk liquid in gradually and bring to a simmer to fully activate the thickening.",
  },
  "Beurre blanc": {
    short: "A warm emulsion sauce of reduced white wine, vinegar, and cold butter — classically served with fish.",
    detail: "The butter is whisked in cold, piece by piece, off direct heat. The sauce is a temporary emulsion — it will split if it gets too hot or sits too long.",
  },
  "Jus": {
    short: "The natural cooking juices from a roasted protein, lightly reduced to concentrate flavour.",
    detail: "A true jus is not thickened with flour or starch — its body comes from dissolved gelatin and reduced protein. It should coat a spoon lightly and taste intensely of the protein.",
  },
  "Consommé": {
    short: "A crystal-clear stock of intense flavour, clarified with a raft of minced meat and egg white.",
    detail: "The egg white proteins coagulate and trap particles as they rise to the surface. The result is clear enough to read through, with a clean, deep flavour.",
  },
  "Bain-marie": {
    short: "A container of hot water used to cook or keep food warm gently and evenly.",
    detail: "Water in a bain-marie can't exceed 100°C, which prevents overcooking delicate items like custards, chocolate, and egg-based sauces. Also used to hold finished sauces at service temperature.",
  },
  "Al dente": {
    short: "Cooked until just firm to the bite — with a slight resistance at the centre.",
    detail: "Literally 'to the tooth' in Italian. For pasta, al dente means the starch has gelatinised on the outside but the centre still has structure. Overcooked pasta has a uniformly soft, starchy texture throughout.",
  },
  "Suprême": {
    short: "A chicken breast with the wing bone left in, or the best, pith-free segment of a citrus fruit.",
    detail: "A chicken suprême is a classical presentation. A citrus suprême is cut between the membranes with a sharp knife, releasing a clean, juiceless segment — no pith, no membrane.",
  },
  "Chiffonade": {
    short: "Herbs or leafy greens rolled tightly and sliced finely into ribbons.",
    detail: "Stack the leaves, roll tightly into a cylinder, and cut across the roll with a sharp knife. Produces clean, fine ribbons ideal for garnish and raw applications. A bruised or torn chiffonade discolours quickly.",
  },
  "Concassé": {
    short: "Tomatoes that have been blanched, peeled, deseeded, and diced.",
    detail: "Removing the skin and seeds gives a clean, refined texture free from bitterness and excess moisture. Used as a garnish, sauce component, or base where texture and clarity of flavour matter.",
  },
  "Liaison": {
    short: "A mixture of egg yolk and cream stirred into a sauce to enrich and thicken it without boiling.",
    detail: "The egg yolk proteins thicken as they warm, but scramble if the sauce boils. Add a ladle of hot sauce to the liaison first to temper it before stirring it in — then hold just below a simmer.",
  },
  "Gastrique": {
    short: "A sweet-sour syrup of caramelised sugar and vinegar used as a base for classic French fruit sauces.",
    detail: "Caramelise sugar to amber, carefully add acid (vinegar or citrus juice) to arrest it, then combine with a stock or jus. The sweet-acid balance cuts through rich proteins like duck, pork, and liver.",
  },
  "Sabayon": {
    short: "Egg yolks whisked with a liquid over gentle heat until thick, pale, and airy.",
    detail: "The heat partially cooks the yolks while the constant whisking incorporates air. Used sweet (with wine or juice over a bain-marie) in desserts, or savoury with stock to finish fish dishes.",
  },
  "Quenelle": {
    short: "An oval shape formed between two spoons to present soft preparations neatly.",
    detail: "Used for ice cream, mousse, pâté, or purées. The technique requires identical spoons and a smooth, cold preparation. Dipping the spoon in warm water between each quenelle helps.",
  },
  "Barding": {
    short: "Wrapping a lean piece of meat in a thin layer of fat before roasting to prevent it drying out.",
    detail: "The fat renders slowly during roasting, basting the meat continuously from the outside. Removed before serving (or left on for presentation), barding is used for game birds, venison loins, and lean tenderloin.",
  },
  "Larding": {
    short: "Threading strips of fat through the interior of a lean piece of meat using a larding needle.",
    detail: "Internal larding bastes the meat from within as the fat renders. Unlike barding, the fat stays inside the cut. Classically used for venison and other lean game where fat marbling is minimal.",
  },
  "Velouté": {
    short: "A classic French sauce made from a light (white) stock thickened with a roux.",
    detail: "One of the five mother sauces. Chicken velouté uses chicken stock; fish velouté uses fish stock. The roux is a white or blonde roux — cooked briefly so it's pale. The sauce should be smooth, glossy, and lightly coat a spoon.",
  },
  "Chinois": {
    short: "A fine-mesh conical strainer used to produce smooth, particle-free stocks and sauces.",
    detail: "Forcing liquid through a chinois removes herbs, spices, fine solids, and small particles that would cloud or roughen the texture of a finished sauce. For extra clarity, line it with damp muslin.",
  },
  "Wok hei": {
    short: "The smoky, charred character produced in stir-frying by extreme heat — literally 'breath of the wok'.",
    detail: "Achieved when oil and food char slightly at temperatures above 300°C. The result is a complex, slightly smoky flavour that cannot be replicated at domestic heat levels. High-output commercial burners are what make it possible.",
  },
  "Sachet d'épices": {
    short: "Spices and aromatics wrapped in muslin to flavour stocks without clouding them.",
    detail: "Typically contains peppercorns, bay leaf, thyme, and parsley stalks. Tied shut and submerged in the liquid, then removed cleanly. A more controlled alternative to a bouquet garni for whole spices.",
  },
  "Monter au beurre": {
    short: "Finishing a sauce by whisking cold butter in off the heat to add gloss and richness.",
    detail: "The cold butter emulsifies into the hot sauce, adding body and a velvety texture. The sauce must not return to a simmer once the butter is in or the emulsion will break.",
  },
  "Confit (term)": {
    short: "Slow-cooked and preserved in fat — typically at 70–90°C until silky tender.",
    detail: "Originally a French preservation method. Cooked duck, pork, or garlic cooled in its own fat stays edible for weeks in the fridge. The fat acts as an oxygen barrier, slowing spoilage.",
  },
  "Sous vide (term)": {
    short: "Vacuum-sealed food cooked in a precisely temperature-controlled water bath.",
    detail: "Allows edge-to-edge uniform doneness impossible to achieve by conventional cooking. The food cannot exceed the water temperature, giving precise control over internal temperature and texture.",
  },
  "Nappe (consistency)": {
    short: "The stage where a sauce coats the back of a spoon and holds a clean line when wiped.",
    detail: "The standard test for a finished sauce. If the line holds without running, the sauce has enough gelatin or starch to coat and cling to food rather than pooling on the plate.",
  },
  "Maillard reaction": {
    short: "The chemical reaction between amino acids and sugars above 140°C that creates browning and hundreds of new flavour compounds.",
    detail: "Named after Louis-Camille Maillard. The reaction is what makes seared meat, toasted bread, roasted coffee, and caramelised onions taste the way they do. It requires a dry surface — moisture creates steam which prevents the temperature reaching the Maillard range.",
  },
  "Collagen": {
    short: "The tough connective protein in secondary cuts of meat that converts to gelatin under prolonged heat.",
    detail: "Found in cuts from muscles that work hard — shoulder, shank, cheek. Above 70°C collagen begins converting to gelatin, but slowly. Low, slow cooking gives it the time to fully dissolve — transforming a tough cut into something tender and silky.",
  },
  "Gelatin": {
    short: "The protein formed when collagen breaks down under heat — gives stocks and braises their body and gloss.",
    detail: "A well-made stock gels when cold because of dissolved gelatin. On the plate, gelatin makes sauces coat and cling rather than running. It also sets panna cotta, terrines, and cold preparations when cooled.",
  },
  "Emulsion": {
    short: "A stable mixture of fat and water, held together by an emulsifier.",
    detail: "Fat and water naturally separate. An emulsifier — like lecithin in egg yolk — surrounds fat droplets and holds them suspended in the water phase. Break the emulsion (too much heat, fat added too fast) and the sauce splits.",
  },
  "Béchamel": {
    short: "A classic white sauce made by adding hot milk to a white roux.",
    detail: "One of the five French mother sauces. The ratio of roux to milk determines thickness. Season with salt, white pepper, and nutmeg. Base for cheese sauces (Mornay), soufflés, and gratins.",
  },
  "Stock": {
    short: "A flavoured liquid made by simmering bones, vegetables, and aromatics.",
    detail: "Long simmering extracts gelatin from bones (which gives stock body and gloss) and flavour compounds from the ingredients. A well-made stock forms a gel when cold. The difference between a great sauce and an average one often traces back to the quality of the stock.",
  },
  "Court bouillon": {
    short: "A light, acidulated poaching liquid — water, white wine or vinegar, vegetables, and aromatics.",
    detail: "Used to poach fish and shellfish. The acid (wine or vinegar) helps keep delicate proteins firm and white during cooking. It is not usually strained and reused as stock since it's too lightly flavoured and has done its job in the poach.",
  },
  "Beurre manié": {
    short: "Equal parts raw butter and flour kneaded together — used to thicken a finished sauce.",
    detail: "Unlike a roux, beurre manié is added to a simmering sauce at the end of cooking, not at the beginning. Small pieces are whisked in until the desired consistency is reached. The raw flour flavour cooks out quickly at a simmer. Useful for last-minute corrections.",
  },
  "Ghee": {
    short: "Butter that has been slowly cooked until all water and milk solids have been removed.",
    detail: "The difference between ghee and clarified butter is time and temperature: ghee is cooked longer until the milk solids brown before being strained out, adding a nutty flavour. Smoke point is over 250°C. Standard in Indian cooking and increasingly used in professional kitchens.",
  },
  "Blanch and refresh": {
    short: "Blanching in boiling water followed immediately by an ice bath to stop cooking.",
    detail: "The 'refresh' is the ice bath — it's as important as the boil. Without it the vegetable continues cooking from residual heat, losing colour and texture. The moment it's cold, drain it — don't leave it sitting in water or it continues to absorb moisture.",
  },
  "Paysanne": {
    short: "Flat, thin square or round cuts of vegetable — roughly 1cm across, 2–3mm thick.",
    detail: "Used in soups and slow braises where the cut needs to hold its shape but still cook through quickly. Larger than brunoise, smaller than a rough chop. The flat shape gives more surface area for flavour exchange with the liquid.",
  },
  "Nage": {
    short: "A fragrant, aromatic court bouillon — typically used as a light sauce base for shellfish.",
    detail: "More refined than a standard court bouillon — often finished with cream or butter to become a sauce in its own right. 'À la nage' describes shellfish served in their own aromatic cooking broth.",
  },
  "Trim": {
    short: "The unusable off-cuts removed during prep — skin, fat cap, sinew, bone.",
    detail: "Trim isn't waste if you use it: bones for stock, fat for rendering, trim meat for farce or staff food. What you can't use is waste — and it's factored into your yield calculation when costing a dish.",
  },
  "Clarified butter": {
    short: "Butter with the water and milk solids removed — pure butterfat with a smoke point above 250°C.",
    detail: "Used for sautéing and pan-frying where you need butter flavour without burning. Also used in hollandaise and béarnaise to prevent splitting. Ghee is a similar product where the milk solids are browned before removal.",
  },
  "Hollandaise": {
    short: "A warm emulsion sauce of egg yolk and clarified butter, stabilised by lecithin.",
    detail: "Made by whisking yolks over a bain-marie to a ribbon stage, then slowly incorporating clarified butter. Service temperature is critical — too cold and it thickens unworkably; too hot and it splits. Béarnaise is hollandaise with a tarragon reduction.",
  },

  // ── Core Kitchen Execution ─────────────────────────────────────────────────

  "Batch cooking": {
    short: "Cooking a controlled larger quantity at once rather than repeatedly to order.",
    detail: "Reduces the number of times you fire the same component and produces more consistent results across service. A sauce or grain batched correctly means one person can run it through a full service without resetting. It's the difference between reactive cooking and controlled execution.",
  },
  "Portioning": {
    short: "Dividing food into consistent serving sizes — by weight, measure, or count.",
    detail: "Every gram over spec costs money. A protein portion 20g over spec, across 80 covers a night, adds up to thousands of dollars a year in eroded GP. A digital scale is non-negotiable for proteins, desserts, and anything with significant ingredient cost. Eyeballing portions is one of the fastest ways to quietly destroy your food cost.",
  },
  "Prep list": {
    short: "A structured list of every preparation task required before service begins.",
    detail: "Built at the end of the previous service or at the start of the prep shift based on expected covers and remaining stock. A tight prep list is the difference between a calm service and a scramble. If a task isn't on the list, it usually doesn't get done — and someone finds out at the worst possible time.",
  },
  "SOP": {
    short: "Standard Operating Procedure — a written step-by-step method for a repeatable task.",
    detail: "SOPs exist so the method doesn't live in one person's head. When a team member leaves or a new starter joins, the SOP means the task still runs correctly. Without them, quality depends entirely on whoever is standing at that station — which is not a system, it's a gamble.",
  },
  "Cross contamination": {
    short: "Transfer of harmful bacteria or allergens between foods, surfaces, or equipment.",
    detail: "Happens through direct contact, shared equipment, or unclean hands. Raw protein on a board that then touches cooked food, or a knife used on tree nuts before a 'nut-free' dish — these are the most common ways cross contamination causes a food safety incident or an allergen reaction. Separate boards, colour coding, and hand washing are the controls.",
  },
  "HACCP": {
    short: "Hazard Analysis and Critical Control Points — a systematic framework for managing food safety risks.",
    detail: "Identifies the specific points in a process where hazards must be controlled — cooking temperatures, chilling times, storage conditions. Every professional kitchen in Australia operates within a legal HACCP obligation. Chefs who understand it make better real-time decisions: they know why the rules exist, not just what they are.",
  },
  "Temperature danger zone": {
    short: "The temperature range between 5°C and 60°C where bacteria multiply most rapidly.",
    detail: "Bacteria can double in number every 20 minutes inside the danger zone. Food left in this range for more than two to four hours becomes a safety risk. This is why rapid chilling after cooking, proper cold storage, and hot holding temperatures matter — every hour the food sits in this range, the risk compounds.",
  },
  "FIFO": {
    short: "First In, First Out — the oldest stock is used before newly received stock.",
    detail: "New deliveries go to the back, older stock comes to the front. When FIFO breaks down, food expires before it's used and food cost climbs without anyone knowing exactly why. Correct rotation is one of the simplest and most consistently ignored habits in busy kitchens.",
  },
  "Shelf life": {
    short: "The period within which a product remains safe and at acceptable quality.",
    detail: "Shelf life depends on the product, storage method, and temperature — and it starts the moment an item is prepped or opened, not when it was delivered. Knowing the shelf life of every prepared product means you batch the right quantities and label correctly. Over-batching perishables is one of the most common and expensive forms of avoidable waste.",
  },
  "Date labeling": {
    short: "Marking prepared food with the prep date and use-by date.",
    detail: "Required for compliance and essential for FIFO rotation. Unlabeled containers are a service hazard — no one knows if the sauce is from yesterday or four days ago. A label takes five seconds. A food safety incident takes significantly longer to recover from.",
  },
  "Stock rotation": {
    short: "Systematically moving older stock to the front so it's used before newer deliveries.",
    detail: "The physical execution of FIFO. Applies to fridges, dry stores, freezers, and any shared ingredient. When rotation slips, waste cost rises — and it usually takes weeks to notice because the affected product is buried at the back.",
  },
  "Sanitiser contact time": {
    short: "The minimum time a sanitiser must stay wet on a surface to effectively kill bacteria.",
    detail: "Wiping a surface immediately after spraying doesn't sanitise it — the chemical needs time to work. Most kitchen sanitisers require 30 seconds to 2 minutes of contact time. Skipping it means the surface looks clean but hasn't been properly treated. This is one of the most commonly rushed hygiene steps in a busy kitchen.",
  },

  // ── Service Flow ───────────────────────────────────────────────────────────

  "The pass": {
    short: "The service counter between kitchen and floor — where dishes are checked before leaving the kitchen.",
    detail: "The pass is the chef's final quality control point. Temperature, presentation, and accuracy are verified here before anything reaches a guest. Nothing leaves the kitchen without being called and cleared at the pass. A disorganised pass during a busy service is one of the clearest signs of a kitchen that's lost control.",
  },
  "All day": {
    short: "The total running count of a dish required across all open tickets at that moment.",
    detail: "Used to coordinate production across stations. 'How many salmon all day?' means: add up every open ticket and give me the total right now. Chefs batching or managing a component to order need the all-day count to know how much to fire and when — without it, timing falls apart.",
  },
  "86'd": {
    short: "An item is 86'd when it's sold out, unavailable, or pulled from service.",
    detail: "When something is 86'd, front of house must be told immediately so they stop selling it. An 86 that doesn't get communicated quickly leads to a table ordering something that can't be made — one of the most avoidable failures during service. The call goes to the manager or senior FOH first.",
  },
  "Fire": {
    short: "The instruction to start cooking a dish immediately for a specific table.",
    detail: "Called by the head chef or expediter to coordinate timing across stations. Firing at the right moment — not too early, not too late — is what keeps the pass clean and tables turning. A fired dish that sits waiting for another station is a dish that has already been compromised.",
  },
  "Pick up": {
    short: "The instruction to plate and bring a dish to the pass — components are ready to finish now.",
    detail: "Called across a station when the main component or sides are ready to plate. 'Pick up on table 4' means everything for that table should be coming together right now. It's a timing call, not a suggestion — hesitation at pick up puts the whole table behind.",
  },
  "Docket": {
    short: "The printed or displayed order from a table — the kitchen's instruction to cook.",
    detail: "Each docket shows what's ordered, for how many covers, and often the timing sequence. Reading and organising dockets efficiently is one of the most underrated skills in a busy kitchen — a misread docket means a wrong dish, a re-fire, and a table that waits twice.",
  },
  "Behind": {
    short: "A call made when moving behind a colleague in a tight kitchen space.",
    detail: "Non-negotiable when carrying hot pans, sharp knives, or full plates. If you don't call 'behind', you take responsibility for what happens if someone steps back. One missed call can cause a burn, a dropped plate, or a serious injury. It's a professional habit that takes about a week to build and a moment of carelessness to break.",
  },
  "Corner": {
    short: "A call made before coming around a blind corner in the kitchen, especially when carrying hot or sharp items.",
    detail: "Called out before you turn to warn anyone approaching from the other direction. Along with 'behind', it's one of the two most basic kitchen safety calls — and one of the first things a new starter should learn before they pick up anything hot.",
  },
  "Re-fire": {
    short: "Cooking a dish again because the original was wrong, overcooked, or returned.",
    detail: "A re-fire costs ingredient cost, labour time, and table timing. During a busy service, a re-fire on one dish can back up an entire section. Understanding what caused the re-fire — wrong temp, allergen error, misread ticket — is more important than just fixing it quickly.",
  },
  "Hold": {
    short: "An instruction to keep a dish or component at temperature without plating or sending it yet.",
    detail: "Used when a table's timing is off or a component ahead of schedule. Holding a dish correctly — in a bain-marie, under a heat lamp, or covered — is the difference between it arriving in good condition and arriving compromised. Food held too long at the wrong temperature is both a quality and safety issue.",
  },

  // ── Commercial & Food Cost Literacy ───────────────────────────────────────

  "Contribution margin": {
    short: "The amount a dish contributes to covering overheads and profit after ingredient cost.",
    detail: "A high food cost% doesn't always mean a dish is bad for the business — contribution margin matters more at volume. A $10 pasta at 30% food cost contributes $7. A $40 steak at 40% food cost contributes $24. At scale, the higher-margin absolute contribution is what pays the bills — not which dish has the lowest food cost%.",
  },
  "Menu price": {
    short: "The final selling price of a dish — what the guest pays.",
    detail: "Set to cover food cost, labour, overheads, and target GP. Menu prices need to be reviewed when supplier costs shift — a dish that made sense at $28 last year may now be running at 40% food cost because ingredient prices moved without a corresponding price review. Regular cost updates are what keep the numbers honest.",
  },
  "Overproduction": {
    short: "Making more food than the service required, resulting in waste or carry-over.",
    detail: "Overproduction is one of the most expensive kitchen habits because it's invisible in the moment — the food looks fine, it just doesn't sell. Every portion that goes in the bin is a portion you paid ingredient cost and labour on but never recovered. If a dish is consistently over-produced, the prep list or batch size needs to change.",
  },
  "Underproduction": {
    short: "Not producing enough food for service, resulting in 86's and missed covers.",
    detail: "86ing a dish mid-service has an immediate impact on revenue and guest experience. Consistent underproduction usually means the forecast is wrong — either cover numbers aren't being tracked or menu popularity isn't being factored into prep. Building from historical data reduces it significantly.",
  },
  "Shrinkage": {
    short: "Loss of inventory between receiving and selling — through waste, spoilage, theft, or over-portioning.",
    detail: "Shrinkage is invisible until you do a stocktake. If your theoretical food cost is 28% but your actual cost is 35%, the gap is shrinkage. Regular stocktakes and tight portioning controls are the only ways to find it and address it. Most kitchens don't know how bad it is until the figures are put side by side.",
  },
  "Invoice variance": {
    short: "The difference between the price you expected to pay and what a supplier actually charged.",
    detail: "Small variances compound across deliveries. A supplier who quietly increases the price of key ingredients by 5% costs thousands before you notice. Checking invoices against expected pricing is how professional kitchens catch cost drift early — before it shows up in month-end GP figures.",
  },
  "Unit cost": {
    short: "The cost of an ingredient per standard unit — per kilogram, litre, or piece.",
    detail: "All recipe costing uses unit cost, not pack price. If you buy salmon at $28 per kg and your recipe uses 180g, the ingredient cost for that portion is $5.04. Errors in unit cost flow through every dish the ingredient touches — small calculation mistakes compound across a full menu.",
  },
  "Price spike": {
    short: "A sudden, sharp increase in a supplier's price for an ingredient.",
    detail: "Can happen due to weather events, supply chain issues, or seasonal scarcity. A key ingredient that spikes can push a dish's food cost from 30% to 42% overnight. Chefs who catch it early can substitute, adjust the portion, or raise the price. Those who don't usually find out at month end when the GP% has already taken the hit.",
  },
  "Cost drift": {
    short: "The gradual increase in food cost caused by multiple small, unnoticed supplier price changes accumulating over time.",
    detail: "No single change triggers a review — the problem compounds quietly. If you don't compare current supplier pricing to your recipe cost regularly, cost drift is guaranteed. Most kitchens discover it when GP% drops and there's no obvious single cause — the answer is usually in the price history.",
  },
  "Waste cost": {
    short: "The dollar value of food that was produced but not sold or used.",
    detail: "Every waste item has a real cost: ingredient cost plus the labour used to produce it. A hotel pan of sauce discarded at end of service might represent $40 in ingredients and 30 minutes of labour. Logging waste consistently is the first step to understanding where money is leaving the kitchen — and what to change.",
  },
  "Selling price": {
    short: "The price charged to the guest — what you use to calculate food cost% and GP%.",
    detail: "Selling price must be set with a specific food cost target in mind, not backwards from what feels reasonable. If your target is 30% food cost and the portion costs $9 to make, the selling price must be at least $30. Repricing must follow whenever ingredient costs shift significantly.",
  },

  // ── Operational Intelligence ───────────────────────────────────────────────

  "Bottleneck": {
    short: "The station, task, or person that is slowing down the rest of service.",
    detail: "The weakest link sets the speed of the whole operation. If every other station is ready but the grill is holding up every ticket, the grill is the bottleneck — and adding speed anywhere else has no effect. Identifying and relieving bottlenecks, through extra help or re-sequencing, unlocks the entire service.",
  },
  "Critical path item": {
    short: "A prep task that directly blocks a dish from being completed — if it's not done, service stops.",
    detail: "Not all prep is equal. The duck legs need four hours in the oven — that's on the critical path. The garnish takes five minutes. Knowing which tasks are critical path tells you what to start first when prep time is compressed. Leaving a critical path item until the afternoon is how kitchens walk into service unprepared.",
  },
  "Load imbalance": {
    short: "Uneven distribution of work across kitchen stations — one section overwhelmed while another is idle.",
    detail: "Load imbalance is exhausting for the overloaded station and wasteful for everyone else. If larder is flat out every service while another section has nothing to do, the menu design, section allocation, or task distribution needs to change. Good section chefs read the balance mid-service and shift help without being asked.",
  },
  "Service pressure": {
    short: "The operational stress on the kitchen during service — measured by ticket volume, complexity, and time pressure.",
    detail: "High service pressure is when the kitchen is at or near its operational limit. The decisions made under pressure — what to defer, what to simplify, what to ask for help with — separate experienced teams from inexperienced ones. Strong mise en place is the only reliable way to reduce service pressure before it builds.",
  },
  "Throughput": {
    short: "The number of covers or dishes a kitchen can produce in a given service period.",
    detail: "Throughput is the output of the whole system — not the speed of any single station. Increasing throughput isn't always about working faster. It's about removing bottlenecks, improving mise en place, and reducing the time food spends waiting at any point in the process. A kitchen that moves food smoothly outperforms one that works harder but less efficiently.",
  },
  "Cover count": {
    short: "The number of guests or meals served in a service period.",
    detail: "Cover count drives every prep and purchasing decision. Knowing your expected covers for the week lets you prep accurately, order efficiently, and staff appropriately. Kitchens without reliable cover data make reactive decisions — which compounds waste, labour cost, and service pressure.",
  },
  "Variance": {
    short: "The gap between what was planned or expected and what actually happened.",
    detail: "Variance shows up in food cost, portion weight, yield, and cover count. In a professional kitchen, variance is not just a number — it's a question: why did actual differ from expected? Chasing the answer is how kitchens get better. Ignoring it means the same problem repeats.",
  },
};

interface GlossaryTooltipProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
}

export function GlossaryTooltip({ term, children, className }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[term];

  if (!entry) {
    return <>{children ?? term}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
          className={
            "border-b border-dashed border-primary/60 cursor-pointer text-inherit hover:border-primary transition-colors " +
            (className ?? "")
          }
        >
          {children ?? term}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-64 p-3 bg-card border-border shadow-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="text-xs font-semibold text-primary mb-1">{term}</p>
        <p className="text-xs text-foreground leading-relaxed">{entry.short}</p>
        {entry.detail && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 pt-1.5 border-t border-border">
            {entry.detail}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { GLOSSARY };
export type { GlossaryEntry };
