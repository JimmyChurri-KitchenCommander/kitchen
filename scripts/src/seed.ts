import {
  db,
  venuesTable,
  suppliersTable,
  inventoryItemsTable,
  priceHistoryTable,
  recipesTable,
  recipeIngredientsTable,
  wasteLogsTable,
  invoicesTable,
  invoiceItemsTable,
  menusTable,
  menuItemsTable,
  prepTasksTable,
} from "@workspace/db";

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: pnpm --filter @workspace/scripts run seed <clerkUserId>");
  process.exit(1);
}

async function seed() {
  console.log(`Seeding demo data for user: ${userId}`);

  // ─── VENUE ───────────────────────────────────────────────────────────────
  const [venue] = await db.insert(venuesTable).values({
    name: "The Black Apron",
    userId,
    address: "42 Market Lane, Soho, London W1F 7QN",
  }).returning();
  const venueId = venue!.id;
  console.log(`  Venue: ${venue!.name} (id=${venueId})`);

  // ─── SUPPLIERS ───────────────────────────────────────────────────────────
  const suppliersData = [
    {
      name: "Borough Produce Co.",
      contactName: "Marcus Webb",
      email: "marcus@boroughproduce.co.uk",
      phone: "+44 20 7403 5500",
      deliveryDays: "Monday,Wednesday,Friday",
      orderCutoffTime: "14:00",
      minimumOrderValue: "250.00",
      deliveryFee: "0.00",
      notes: "Best prices on heritage veg and salads. Minimum $250.",
    },
    {
      name: "Atlas Meats",
      contactName: "Janet Forde",
      email: "orders@atlasmeats.com",
      phone: "+44 20 8964 3300",
      deliveryDays: "Tuesday,Thursday,Saturday",
      orderCutoffTime: "10:30",
      minimumOrderValue: "400.00",
      deliveryFee: "15.00",
      notes: "Dry-aged beef, heritage pork. Cutoff 10:30 for next-day.",
    },
    {
      name: "Sealane Fisheries",
      contactName: "Pete Alcott",
      email: "pete@sealane.fish",
      phone: "+44 20 7234 8801",
      deliveryDays: "Monday,Wednesday,Friday",
      orderCutoffTime: "08:00",
      minimumOrderValue: "150.00",
      deliveryFee: "0.00",
      notes: "Day-boat fish. Early cutoff — order by 8am for same-day delivery.",
    },
    {
      name: "Continental Dairy",
      contactName: "Sofia Andreou",
      email: "sofia@condairy.eu",
      phone: "+44 20 7946 1234",
      deliveryDays: "Tuesday,Friday",
      orderCutoffTime: "12:00",
      minimumOrderValue: "100.00",
      deliveryFee: "8.50",
      notes: "French + Italian dairy, cultured butters, aged cheeses.",
    },
  ];

  const suppliers = await Promise.all(
    suppliersData.map(s => db.insert(suppliersTable).values({ venueId, ...s }).returning().then(r => r[0]!))
  );
  console.log(`  Suppliers: ${suppliers.map(s => s.name).join(", ")}`);

  const [produce, meats, fish, dairy] = suppliers as NonNullable<typeof suppliers[number]>[];

  // ─── INVENTORY ITEMS ─────────────────────────────────────────────────────
  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

  const inventoryData = [
    // Produce
    { name: "Rocket (Wild)", unit: "kg", currentStock: "1.2", parLevel: "3.0", averageCost: "4.80", supplierId: produce!.id, shelfLifeDays: 5, lastRestocked: daysAgo(9) },
    { name: "Heritage Tomatoes", unit: "kg", currentStock: "4.5", parLevel: "5.0", averageCost: "3.20", supplierId: produce!.id, shelfLifeDays: 7, lastRestocked: daysAgo(1) },
    { name: "Baby Courgette", unit: "kg", currentStock: "0.8", parLevel: "2.0", averageCost: "5.60", supplierId: produce!.id, shelfLifeDays: 5, lastRestocked: daysAgo(2) },
    { name: "Shallots", unit: "kg", currentStock: "3.0", parLevel: "2.0", averageCost: "2.40", supplierId: produce!.id, shelfLifeDays: 30, lastRestocked: daysAgo(3) },
    { name: "Fresh Thyme", unit: "bunch", currentStock: "4", parLevel: "6", averageCost: "0.90", supplierId: produce!.id, shelfLifeDays: 7, lastRestocked: daysAgo(1) },
    { name: "Garlic (Whole)", unit: "kg", currentStock: "2.5", parLevel: "2.0", averageCost: "3.50", supplierId: produce!.id, shelfLifeDays: 30, lastRestocked: daysAgo(4) },
    { name: "Seasonal Leaves", unit: "kg", currentStock: "1.8", parLevel: "2.0", averageCost: "6.50", supplierId: produce!.id, shelfLifeDays: 3, lastRestocked: daysAgo(1) },
    // Meats
    { name: "Beef Bavette", unit: "kg", currentStock: "3.2", parLevel: "4.0", averageCost: "22.50", supplierId: meats!.id, shelfLifeDays: 5, lastRestocked: daysAgo(2) },
    { name: "Heritage Pork Belly", unit: "kg", currentStock: "2.0", parLevel: "3.0", averageCost: "14.80", supplierId: meats!.id, shelfLifeDays: 4, lastRestocked: daysAgo(3) },
    { name: "Duck Leg (Confit-ready)", unit: "kg", currentStock: "0.4", parLevel: "2.0", averageCost: "18.00", supplierId: meats!.id, shelfLifeDays: 5, lastRestocked: daysAgo(11) },
    { name: "Chicken Thigh (Boneless)", unit: "kg", currentStock: "1.5", parLevel: "2.5", averageCost: "9.20", supplierId: meats!.id, shelfLifeDays: 3, lastRestocked: daysAgo(1) },
    // Fish
    { name: "Sea Bass (Whole)", unit: "kg", currentStock: "2.8", parLevel: "3.0", averageCost: "19.50", supplierId: fish!.id, shelfLifeDays: 2, lastRestocked: daysAgo(1) },
    { name: "Hand-Dived Scallops", unit: "piece", currentStock: "24", parLevel: "30", averageCost: "2.80", supplierId: fish!.id, shelfLifeDays: 2, lastRestocked: daysAgo(1) },
    // Dairy
    { name: "Aged Manchego (6mo)", unit: "kg", currentStock: "1.1", parLevel: "1.5", averageCost: "28.00", supplierId: dairy!.id, shelfLifeDays: 60, lastRestocked: daysAgo(12) },
    { name: "Cultured Butter (Normandy)", unit: "kg", currentStock: "2.0", parLevel: "1.5", averageCost: "12.60", supplierId: dairy!.id, shelfLifeDays: 21, lastRestocked: daysAgo(5) },
    { name: "Double Cream", unit: "litre", currentStock: "0.5", parLevel: "2.0", averageCost: "3.80", supplierId: dairy!.id, shelfLifeDays: 10, lastRestocked: daysAgo(2) },
    { name: "Crème Fraîche", unit: "kg", currentStock: "0.6", parLevel: "1.0", averageCost: "5.20", supplierId: dairy!.id, shelfLifeDays: 14, lastRestocked: daysAgo(3) },
    // Pantry
    { name: "Sourdough Loaf", unit: "loaf", currentStock: "6", parLevel: "10", averageCost: "3.80", supplierId: produce!.id, shelfLifeDays: 2, lastRestocked: daysAgo(1) },
    { name: "Vanilla Pods", unit: "piece", currentStock: "12", parLevel: "10", averageCost: "1.20", supplierId: dairy!.id, shelfLifeDays: 365, lastRestocked: daysAgo(20) },
    { name: "Caster Sugar", unit: "kg", currentStock: "5.0", parLevel: "3.0", averageCost: "0.85", supplierId: produce!.id, shelfLifeDays: 365, lastRestocked: daysAgo(14) },
  ];

  const inventoryItems = await Promise.all(
    inventoryData.map(i => db.insert(inventoryItemsTable).values({
      venueId,
      name: i.name,
      unit: i.unit,
      currentStock: i.currentStock,
      parLevel: i.parLevel,
      averageCost: i.averageCost,
      supplierId: i.supplierId,
      shelfLifeDays: i.shelfLifeDays,
      lastRestocked: i.lastRestocked,
    }).returning().then(r => r[0]!))
  );
  console.log(`  Inventory: ${inventoryItems.length} items`);

  const byName = (name: string) => inventoryItems.find(i => i.name === name)!;

  // ─── PRICE HISTORY ───────────────────────────────────────────────────────
  const priceHistoryData = [
    { itemId: byName("Beef Bavette").id, itemName: "Beef Bavette", supplierId: meats!.id, oldPrice: "20.00", newPrice: "21.50", recordedAt: daysAgo(60) },
    { itemId: byName("Beef Bavette").id, itemName: "Beef Bavette", supplierId: meats!.id, oldPrice: "21.50", newPrice: "22.50", recordedAt: daysAgo(7) },
    { itemId: byName("Sea Bass (Whole)").id, itemName: "Sea Bass (Whole)", supplierId: fish!.id, oldPrice: "17.00", newPrice: "18.50", recordedAt: daysAgo(60) },
    { itemId: byName("Sea Bass (Whole)").id, itemName: "Sea Bass (Whole)", supplierId: fish!.id, oldPrice: "18.50", newPrice: "19.50", recordedAt: daysAgo(7) },
    { itemId: byName("Hand-Dived Scallops").id, itemName: "Hand-Dived Scallops", supplierId: fish!.id, oldPrice: "2.40", newPrice: "2.60", recordedAt: daysAgo(60) },
    { itemId: byName("Hand-Dived Scallops").id, itemName: "Hand-Dived Scallops", supplierId: fish!.id, oldPrice: "2.60", newPrice: "2.80", recordedAt: daysAgo(7) },
    { itemId: byName("Aged Manchego (6mo)").id, itemName: "Aged Manchego (6mo)", supplierId: dairy!.id, oldPrice: "24.00", newPrice: "28.00", recordedAt: daysAgo(12) },
    { itemId: byName("Rocket (Wild)").id, itemName: "Rocket (Wild)", supplierId: produce!.id, oldPrice: "3.60", newPrice: "4.80", recordedAt: daysAgo(9) },
    { itemId: byName("Heritage Pork Belly").id, itemName: "Heritage Pork Belly", supplierId: meats!.id, oldPrice: "12.00", newPrice: "14.80", recordedAt: daysAgo(14) },
    { itemId: byName("Double Cream").id, itemName: "Double Cream", supplierId: dairy!.id, oldPrice: "3.20", newPrice: "3.80", recordedAt: daysAgo(7) },
  ];
  await Promise.all(priceHistoryData.map(p => db.insert(priceHistoryTable).values({
    inventoryItemId: p.itemId,
    itemName: p.itemName,
    supplierId: p.supplierId,
    oldPrice: p.oldPrice,
    newPrice: p.newPrice,
    recordedAt: p.recordedAt,
  })));
  console.log(`  Price history: ${priceHistoryData.length} entries`);

  // ─── RECIPES ─────────────────────────────────────────────────────────────
  const recipesData = [
    {
      name: "Seared Sea Bass, Beurre Blanc",
      category: "Mains",
      description: "Line-caught sea bass, cultured butter sauce, heritage tomato",
      method: "Score skin, season well. Sear skin-side 4 min until crisp. Flip, rest 2 min. Beurre blanc: reduce white wine and shallots, whisk in cold butter.",
      yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion",
      sellingPrice: "28.00",
    },
    {
      name: "Duck Leg Confit, Manchego Croqueta",
      category: "Mains",
      description: "48-hour confit duck, hand-rolled manchego croqueta",
      method: "Confit duck at 68°C for 12h in duck fat. Cool, crisp skin in hot pan. Croqueta: bechamel base with grated manchego, crumb and fry.",
      yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion",
      sellingPrice: "24.00",
    },
    {
      name: "Bavette, Shallot Butter",
      category: "Mains",
      description: "Dry-aged bavette, caramelised shallot butter, rocket",
      method: "Bring to room temp. Rub with oil, season aggressively. Grill on screaming hot bars 2 min each side. Rest 5 min. Finish with shallot butter.",
      yield: "2", yieldUnit: "portions", portionSize: "1", portionUnit: "portion",
      sellingPrice: "32.00",
    },
    {
      name: "Scallops, Courgette Velouté",
      category: "Starters",
      description: "Hand-dived scallops, baby courgette velouté, thyme oil",
      method: "Dry scallops thoroughly. Ripping-hot pan, no crowding. 90 sec per side. Velouté: sweat courgette in butter, blend with cream until silky.",
      yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion",
      sellingPrice: "16.00",
    },
    {
      name: "Slow Pork Belly, Apple & Thyme",
      category: "Mains",
      description: "Heritage pork belly braised 8 hours, crème fraîche mash, thyme jus",
      method: "Score fat, season overnight. Braise at 140°C for 8h. Press, chill overnight. Portion and crisp fat side in hot pan 4 min. Rest.",
      yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion",
      sellingPrice: "26.00",
    },
    {
      name: "Vanilla Panna Cotta, Berry Coulis",
      category: "Desserts",
      description: "Set vanilla cream, seasonal berry coulis",
      method: "Heat cream with vanilla pod. Dissolve gelatine. Set in moulds overnight. Turn out and serve with coulis.",
      yield: "6", yieldUnit: "portions", portionSize: "1", portionUnit: "portion",
      sellingPrice: "10.00",
    },
    {
      name: "Sourdough, Cultured Butter",
      category: "Sides",
      description: "House sourdough, whipped cultured butter",
      method: "Slice and warm in oven 3 min at 180°C. Whip cultured butter with sea salt.",
      yield: "2", yieldUnit: "portions", portionSize: "1", portionUnit: "portion",
      sellingPrice: "5.00",
    },
  ];

  const recipes = await Promise.all(
    recipesData.map(r => db.insert(recipesTable).values({ venueId, ...r }).returning().then(r2 => r2[0]!))
  );
  console.log(`  Recipes: ${recipes.map(r => r.name).join(", ")}`);

  const seaBass = recipes.find(r => r.name.includes("Sea Bass"))!;
  const duckLeg = recipes.find(r => r.name.includes("Duck Leg"))!;
  const bavette = recipes.find(r => r.name.includes("Bavette"))!;
  const scallops = recipes.find(r => r.name.includes("Scallop"))!;
  const porkBelly = recipes.find(r => r.name.includes("Pork Belly"))!;
  const pannaCotta = recipes.find(r => r.name.includes("Panna Cotta"))!;
  const sourdough = recipes.find(r => r.name.includes("Sourdough"))!;

  // ─── RECIPE INGREDIENTS ──────────────────────────────────────────────────
  const ingredientsData = [
    { recipeId: seaBass.id, inventoryItemId: byName("Sea Bass (Whole)").id, quantity: "0.8", unit: "kg" },
    { recipeId: seaBass.id, inventoryItemId: byName("Cultured Butter (Normandy)").id, quantity: "0.1", unit: "kg" },
    { recipeId: seaBass.id, inventoryItemId: byName("Shallots").id, quantity: "0.1", unit: "kg" },
    { recipeId: seaBass.id, inventoryItemId: byName("Heritage Tomatoes").id, quantity: "0.2", unit: "kg" },
    { recipeId: duckLeg.id, inventoryItemId: byName("Duck Leg (Confit-ready)").id, quantity: "0.6", unit: "kg" },
    { recipeId: duckLeg.id, inventoryItemId: byName("Aged Manchego (6mo)").id, quantity: "0.12", unit: "kg" },
    { recipeId: duckLeg.id, inventoryItemId: byName("Double Cream").id, quantity: "0.05", unit: "litre" },
    { recipeId: bavette.id, inventoryItemId: byName("Beef Bavette").id, quantity: "0.5", unit: "kg" },
    { recipeId: bavette.id, inventoryItemId: byName("Shallots").id, quantity: "0.08", unit: "kg" },
    { recipeId: bavette.id, inventoryItemId: byName("Cultured Butter (Normandy)").id, quantity: "0.06", unit: "kg" },
    { recipeId: bavette.id, inventoryItemId: byName("Rocket (Wild)").id, quantity: "0.04", unit: "kg" },
    { recipeId: scallops.id, inventoryItemId: byName("Hand-Dived Scallops").id, quantity: "12", unit: "piece" },
    { recipeId: scallops.id, inventoryItemId: byName("Baby Courgette").id, quantity: "0.3", unit: "kg" },
    { recipeId: scallops.id, inventoryItemId: byName("Double Cream").id, quantity: "0.1", unit: "litre" },
    { recipeId: scallops.id, inventoryItemId: byName("Fresh Thyme").id, quantity: "1", unit: "bunch" },
    { recipeId: scallops.id, inventoryItemId: byName("Cultured Butter (Normandy)").id, quantity: "0.04", unit: "kg" },
    { recipeId: porkBelly.id, inventoryItemId: byName("Heritage Pork Belly").id, quantity: "1.2", unit: "kg" },
    { recipeId: porkBelly.id, inventoryItemId: byName("Fresh Thyme").id, quantity: "2", unit: "bunch" },
    { recipeId: porkBelly.id, inventoryItemId: byName("Garlic (Whole)").id, quantity: "0.08", unit: "kg" },
    { recipeId: porkBelly.id, inventoryItemId: byName("Crème Fraîche").id, quantity: "0.15", unit: "kg" },
    { recipeId: pannaCotta.id, inventoryItemId: byName("Double Cream").id, quantity: "0.8", unit: "litre" },
    { recipeId: pannaCotta.id, inventoryItemId: byName("Vanilla Pods").id, quantity: "2", unit: "piece" },
    { recipeId: pannaCotta.id, inventoryItemId: byName("Caster Sugar").id, quantity: "0.12", unit: "kg" },
    { recipeId: sourdough.id, inventoryItemId: byName("Sourdough Loaf").id, quantity: "1", unit: "loaf" },
    { recipeId: sourdough.id, inventoryItemId: byName("Cultured Butter (Normandy)").id, quantity: "0.05", unit: "kg" },
  ];
  await Promise.all(ingredientsData.map(i => db.insert(recipeIngredientsTable).values(i)));
  console.log(`  Recipe ingredients: ${ingredientsData.length}`);

  // ─── PREP TASKS ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const prepTasksData = [
    { recipeId: seaBass.id, title: "Scale and portion sea bass", description: "4 x 200g portions, skin-on, pin-boned", shift: "am", priority: "high", status: "done", prepDate: today },
    { recipeId: seaBass.id, title: "Prep beurre blanc base", description: "Reduce white wine with shallots, chill. Finish to order.", shift: "am", priority: "medium", status: "in_progress", prepDate: today },
    { recipeId: seaBass.id, title: "Slice heritage tomatoes for garnish", description: "Thin slices, season, reserve cold", shift: "pm", priority: "low", status: "todo", prepDate: today },
    { recipeId: seaBass.id, title: "Check fish delivery quality", description: "Eyes clear, gills red, smell clean", shift: "am", priority: "high", status: "done", prepDate: yesterday },
    { recipeId: duckLeg.id, title: "Pull confited duck legs from fat", description: "Remove from fat, dry with paper, score skin", shift: "am", priority: "high", status: "done", prepDate: today },
    { recipeId: duckLeg.id, title: "Roll and breadcrumb manchego croquetas", description: "Chill bechamel first. Roll 30g balls. Double crumb.", shift: "am", priority: "high", status: "in_progress", prepDate: today },
    { recipeId: duckLeg.id, title: "Make manchego bechamel", description: "400g bechamel, 120g grated manchego. Chill flat.", shift: "all_day", priority: "high", status: "todo", prepDate: today },
    { recipeId: bavette.id, title: "Temper bavette steaks", description: "Remove from fridge 1h before service. Season.", shift: "pm", priority: "high", status: "todo", prepDate: today },
    { recipeId: bavette.id, title: "Prep shallot butter", description: "Caramelise shallots low and slow, whip into cold butter", shift: "am", priority: "medium", status: "done", prepDate: today },
    { recipeId: scallops.id, title: "Check scallop count and dry", description: "Pat dry and store uncovered in fridge on paper", shift: "am", priority: "high", status: "done", prepDate: today },
    { recipeId: scallops.id, title: "Make courgette velouté", description: "Sweat courgette in butter, add stock, blend, pass through fine sieve", shift: "am", priority: "high", status: "in_progress", prepDate: today },
    { recipeId: scallops.id, title: "Make thyme oil", description: "Blanch thyme 30s, blend with neutral oil, strain cold", shift: "am", priority: "medium", status: "todo", prepDate: today },
    { recipeId: porkBelly.id, title: "Portion pressed pork belly", description: "Remove from press, portion 180g, score fat", shift: "am", priority: "high", status: "done", prepDate: yesterday },
    { recipeId: porkBelly.id, title: "Reduce braising jus", description: "Skim fat, reduce by half, season", shift: "am", priority: "medium", status: "done", prepDate: yesterday },
    { recipeId: porkBelly.id, title: "Make crème fraîche mash", description: "Cook and rice potatoes, fold in crème fraîche and butter", shift: "pm", priority: "medium", status: "done", prepDate: yesterday },
    { recipeId: pannaCotta.id, title: "Set panna cottas in moulds", description: "Set the night before service — 8h minimum", shift: "all_day", priority: "high", status: "done", prepDate: yesterday },
    { recipeId: pannaCotta.id, title: "Make berry coulis", description: "Cook down berries with sugar and lemon. Strain. Chill.", shift: "am", priority: "medium", status: "done", prepDate: yesterday },
  ];

  await Promise.all(prepTasksData.map(t =>
    db.insert(prepTasksTable).values({
      venueId,
      recipeId: t.recipeId,
      title: t.title,
      description: t.description,
      category: "prep",
      section: "kitchen",
      shift: t.shift as "am" | "pm" | "all_day",
      priority: t.priority as "low" | "medium" | "high",
      status: t.status as "todo" | "in_progress" | "done",
      prepDate: t.prepDate,
      isArchived: false,
    })
  ));
  console.log(`  Prep tasks: ${prepTasksData.length}`);

  // ─── WASTE LOGS ──────────────────────────────────────────────────────────
  const wasteData = [
    { itemId: byName("Duck Leg (Confit-ready)").id, name: "Duck Leg (Confit-ready)", qty: "0.3", unit: "kg", costImpact: "5.40", reason: "spoilage", notes: "Missed the confit window — sat too long", loggedAt: daysAgo(0) },
    { itemId: byName("Double Cream").id, name: "Double Cream", qty: "0.2", unit: "litre", costImpact: "0.76", reason: "spoilage", notes: "Cream turned overnight", loggedAt: daysAgo(1) },
    { itemId: byName("Heritage Tomatoes").id, name: "Heritage Tomatoes", qty: "0.6", unit: "kg", costImpact: "1.92", reason: "overproduction", notes: "Over-ordered for Sunday special", loggedAt: daysAgo(2) },
    { itemId: byName("Fresh Thyme").id, name: "Fresh Thyme", qty: "2", unit: "bunch", costImpact: "1.80", reason: "spoilage", notes: "Wilted in fridge", loggedAt: daysAgo(3) },
    { itemId: byName("Rocket (Wild)").id, name: "Rocket (Wild)", qty: "0.4", unit: "kg", costImpact: "1.92", reason: "spoilage", notes: "Slow Tuesday cover count", loggedAt: daysAgo(4) },
    { itemId: byName("Hand-Dived Scallops").id, name: "Hand-Dived Scallops", qty: "3", unit: "piece", costImpact: "8.40", reason: "spoilage", notes: "Broke during prep", loggedAt: daysAgo(5) },
    { itemId: byName("Beef Bavette").id, name: "Beef Bavette", qty: "0.2", unit: "kg", costImpact: "4.50", reason: "overcooked", notes: "Service error — mis-fired", loggedAt: daysAgo(6) },
    { itemId: byName("Baby Courgette").id, name: "Baby Courgette", qty: "0.5", unit: "kg", costImpact: "2.80", reason: "spoilage", notes: "Poor quality delivery batch", loggedAt: daysAgo(7) },
    { itemId: byName("Heritage Pork Belly").id, name: "Heritage Pork Belly", qty: "0.3", unit: "kg", costImpact: "4.44", reason: "overproduction", notes: "Too many portions braised for Thursday covers", loggedAt: daysAgo(8) },
    { itemId: byName("Seasonal Leaves").id, name: "Seasonal Leaves", qty: "0.4", unit: "kg", costImpact: "2.60", reason: "spoilage", notes: "Missed before delivery day", loggedAt: daysAgo(9) },
  ];

  await Promise.all(wasteData.map(w => db.insert(wasteLogsTable).values({
    venueId,
    inventoryItemId: w.itemId,
    itemName: w.name,
    quantity: w.qty,
    unit: w.unit,
    costImpact: w.costImpact,
    reason: w.reason as "spoilage" | "overproduction" | "overcooked" | "contamination" | "other",
    notes: w.notes,
    loggedAt: w.loggedAt,
  })));
  console.log(`  Waste logs: ${wasteData.length}`);

  // ─── INVOICES ────────────────────────────────────────────────────────────
  const invoicesData = [
    {
      supplierId: produce!.id, supplierName: produce!.name, invoiceNumber: "BPC-2024-0441",
      totalAmount: "312.80", status: "processed",
      invoiceDate: daysAgo(5).toISOString().slice(0, 10),
      notes: "Weekly produce order",
      items: [
        { description: "Heritage Tomatoes 15kg", quantity: "15", unit: "kg", unitPrice: "3.20", totalPrice: "48.00" },
        { description: "Rocket Wild 5kg", quantity: "5", unit: "kg", unitPrice: "4.80", totalPrice: "24.00" },
        { description: "Baby Courgette 8kg", quantity: "8", unit: "kg", unitPrice: "5.60", totalPrice: "44.80" },
        { description: "Fresh Thyme 24 bunches", quantity: "24", unit: "bunch", unitPrice: "0.90", totalPrice: "21.60" },
        { description: "Shallots 20kg", quantity: "20", unit: "kg", unitPrice: "2.40", totalPrice: "48.00" },
        { description: "Seasonal Leaves 16kg", quantity: "16", unit: "kg", unitPrice: "6.50", totalPrice: "104.00" },
        { description: "Sourdough Loaves x12", quantity: "12", unit: "loaf", unitPrice: "3.80", totalPrice: "45.60" },
      ]
    },
    {
      supplierId: meats!.id, supplierName: meats!.name, invoiceNumber: "ATL-2024-0887",
      totalAmount: "498.60", status: "pending",
      invoiceDate: daysAgo(3).toISOString().slice(0, 10),
      notes: "This week's meat delivery — prices up on bavette",
      items: [
        { description: "Beef Bavette 8kg", quantity: "8", unit: "kg", unitPrice: "22.50", totalPrice: "180.00" },
        { description: "Heritage Pork Belly 5kg", quantity: "5", unit: "kg", unitPrice: "14.80", totalPrice: "74.00" },
        { description: "Duck Leg 6kg", quantity: "6", unit: "kg", unitPrice: "18.00", totalPrice: "108.00" },
        { description: "Chicken Thigh 6kg", quantity: "6", unit: "kg", unitPrice: "9.20", totalPrice: "55.20" },
        { description: "Delivery", quantity: "1", unit: "each", unitPrice: "15.00", totalPrice: "15.00" },
        { description: "Bone broth 3kg", quantity: "3", unit: "kg", unitPrice: "22.13", totalPrice: "66.40" },
      ]
    },
    {
      supplierId: fish!.id, supplierName: fish!.name, invoiceNumber: "SLN-2024-0192",
      totalAmount: "194.40", status: "flagged",
      invoiceDate: daysAgo(1).toISOString().slice(0, 10),
      notes: "FLAGGED: scallop pricing higher than last week — query with Pete",
      items: [
        { description: "Sea Bass Whole 6kg", quantity: "6", unit: "kg", unitPrice: "19.50", totalPrice: "117.00" },
        { description: "Hand-Dived Scallops 27pc", quantity: "27", unit: "piece", unitPrice: "2.80", totalPrice: "75.60" },
        { description: "Langoustine 1kg", quantity: "1", unit: "kg", unitPrice: "1.80", totalPrice: "1.80" },
      ]
    },
    {
      supplierId: dairy!.id, supplierName: dairy!.name, invoiceNumber: "CDY-2024-0099",
      totalAmount: "186.40", status: "processed",
      invoiceDate: daysAgo(4).toISOString().slice(0, 10),
      notes: "Weekly dairy order",
      items: [
        { description: "Cultured Butter 5kg", quantity: "5", unit: "kg", unitPrice: "12.60", totalPrice: "63.00" },
        { description: "Double Cream 6L", quantity: "6", unit: "litre", unitPrice: "3.80", totalPrice: "22.80" },
        { description: "Aged Manchego 2kg", quantity: "2", unit: "kg", unitPrice: "28.00", totalPrice: "56.00" },
        { description: "Crème Fraîche 4kg", quantity: "4", unit: "kg", unitPrice: "5.20", totalPrice: "20.80" },
        { description: "Delivery", quantity: "1", unit: "each", unitPrice: "8.50", totalPrice: "8.50" },
        { description: "Vanilla Pods x12", quantity: "12", unit: "piece", unitPrice: "1.20", totalPrice: "14.40" },
      ]
    },
  ];

  for (const inv of invoicesData) {
    const [invoice] = await db.insert(invoicesTable).values({
      venueId,
      supplierId: inv.supplierId,
      supplierName: inv.supplierName,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount,
      status: inv.status as "pending" | "processed" | "flagged",
      invoiceDate: inv.invoiceDate,
      notes: inv.notes,
    }).returning();
    await Promise.all(inv.items.map(item =>
      db.insert(invoiceItemsTable).values({
        invoiceId: invoice!.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })
    ));
  }
  console.log(`  Invoices: ${invoicesData.length}`);

  // ─── DINNER MENU ─────────────────────────────────────────────────────────
  const [dinnerMenu] = await db.insert(menusTable).values({
    venueId,
    name: "Dinner Menu",
    description: "Modern European à la carte — changes weekly with the market",
    isActive: true,
  }).returning();

  const menuItemsData = [
    { recipeId: scallops.id, category: "starter", sortOrder: 1, sellingPrice: "16.00" },
    { recipeId: seaBass.id, category: "main", sortOrder: 2, sellingPrice: "28.00" },
    { recipeId: bavette.id, category: "main", sortOrder: 3, sellingPrice: "32.00" },
    { recipeId: duckLeg.id, category: "main", sortOrder: 4, sellingPrice: "24.00" },
    { recipeId: porkBelly.id, category: "main", sortOrder: 5, sellingPrice: "26.00" },
    { recipeId: pannaCotta.id, category: "dessert", sortOrder: 6, sellingPrice: "10.00" },
    { recipeId: sourdough.id, category: "side", sortOrder: 7, sellingPrice: "5.00" },
  ];

  await Promise.all(menuItemsData.map(item =>
    db.insert(menuItemsTable).values({ menuId: dinnerMenu!.id, ...item })
  ));
  console.log(`  Dinner menu: ${menuItemsData.length} items`);

  console.log(`\nDone. The Black Apron seeded (venueId=${venueId})`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
