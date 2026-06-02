import { Router } from "express";
import { db } from "@workspace/db";
import {
  venuesTable,
  suppliersTable,
  inventoryItemsTable,
  priceHistoryTable,
  recipesTable,
  recipeIngredientsTable,
  wasteLogsTable,
  invoicesTable,
  invoiceItemsTable,
  prepTasksTable,
  prepTaskLibraryTable,
  venueStaffTable,
  cleaningTasksTable,
  cleaningLogsTable,
  stocktakesTable,
  stocktakeItemsTable,
  menusTable,
  menuItemsTable,
  temperatureEquipmentTable,
  temperatureLogsTable,
  chemicalsTable,
  complianceTasksTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function today(): string {
  return new Date().toISOString().split("T")[0] as string;
}

function dateString(d: Date): string {
  return d.toISOString().split("T")[0] as string;
}

router.post("/seed-demo", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;

    // ── Guard: one demo per user (topup if missing data) ─────────────────────
    const [existing] = await db.select({ id: venuesTable.id, name: venuesTable.name })
      .from(venuesTable)
      .where(and(eq(venuesTable.userId, userId), eq(venuesTable.name, "The Black Apron")))
      .limit(1);
    if (existing) {
      const existingVenueId = existing.id;
      let topupDone = false;

      // Topup: seed chemicals if none exist
      const existingChemicals = await db.select({ id: chemicalsTable.id })
        .from(chemicalsTable)
        .where(eq(chemicalsTable.venueId, existingVenueId))
        .limit(1);
      if (existingChemicals.length === 0) {
        const futureDate = (daysFromNow: number): string => {
          const d = new Date();
          d.setDate(d.getDate() + daysFromNow);
          return d.toISOString().split("T")[0] as string;
        };
        const chemicals = await Promise.all([
          db.insert(chemicalsTable).values({ venueId: existingVenueId, name: "Suma Break D4.4", type: "degreaser", dilutionRatio: "1:20 with cold water", contactTimeSeconds: 300, ppeRequired: "nitrile gloves,apron", sopInstructions: "1. Dilute 1 part Suma Break to 20 parts cold water in a trigger spray.\n2. Apply to greasy surfaces — oven doors, grill bars, fryer surrounds.\n3. Allow 5 minutes contact time.\n4. Scrub with a green scourer if required.\n5. Rinse thoroughly with clean water.\n6. Do not use on stainless steel without rinsing — may cause staining.", msdsUrl: "https://professionalproducts.unilever.com/msds/suma-break-d44.pdf", msdsExpiryDate: futureDate(540), msdsVersion: "3.1", complianceStatus: "current", notes: "Primary kitchen degreaser. Used on fryers, oven exteriors, and grill sections.", createdBy: "James Hartley" }).returning().then(r => r[0]!),
          db.insert(chemicalsTable).values({ venueId: existingVenueId, name: "Suma Bac D10", type: "sanitiser", dilutionRatio: "1:200 with water", contactTimeSeconds: 30, ppeRequired: "nitrile gloves", sopInstructions: "1. Dilute 1 part Suma Bac to 200 parts water (5ml per litre).\n2. Apply to clean surfaces only — sanitiser does not clean, clean first.\n3. Apply with trigger spray or clean cloth.\n4. Allow 30 seconds minimum contact time.\n5. Air dry — do not rinse food-contact surfaces.\n6. Use fresh solution each session.", msdsUrl: "https://professionalproducts.unilever.com/msds/suma-bac-d10.pdf", msdsExpiryDate: futureDate(365), msdsVersion: "4.0", complianceStatus: "current", notes: "Bactericidal sanitiser. Used on prep surfaces, chopping boards, and food-contact equipment between tasks.", createdBy: "James Hartley" }).returning().then(r => r[0]!),
          db.insert(chemicalsTable).values({ venueId: existingVenueId, name: "Suma Nova L6", type: "detergent", dilutionRatio: "1:40 with warm water", contactTimeSeconds: 180, ppeRequired: "nitrile gloves,non-slip footwear", sopInstructions: "1. Dilute 1 part Suma Nova to 40 parts warm water in a mop bucket.\n2. Apply to kitchen floor with mop — work back to front.\n3. Allow 3 minutes contact time before mopping off.\n4. Rinse with clean water mop.\n5. Ensure adequate ventilation.\n6. Place wet floor signs before mopping and leave until dry.", msdsUrl: "https://professionalproducts.unilever.com/msds/suma-nova-l6.pdf", msdsExpiryDate: futureDate(22), msdsVersion: "2.3", complianceStatus: "expiring_soon", notes: "Floor cleaner and degreaser. End-of-service floor clean. MSDS due for renewal — chase supplier.", createdBy: "Priya Nair" }).returning().then(r => r[0]!),
          db.insert(chemicalsTable).values({ venueId: existingVenueId, name: "Suma Chlor F1", type: "bleach", dilutionRatio: "1:80 with cold water", contactTimeSeconds: 120, ppeRequired: "nitrile gloves,safety goggles,apron", sopInstructions: "1. Dilute 1 part Suma Chlor to 80 parts cold water — ALWAYS add chemical to water, not water to chemical.\n2. Use in ventilated area only.\n3. Apply to hard non-porous surfaces.\n4. Allow 2 minutes contact time.\n5. Rinse thoroughly with clean water before food contact.\n6. Never mix with other chemicals — hazardous gases can form.\n7. Dispose of diluted solution after use — do not store.", msdsUrl: null, msdsExpiryDate: null, msdsVersion: null, complianceStatus: "missing", notes: "High-level sanitiser for dish rinse and high-risk surface disinfection. MSDS not yet uploaded — action required.", createdBy: "Priya Nair" }).returning().then(r => r[0]!),
          db.insert(chemicalsTable).values({ venueId: existingVenueId, name: "Tork Foam Soap (S34)", type: "other", dilutionRatio: null, contactTimeSeconds: null, ppeRequired: null, sopInstructions: "1. Dispense one pump of foam onto wet hands.\n2. Lather for minimum 20 seconds — including between fingers and under nails.\n3. Rinse thoroughly under running water.\n4. Dry with a single-use paper towel.\n5. Use paper towel to turn off tap.", msdsUrl: "https://tork.co.uk/msds/foam-soap-s34.pdf", msdsExpiryDate: futureDate(730), msdsVersion: "1.8", complianceStatus: "current", notes: "Staff hand soap — all handwash stations. Refill dispensers when half-empty.", createdBy: "Callum Drew" }).returning().then(r => r[0]!),
        ]);
        // Auto-create compliance tasks for chemicals needing action
        const sumaChlorChemical = chemicals.find(c => c.name === "Suma Chlor F1");
        if (sumaChlorChemical) {
          await db.insert(complianceTasksTable).values({ venueId: existingVenueId, chemicalId: sumaChlorChemical.id, type: "attach_msds", title: "Attach MSDS for Suma Chlor F1", description: "Suma Chlor F1 was added without a safety data sheet. A current MSDS is required for all bleach-based chemicals under COSHH regulations. Obtain the document from your supplier and upload it.", status: "pending" });
        }
        const sumaNova = chemicals.find(c => c.name === "Suma Nova L6");
        if (sumaNova) {
          await db.insert(complianceTasksTable).values({ venueId: existingVenueId, chemicalId: sumaNova.id, type: "renew_msds", title: "Renew MSDS for Suma Nova L6 — expires in 22 days", description: "The safety data sheet for Suma Nova L6 is expiring within 30 days. Contact Unilever Professional or your distributor to obtain an updated version before the current one lapses.", status: "pending" });
        }
        topupDone = true;
      }

      // Topup: seed prep task library if none exist
      const existingLibrary = await db.select({ id: prepTaskLibraryTable.id })
        .from(prepTaskLibraryTable)
        .where(eq(prepTaskLibraryTable.venueId, existingVenueId))
        .limit(1);
      if (existingLibrary.length === 0) {
        // Fetch existing recipes by name to link library tasks
        const existingRecipes = await db.select({ id: recipesTable.id, name: recipesTable.name })
          .from(recipesTable)
          .where(eq(recipesTable.venueId, existingVenueId));
        const recipeByName = (name: string) => existingRecipes.find(r => r.name === name);
        const gazpachoId = recipeByName("Chilled Cucumber Gazpacho, Mint Oil")?.id ?? null;
        const burrataId = recipeByName("Burrata, Heritage Tomato & Basil")?.id ?? null;
        const grilledCourgetteId = recipeByName("Grilled Courgette, Manchego & Rocket")?.id ?? null;
        const seaBassLemonId = recipeByName("Sea Bass, Lemon Caper Butter")?.id ?? null;
        const herbChickenId = recipeByName("Herb Chicken Thigh, Summer Roast Veg")?.id ?? null;
        await Promise.all([
          db.insert(prepTaskLibraryTable).values({ venueId: existingVenueId, recipeId: gazpachoId, title: "Batch cucumber gazpacho x 8 portions", description: "Blend, sieve, chill min 2h before service. Label with prep date.", category: "mise_en_place", section: "cold", shift: "am", priority: "high", quantity: "8", unit: "portions", estimatedMinutes: 25, status: "seasonal", notes: "Must be iced — check temp before service. Pull from fridge 5 min before plating.", createdBy: "James Hartley" }),
          db.insert(prepTaskLibraryTable).values({ venueId: existingVenueId, recipeId: gazpachoId, title: "Mint oil — pick, blanch, blend, pass", description: "Blanch mint 10 sec, ice bath, squeeze dry. Blend with grapeseed oil. Fine sieve. Store chilled.", category: "sauce", section: "cold", shift: "am", priority: "medium", quantity: "200", unit: "ml", estimatedMinutes: 20, status: "seasonal", notes: "Make fresh each day — oil turns overnight. Store in squeezy.", createdBy: "Priya Nair" }),
          db.insert(prepTaskLibraryTable).values({ venueId: existingVenueId, recipeId: burrataId, title: "Bring burrata to room temp — 20 min before service", description: "Remove from fridge, leave sealed until service. Tear per order.", category: "mise_en_place", section: "cold", shift: "pm", priority: "high", quantity: "12", unit: "piece", estimatedMinutes: 5, status: "seasonal", notes: "Cold burrata doesn't tear properly. Timing is everything on this one.", createdBy: "Sofia Russo" }),
          db.insert(prepTaskLibraryTable).values({ venueId: existingVenueId, recipeId: grilledCourgetteId, title: "Char courgettes on griddle — all lunch portions", description: "Split lengthways, brush oil, char 3 min each side. Finish with Maldon before service.", category: "hot_cook", section: "hot", shift: "am", priority: "medium", quantity: "16", unit: "halves", estimatedMinutes: 30, status: "seasonal", notes: "Real char marks only — pale courgette goes straight back on. Rest at room temp.", createdBy: "Tom Bellamy" }),
          db.insert(prepTaskLibraryTable).values({ venueId: existingVenueId, recipeId: seaBassLemonId, title: "Break down sea bass for lunch — 6 portions", description: "Fillet, pin-bone check, portion 175g skin-on. Refrigerate on J-cloth.", category: "portioning", section: "fish", shift: "am", priority: "high", quantity: "6", unit: "portions", estimatedMinutes: 20, status: "seasonal", notes: "Lunch sea bass is a separate order from dinner — confirm count with James before breaking down.", createdBy: "Sofia Russo" }),
          db.insert(prepTaskLibraryTable).values({ venueId: existingVenueId, recipeId: seaBassLemonId, title: "Lemon caper butter — pre-mount for service", description: "Brown cultured butter until nutty. Add capers and lemon juice. Cool slightly, portion into 30g ramekins.", category: "sauce", section: "fish", shift: "am", priority: "medium", quantity: "8", unit: "portions", estimatedMinutes: 15, status: "seasonal", notes: "Reheat gently at the pass — do not re-boil or it splits.", createdBy: "Sofia Russo" }),
          db.insert(prepTaskLibraryTable).values({ venueId: existingVenueId, recipeId: herbChickenId, title: "Marinate chicken thighs for lunch service", description: "Coat in olive oil, thyme, garlic, lemon zest. Cover and refrigerate min 4h.", category: "mise_en_place", section: "hot", shift: "am", priority: "high", quantity: "12", unit: "portions", estimatedMinutes: 15, status: "seasonal", notes: "Must go in fridge by 9am for lunch. James checks marination before sear.", createdBy: "Tom Bellamy" }),
          db.insert(prepTaskLibraryTable).values({ venueId: existingVenueId, recipeId: herbChickenId, title: "Roast summer veg — courgette, tomato, garlic", description: "Halve courgettes and tomatoes. Roast with whole garlic cloves at 200°C for 15 min. Season at the pass.", category: "hot_cook", section: "hot", shift: "am", priority: "medium", quantity: "8", unit: "portions", estimatedMinutes: 25, status: "seasonal", notes: "Roast in batches — don't crowd the tray or they steam instead of caramelise.", createdBy: "Callum Drew" }),
        ]);
        topupDone = true;
      }

      // Topup: ensure service windows + intelligence config are set
      const existingVenueData = await db.select({ serviceWindows: venuesTable.serviceWindows, serviceModeConfig: venuesTable.serviceModeConfig })
        .from(venuesTable)
        .where(eq(venuesTable.id, existingVenueId))
        .limit(1)
        .then(r => r[0]);
      if (
        existingVenueData &&
        (
          !existingVenueData.serviceWindows ||
          (existingVenueData.serviceWindows as unknown[]).length === 0 ||
          !(existingVenueData.serviceModeConfig as { v2Enabled?: boolean } | null)?.v2Enabled
        )
      ) {
        await db.update(venuesTable).set({
          serviceWindows: [
            { label: "Lunch",  startTime: "12:00", endTime: "14:30", enabled: true },
            { label: "Dinner", startTime: "17:30", endTime: "22:00", enabled: true },
          ],
          serviceModeConfig: { v2Enabled: true, v3Enabled: true },
          updatedAt: new Date(),
        }).where(eq(venuesTable.id, existingVenueId));
        topupDone = true;
      }

      res.status(200).json({ error: "Demo kitchen already exists", venueId: existing.id, topup: topupDone }); return;
    }

    // ── Venue ──────────────────────────────────────────────────────────────────
    const [venue] = await db.insert(venuesTable).values({
      name: "The Black Apron",
      userId,
      address: "42 Market Lane, Soho, London W1F 7QN",
      serviceWindows: [
        { label: "Lunch",  startTime: "12:00", endTime: "14:30", enabled: true  },
        { label: "Dinner", startTime: "17:30", endTime: "22:00", enabled: true  },
      ],
      serviceModeConfig: { v2Enabled: true, v3Enabled: true },
    }).returning();
    const venueId = venue!.id;

    // ── Suppliers ──────────────────────────────────────────────────────────────
    const suppliersData = [
      { name: "Borough Produce Co.", contactName: "Marcus Webb", email: "marcus@boroughproduce.co.uk", phone: "+44 20 7403 5500", website: "https://boroughproduce.co.uk", deliveryDays: "Monday,Wednesday,Friday", orderCutoffTime: "14:00", minimumOrderValue: "250.00", deliveryFee: "0.00", notes: "Heritage veg and salads. Fantastic seasonal range, always ask Marcus what's good this week. Min $250." },
      { name: "Atlas Meats", contactName: "Janet Forde", email: "orders@atlasmeats.com", phone: "+44 20 8964 3300", deliveryDays: "Tuesday,Thursday,Saturday", orderCutoffTime: "10:30", minimumOrderValue: "400.00", deliveryFee: "15.00", notes: "Dry-aged beef, heritage pork. Cutoff 10:30 — don't miss it. Prices up on bavette recently." },
      { name: "Sealane Fisheries", contactName: "Pete Alcott", email: "pete@sealane.fish", phone: "+44 20 7234 8801", deliveryDays: "Monday,Wednesday,Friday", orderCutoffTime: "08:00", minimumOrderValue: "150.00", deliveryFee: "0.00", notes: "Day-boat fish, order by 8am for same-day. Scallops can sell out — call Pete direct." },
      { name: "Continental Dairy", contactName: "Sofia Andreou", email: "sofia@condairy.eu", phone: "+44 20 7946 1234", deliveryDays: "Tuesday,Friday", orderCutoffTime: "12:00", minimumOrderValue: "100.00", deliveryFee: "8.50", notes: "French + Italian dairy, cultured butters, aged cheeses. Ask Sofia about new arrivals." },
    ];
    const suppliers = await Promise.all(
      suppliersData.map(s => db.insert(suppliersTable).values({ venueId, ...s }).returning().then(r => r[0]!))
    );
    const [produce, meats, fish, dairy] = suppliers as NonNullable<typeof suppliers[number]>[];

    // ── Inventory ──────────────────────────────────────────────────────────────
    const inventoryData = [
      { name: "Rocket (Wild)", unit: "kg", currentStock: "1.2", parLevel: "3.0", averageCost: "4.80", supplierId: produce.id, shelfLifeDays: 5, lastRestocked: daysAgo(9), storageLocation: "Coolroom" },
      { name: "Heritage Tomatoes", unit: "kg", currentStock: "4.5", parLevel: "5.0", averageCost: "3.20", supplierId: produce.id, shelfLifeDays: 7, lastRestocked: daysAgo(1), storageLocation: "Coolroom" },
      { name: "Baby Courgette", unit: "kg", currentStock: "0.8", parLevel: "2.0", averageCost: "5.60", supplierId: produce.id, shelfLifeDays: 5, lastRestocked: daysAgo(2), storageLocation: "Coolroom" },
      { name: "Shallots", unit: "kg", currentStock: "3.0", parLevel: "2.0", averageCost: "2.40", supplierId: produce.id, shelfLifeDays: 30, lastRestocked: daysAgo(3), storageLocation: "Dry Store" },
      { name: "Fresh Thyme", unit: "bunch", currentStock: "4", parLevel: "6", averageCost: "0.90", supplierId: produce.id, shelfLifeDays: 7, lastRestocked: daysAgo(1), storageLocation: "Coolroom" },
      { name: "Garlic (Whole)", unit: "kg", currentStock: "2.5", parLevel: "2.0", averageCost: "3.50", supplierId: produce.id, shelfLifeDays: 30, lastRestocked: daysAgo(4), storageLocation: "Dry Store" },
      { name: "Beef Bavette", unit: "kg", currentStock: "3.2", parLevel: "4.0", averageCost: "22.50", supplierId: meats.id, shelfLifeDays: 5, lastRestocked: daysAgo(2), storageLocation: "Coolroom" },
      { name: "Heritage Pork Belly", unit: "kg", currentStock: "2.0", parLevel: "3.0", averageCost: "14.80", supplierId: meats.id, shelfLifeDays: 4, lastRestocked: daysAgo(3), storageLocation: "Coolroom" },
      { name: "Duck Leg (Confit-ready)", unit: "kg", currentStock: "0.4", parLevel: "2.0", averageCost: "18.00", supplierId: meats.id, shelfLifeDays: 5, lastRestocked: daysAgo(11), storageLocation: "Coolroom" },
      { name: "Chicken Thigh (Boneless)", unit: "kg", currentStock: "1.5", parLevel: "2.5", averageCost: "9.20", supplierId: meats.id, shelfLifeDays: 3, lastRestocked: daysAgo(1), storageLocation: "Coolroom" },
      { name: "Sea Bass (Whole)", unit: "kg", currentStock: "2.8", parLevel: "3.0", averageCost: "19.50", supplierId: fish.id, shelfLifeDays: 2, lastRestocked: daysAgo(1), storageLocation: "Coolroom" },
      { name: "Hand-Dived Scallops", unit: "piece", currentStock: "24", parLevel: "30", averageCost: "2.80", supplierId: fish.id, shelfLifeDays: 2, lastRestocked: daysAgo(1), storageLocation: "Coolroom" },
      { name: "Aged Manchego (6mo)", unit: "kg", currentStock: "1.1", parLevel: "1.5", averageCost: "28.00", supplierId: dairy.id, shelfLifeDays: 60, lastRestocked: daysAgo(12), storageLocation: "Coolroom" },
      { name: "Cultured Butter (Normandy)", unit: "kg", currentStock: "2.0", parLevel: "1.5", averageCost: "12.60", supplierId: dairy.id, shelfLifeDays: 21, lastRestocked: daysAgo(5), storageLocation: "Coolroom" },
      { name: "Double Cream", unit: "litre", currentStock: "0.5", parLevel: "2.0", averageCost: "3.80", supplierId: dairy.id, shelfLifeDays: 10, lastRestocked: daysAgo(2), storageLocation: "Coolroom" },
      // Dry Store extras
      { name: "Panko Breadcrumbs", unit: "kg", currentStock: "1.5", parLevel: "2.0", averageCost: "2.80", supplierId: null, shelfLifeDays: 180, lastRestocked: daysAgo(14), storageLocation: "Dry Store" },
      { name: "Olive Oil (Extra Virgin)", unit: "litre", currentStock: "3.0", parLevel: "4.0", averageCost: "8.50", supplierId: null, shelfLifeDays: 365, lastRestocked: daysAgo(10), storageLocation: "Dry Store" },
      { name: "Maldon Sea Salt", unit: "kg", currentStock: "0.8", parLevel: "1.0", averageCost: "6.00", supplierId: null, shelfLifeDays: 730, lastRestocked: daysAgo(21), storageLocation: "Dry Store" },
      // Freezer items
      { name: "Lobster Bisque Base", unit: "litre", currentStock: "0", parLevel: "4.0", averageCost: "12.00", supplierId: null, shelfLifeDays: 90, lastRestocked: daysAgo(30), storageLocation: "Freezer" },
      { name: "Puff Pastry Sheets", unit: "sheet", currentStock: "6", parLevel: "12", averageCost: "1.20", supplierId: null, shelfLifeDays: 90, lastRestocked: daysAgo(8), storageLocation: "Freezer" },
      // Summer lunch additions
      { name: "Cucumber", unit: "each", currentStock: "8", parLevel: "12", averageCost: "0.60", supplierId: produce.id, shelfLifeDays: 7, lastRestocked: daysAgo(1), storageLocation: "Coolroom" },
      { name: "Fresh Mint", unit: "bunch", currentStock: "6", parLevel: "8", averageCost: "0.85", supplierId: produce.id, shelfLifeDays: 5, lastRestocked: daysAgo(1), storageLocation: "Coolroom" },
      { name: "Fresh Basil", unit: "bunch", currentStock: "4", parLevel: "6", averageCost: "0.95", supplierId: produce.id, shelfLifeDays: 4, lastRestocked: daysAgo(1), storageLocation: "Coolroom" },
      { name: "Burrata (125g)", unit: "piece", currentStock: "10", parLevel: "12", averageCost: "2.40", supplierId: dairy.id, shelfLifeDays: 5, lastRestocked: daysAgo(2), storageLocation: "Coolroom" },
      { name: "Lemon", unit: "each", currentStock: "16", parLevel: "20", averageCost: "0.25", supplierId: produce.id, shelfLifeDays: 14, lastRestocked: daysAgo(3), storageLocation: "Dry Store" },
      { name: "Capers (nonpareil)", unit: "kg", currentStock: "0.4", parLevel: "0.5", averageCost: "14.00", supplierId: null, shelfLifeDays: 365, lastRestocked: daysAgo(20), storageLocation: "Dry Store" },
      { name: "Courgette Flowers", unit: "piece", currentStock: "0", parLevel: "12", averageCost: "0.80", supplierId: produce.id, shelfLifeDays: 2, lastRestocked: daysAgo(14), storageLocation: "Coolroom" },
    ];
    const inventoryItems = await Promise.all(
      inventoryData.map(i => db.insert(inventoryItemsTable).values({ venueId, ...i }).returning().then(r => r[0]!))
    );
    const byName = (name: string) => inventoryItems.find(i => i.name === name)!;

    // ── Price history ──────────────────────────────────────────────────────────
    await Promise.all([
      db.insert(priceHistoryTable).values({ supplierId: meats.id, inventoryItemId: byName("Beef Bavette").id, itemName: "Beef Bavette", oldPrice: "18.00", newPrice: "20.00", changePercent: "11.11", recordedAt: daysAgo(60) }),
      db.insert(priceHistoryTable).values({ supplierId: meats.id, inventoryItemId: byName("Beef Bavette").id, itemName: "Beef Bavette", oldPrice: "20.00", newPrice: "22.50", changePercent: "12.50", recordedAt: daysAgo(14) }),
      db.insert(priceHistoryTable).values({ supplierId: fish.id, inventoryItemId: byName("Sea Bass (Whole)").id, itemName: "Sea Bass (Whole)", oldPrice: "15.00", newPrice: "17.00", changePercent: "13.33", recordedAt: daysAgo(45) }),
      db.insert(priceHistoryTable).values({ supplierId: fish.id, inventoryItemId: byName("Sea Bass (Whole)").id, itemName: "Sea Bass (Whole)", oldPrice: "17.00", newPrice: "19.50", changePercent: "14.71", recordedAt: daysAgo(7) }),
      db.insert(priceHistoryTable).values({ supplierId: fish.id, inventoryItemId: byName("Hand-Dived Scallops").id, itemName: "Hand-Dived Scallops", oldPrice: "2.20", newPrice: "2.40", changePercent: "9.09", recordedAt: daysAgo(30) }),
      db.insert(priceHistoryTable).values({ supplierId: fish.id, inventoryItemId: byName("Hand-Dived Scallops").id, itemName: "Hand-Dived Scallops", oldPrice: "2.40", newPrice: "2.80", changePercent: "16.67", recordedAt: daysAgo(7) }),
      db.insert(priceHistoryTable).values({ supplierId: dairy.id, inventoryItemId: byName("Aged Manchego (6mo)").id, itemName: "Aged Manchego (6mo)", oldPrice: "22.00", newPrice: "24.00", changePercent: "9.09", recordedAt: daysAgo(45) }),
      db.insert(priceHistoryTable).values({ supplierId: dairy.id, inventoryItemId: byName("Aged Manchego (6mo)").id, itemName: "Aged Manchego (6mo)", oldPrice: "24.00", newPrice: "28.00", changePercent: "16.67", recordedAt: daysAgo(12) }),
      db.insert(priceHistoryTable).values({ supplierId: produce.id, inventoryItemId: byName("Rocket (Wild)").id, itemName: "Rocket (Wild)", oldPrice: "3.80", newPrice: "5.20", changePercent: "36.84", recordedAt: daysAgo(21) }),
      db.insert(priceHistoryTable).values({ supplierId: produce.id, inventoryItemId: byName("Rocket (Wild)").id, itemName: "Rocket (Wild)", oldPrice: "5.20", newPrice: "4.80", changePercent: "-7.69", recordedAt: daysAgo(7) }),
      db.insert(priceHistoryTable).values({ supplierId: meats.id, inventoryItemId: byName("Duck Leg (Confit-ready)").id, itemName: "Duck Leg (Confit-ready)", oldPrice: "15.50", newPrice: "18.00", changePercent: "16.13", recordedAt: daysAgo(21) }),
      db.insert(priceHistoryTable).values({ supplierId: dairy.id, inventoryItemId: byName("Double Cream").id, itemName: "Double Cream", oldPrice: "3.40", newPrice: "3.80", changePercent: "11.76", recordedAt: daysAgo(10) }),
    ]);

    // ── Recipes ────────────────────────────────────────────────────────────────
    const recipesData = [
      { name: "Seared Sea Bass, Beurre Blanc", category: "Mains", description: "Line-caught sea bass, cultured butter sauce, heritage tomato", method: "Score skin, season well. Sear skin-side 4 min. Flip, rest 2 min. Beurre blanc: reduce wine and shallots, whisk in cold butter.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "28.00" },
      { name: "Duck Leg Confit, Manchego Croqueta", category: "Mains", description: "48-hour confit duck, hand-rolled manchego croqueta", method: "Confit duck at 68°C for 12h. Cool, crisp skin. Croqueta: bechamel with manchego, crumb and fry.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "24.00" },
      { name: "Bavette, Shallot Butter", category: "Mains", description: "Dry-aged bavette, caramelised shallot butter, rocket", method: "Room temp. Rub with oil, season aggressively. Grill 2 min each side. Rest 5 min. Finish with shallot butter.", yield: "2", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "32.00" },
      { name: "Scallops, Courgette Velouté", category: "Starters", description: "Hand-dived scallops, baby courgette velouté, thyme oil", method: "Dry scallops. Ripping-hot pan, 90 sec per side. Velouté: sweat courgette in butter, blend with cream.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "16.00" },
      { name: "Chicken Supreme, Garlic Jus", category: "Mains", description: "Free-range chicken thigh, roasted garlic, thyme", method: "Sear thigh skin-side until golden. Roast at 180°C for 18 min. Rest 5 min. Deglaze with stock, add roasted garlic and thyme.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "22.00" },
      { name: "Heritage Tomato Salad", category: "Starters", description: "Mixed heritage tomatoes, shallot vinaigrette, wild rocket", method: "Slice tomatoes thickly. Season heavily. Dress with aged sherry vinegar and good olive oil. Shave shallots fine.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "12.00" },
    ];
    const recipes = await Promise.all(
      recipesData.map(r => db.insert(recipesTable).values({ venueId, ...r }).returning().then(r2 => r2[0]!))
    );
    const [seaBass, duck, bavette, scallops, chicken, tomatoSalad] = recipes as NonNullable<typeof recipes[number]>[];

    await Promise.all([
      db.insert(recipeIngredientsTable).values({ recipeId: seaBass.id, inventoryItemId: byName("Sea Bass (Whole)").id, quantity: "0.8", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: seaBass.id, inventoryItemId: byName("Cultured Butter (Normandy)").id, quantity: "0.1", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: seaBass.id, inventoryItemId: byName("Shallots").id, quantity: "0.1", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: duck.id, inventoryItemId: byName("Duck Leg (Confit-ready)").id, quantity: "0.6", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: duck.id, inventoryItemId: byName("Aged Manchego (6mo)").id, quantity: "0.12", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: bavette.id, inventoryItemId: byName("Beef Bavette").id, quantity: "0.5", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: bavette.id, inventoryItemId: byName("Shallots").id, quantity: "0.08", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: bavette.id, inventoryItemId: byName("Rocket (Wild)").id, quantity: "0.04", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: scallops.id, inventoryItemId: byName("Hand-Dived Scallops").id, quantity: "12", unit: "piece" }),
      db.insert(recipeIngredientsTable).values({ recipeId: scallops.id, inventoryItemId: byName("Baby Courgette").id, quantity: "0.3", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: scallops.id, inventoryItemId: byName("Double Cream").id, quantity: "0.1", unit: "litre" }),
      db.insert(recipeIngredientsTable).values({ recipeId: scallops.id, inventoryItemId: byName("Fresh Thyme").id, quantity: "1", unit: "bunch" }),
      db.insert(recipeIngredientsTable).values({ recipeId: chicken.id, inventoryItemId: byName("Chicken Thigh (Boneless)").id, quantity: "0.35", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: chicken.id, inventoryItemId: byName("Garlic (Whole)").id, quantity: "0.04", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: chicken.id, inventoryItemId: byName("Fresh Thyme").id, quantity: "1", unit: "bunch" }),
      db.insert(recipeIngredientsTable).values({ recipeId: chicken.id, inventoryItemId: byName("Cultured Butter (Normandy)").id, quantity: "0.04", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: tomatoSalad.id, inventoryItemId: byName("Heritage Tomatoes").id, quantity: "0.3", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: tomatoSalad.id, inventoryItemId: byName("Shallots").id, quantity: "0.04", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: tomatoSalad.id, inventoryItemId: byName("Rocket (Wild)").id, quantity: "0.03", unit: "kg" }),
    ]);

    // ── Summer lunch recipes ────────────────────────────────────────────────────
    const summerRecipesData = [
      { name: "Chilled Cucumber Gazpacho, Mint Oil", category: "Starters", status: "active", description: "Iced cucumber and herb soup, mint oil, crème fraîche", method: "Blend peeled cucumber with shallots, garlic, a splash of white wine vinegar, and seasoning. Pass through fine sieve. Chill for min 2h. Mint oil: blanch mint 10 sec, shock in ice water, blend with grapeseed oil, pass. Serve in cold bowl with a swirl of crème fraîche and mint oil.", yield: "6", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "10.50" },
      { name: "Burrata, Heritage Tomato & Basil", category: "Starters", status: "active", description: "Hand-torn burrata, heritage tomatoes, fresh basil, olive oil", method: "Bring burrata to room temp 20 min before service. Slice tomatoes thickly, season with Maldon and leave 5 min to draw juices. Arrange tomatoes, tear burrata over the top. Dress with good olive oil. Finish with fresh basil leaves and a crack of black pepper.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "13.50" },
      { name: "Grilled Courgette, Manchego & Rocket", category: "Starters", status: "active", description: "Charred baby courgette, shaved manchego, wild rocket, lemon", method: "Split baby courgettes lengthways. Brush with olive oil, season. Char on hot griddle pan 3 min each side — you want real colour. Rest 2 min. Shave manchego over while warm so it softens slightly. Dress rocket with lemon juice and olive oil. Finish with Maldon.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "11.00" },
      { name: "Sea Bass, Lemon Caper Butter", category: "Mains", status: "active", description: "Seared sea bass fillet, brown butter, lemon, capers", method: "Score skin, dry thoroughly. Season skin side only. Sear skin-down in a smoking dry pan for 3.5 min — do not move it. Flip, 45 sec. Lemon caper butter: brown cultured butter until nutty, add capers, lemon juice, pull off heat. Spoon over fish at the pass.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "23.00" },
      { name: "Herb Chicken Thigh, Summer Roast Veg", category: "Mains", status: "active", description: "Herb-marinated chicken thigh, roasted courgette, tomato, garlic", method: "Marinate thighs in olive oil, thyme, garlic, lemon zest for min 4h. Sear skin-side in ovenproof pan until golden. Flip, add courgette and halved tomatoes to pan. Roast 180°C for 18 min. Rest 5 min. Deglaze pan with stock and lemon juice for a light jus.", yield: "4", yieldUnit: "portions", portionSize: "1", portionUnit: "portion", sellingPrice: "21.00" },
    ];
    const summerRecipes = await Promise.all(
      summerRecipesData.map(r => db.insert(recipesTable).values({ venueId, ...r }).returning().then(r2 => r2[0]!))
    );
    const [gazpacho, burrata, grilledCourgette, seaBassLemon, herbChicken] = summerRecipes as NonNullable<typeof summerRecipes[number]>[];

    await Promise.all([
      // Gazpacho
      db.insert(recipeIngredientsTable).values({ recipeId: gazpacho.id, inventoryItemId: byName("Cucumber").id, quantity: "3", unit: "each" }),
      db.insert(recipeIngredientsTable).values({ recipeId: gazpacho.id, inventoryItemId: byName("Shallots").id, quantity: "0.06", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: gazpacho.id, inventoryItemId: byName("Fresh Mint").id, quantity: "2", unit: "bunch" }),
      db.insert(recipeIngredientsTable).values({ recipeId: gazpacho.id, inventoryItemId: byName("Double Cream").id, quantity: "0.08", unit: "litre" }),
      // Burrata
      db.insert(recipeIngredientsTable).values({ recipeId: burrata.id, inventoryItemId: byName("Burrata (125g)").id, quantity: "4", unit: "piece" }),
      db.insert(recipeIngredientsTable).values({ recipeId: burrata.id, inventoryItemId: byName("Heritage Tomatoes").id, quantity: "0.5", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: burrata.id, inventoryItemId: byName("Fresh Basil").id, quantity: "1", unit: "bunch" }),
      db.insert(recipeIngredientsTable).values({ recipeId: burrata.id, inventoryItemId: byName("Olive Oil (Extra Virgin)").id, quantity: "0.04", unit: "litre" }),
      // Grilled Courgette
      db.insert(recipeIngredientsTable).values({ recipeId: grilledCourgette.id, inventoryItemId: byName("Baby Courgette").id, quantity: "0.6", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: grilledCourgette.id, inventoryItemId: byName("Aged Manchego (6mo)").id, quantity: "0.08", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: grilledCourgette.id, inventoryItemId: byName("Rocket (Wild)").id, quantity: "0.04", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: grilledCourgette.id, inventoryItemId: byName("Lemon").id, quantity: "2", unit: "each" }),
      // Sea Bass Lemon Caper
      db.insert(recipeIngredientsTable).values({ recipeId: seaBassLemon.id, inventoryItemId: byName("Sea Bass (Whole)").id, quantity: "0.7", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: seaBassLemon.id, inventoryItemId: byName("Cultured Butter (Normandy)").id, quantity: "0.08", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: seaBassLemon.id, inventoryItemId: byName("Capers (nonpareil)").id, quantity: "0.02", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: seaBassLemon.id, inventoryItemId: byName("Lemon").id, quantity: "2", unit: "each" }),
      // Herb Chicken
      db.insert(recipeIngredientsTable).values({ recipeId: herbChicken.id, inventoryItemId: byName("Chicken Thigh (Boneless)").id, quantity: "0.35", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: herbChicken.id, inventoryItemId: byName("Fresh Thyme").id, quantity: "1", unit: "bunch" }),
      db.insert(recipeIngredientsTable).values({ recipeId: herbChicken.id, inventoryItemId: byName("Garlic (Whole)").id, quantity: "0.03", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: herbChicken.id, inventoryItemId: byName("Baby Courgette").id, quantity: "0.3", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: herbChicken.id, inventoryItemId: byName("Heritage Tomatoes").id, quantity: "0.2", unit: "kg" }),
      db.insert(recipeIngredientsTable).values({ recipeId: herbChicken.id, inventoryItemId: byName("Lemon").id, quantity: "1", unit: "each" }),
    ]);

    // ── Waste logs — 30 days for analytics ────────────────────────────────────
    type WasteReason = "spoilage" | "overproduction" | "overcooked" | "contamination" | "other";
    const wasteData: Array<{ itemId: number; name: string; qty: string; unit: string; cost: string; reason: WasteReason; notes: string; daysBack: number }> = [
      { itemId: byName("Duck Leg (Confit-ready)").id, name: "Duck Leg (Confit-ready)", qty: "0.3", unit: "kg", cost: "5.40", reason: "spoilage", notes: "Missed the confit window", daysBack: 0 },
      { itemId: byName("Double Cream").id, name: "Double Cream", qty: "0.2", unit: "litre", cost: "0.76", reason: "spoilage", notes: "Cream turned overnight", daysBack: 1 },
      { itemId: byName("Heritage Tomatoes").id, name: "Heritage Tomatoes", qty: "0.6", unit: "kg", cost: "1.92", reason: "overproduction", notes: "Over-ordered for Sunday special", daysBack: 2 },
      { itemId: byName("Fresh Thyme").id, name: "Fresh Thyme", qty: "2", unit: "bunch", cost: "1.80", reason: "spoilage", notes: "Wilted in fridge", daysBack: 3 },
      { itemId: byName("Rocket (Wild)").id, name: "Rocket (Wild)", qty: "0.4", unit: "kg", cost: "1.92", reason: "spoilage", notes: "Slow Tuesday — didn't shift", daysBack: 4 },
      { itemId: byName("Hand-Dived Scallops").id, name: "Hand-Dived Scallops", qty: "3", unit: "piece", cost: "8.40", reason: "spoilage", notes: "Broke during prep", daysBack: 5 },
      { itemId: byName("Beef Bavette").id, name: "Beef Bavette", qty: "0.2", unit: "kg", cost: "4.50", reason: "overcooked", notes: "Mis-fire — service error", daysBack: 6 },
      { itemId: byName("Baby Courgette").id, name: "Baby Courgette", qty: "0.5", unit: "kg", cost: "2.80", reason: "spoilage", notes: "Didn't sell at lunch", daysBack: 8 },
      { itemId: byName("Chicken Thigh (Boneless)").id, name: "Chicken Thigh (Boneless)", qty: "0.4", unit: "kg", cost: "3.68", reason: "spoilage", notes: "Missed use-by", daysBack: 9 },
      { itemId: byName("Heritage Pork Belly").id, name: "Heritage Pork Belly", qty: "0.3", unit: "kg", cost: "4.44", reason: "overcooked", notes: "Crackling burnt on pass", daysBack: 11 },
      { itemId: byName("Double Cream").id, name: "Double Cream", qty: "0.3", unit: "litre", cost: "1.14", reason: "spoilage", notes: "Left off fridge overnight", daysBack: 12 },
      { itemId: byName("Rocket (Wild)").id, name: "Rocket (Wild)", qty: "0.3", unit: "kg", cost: "1.44", reason: "spoilage", notes: "Dropped on floor", daysBack: 14 },
      { itemId: byName("Sea Bass (Whole)").id, name: "Sea Bass (Whole)", qty: "0.5", unit: "kg", cost: "9.75", reason: "spoilage", notes: "Delivery day clash — aged out", daysBack: 15 },
      { itemId: byName("Fresh Thyme").id, name: "Fresh Thyme", qty: "1", unit: "bunch", cost: "0.90", reason: "spoilage", notes: "Forgotten at back of fridge", daysBack: 16 },
      { itemId: byName("Beef Bavette").id, name: "Beef Bavette", qty: "0.3", unit: "kg", cost: "6.75", reason: "overcooked", notes: "Cooked medium when table wanted rare", daysBack: 18 },
      { itemId: byName("Aged Manchego (6mo)").id, name: "Aged Manchego (6mo)", qty: "0.1", unit: "kg", cost: "2.80", reason: "contamination", notes: "Cross-contamination from garlic board", daysBack: 20 },
      { itemId: byName("Duck Leg (Confit-ready)").id, name: "Duck Leg (Confit-ready)", qty: "0.4", unit: "kg", cost: "7.20", reason: "spoilage", notes: "Ordered too many for the weekend", daysBack: 21 },
      { itemId: byName("Heritage Tomatoes").id, name: "Heritage Tomatoes", qty: "1.0", unit: "kg", cost: "3.20", reason: "spoilage", notes: "Slow week, specials didn't shift", daysBack: 23 },
      { itemId: byName("Baby Courgette").id, name: "Baby Courgette", qty: "0.4", unit: "kg", cost: "2.24", reason: "overproduction", notes: "Too much velouté prepped for banquet", daysBack: 25 },
      { itemId: byName("Hand-Dived Scallops").id, name: "Hand-Dived Scallops", qty: "2", unit: "piece", cost: "5.60", reason: "spoilage", notes: "Arrived in poor condition", daysBack: 27 },
      { itemId: byName("Chicken Thigh (Boneless)").id, name: "Chicken Thigh (Boneless)", qty: "0.6", unit: "kg", cost: "5.52", reason: "spoilage", notes: "Bank holiday — kitchen ran light", daysBack: 29 },
    ];
    await Promise.all(wasteData.map(w => db.insert(wasteLogsTable).values({
      venueId, inventoryItemId: w.itemId, itemName: w.name,
      quantity: w.qty, unit: w.unit, costImpact: w.cost,
      reason: w.reason, notes: w.notes, loggedAt: daysAgo(w.daysBack),
    })));

    // ── Invoices ───────────────────────────────────────────────────────────────
    const [invoice1] = await db.insert(invoicesTable).values({
      venueId, supplierId: produce.id, supplierName: produce.name,
      invoiceNumber: "BPC-2024-0441", totalAmount: "312.80", status: "processed",
      invoiceDate: dateString(daysAgo(5)), notes: "Weekly produce order",
    }).returning();
    await Promise.all([
      db.insert(invoiceItemsTable).values({ invoiceId: invoice1!.id, inventoryItemId: byName("Heritage Tomatoes").id, description: "Heritage Tomatoes 15kg", quantity: "15", unit: "kg", unitPrice: "3.20", totalPrice: "48.00" }),
      db.insert(invoiceItemsTable).values({ invoiceId: invoice1!.id, inventoryItemId: byName("Rocket (Wild)").id, description: "Rocket Wild 5kg", quantity: "5", unit: "kg", unitPrice: "4.80", totalPrice: "24.00" }),
      db.insert(invoiceItemsTable).values({ invoiceId: invoice1!.id, inventoryItemId: byName("Baby Courgette").id, description: "Baby Courgette 4kg", quantity: "4", unit: "kg", unitPrice: "5.60", totalPrice: "22.40" }),
      db.insert(invoiceItemsTable).values({ invoiceId: invoice1!.id, inventoryItemId: byName("Fresh Thyme").id, description: "Fresh Thyme 8 bunches", quantity: "8", unit: "bunch", unitPrice: "0.90", totalPrice: "7.20" }),
    ]);

    const [invoice2] = await db.insert(invoicesTable).values({
      venueId, supplierId: meats.id, supplierName: meats.name,
      invoiceNumber: "ATL-20240-0887", totalAmount: "498.60", status: "pending",
      invoiceDate: dateString(daysAgo(3)), notes: "This week's meat — prices up on bavette again",
    }).returning();
    await Promise.all([
      db.insert(invoiceItemsTable).values({ invoiceId: invoice2!.id, inventoryItemId: byName("Beef Bavette").id, description: "Beef Bavette 8kg", quantity: "8", unit: "kg", unitPrice: "22.50", totalPrice: "180.00" }),
      db.insert(invoiceItemsTable).values({ invoiceId: invoice2!.id, inventoryItemId: byName("Duck Leg (Confit-ready)").id, description: "Duck Leg 6kg", quantity: "6", unit: "kg", unitPrice: "18.00", totalPrice: "108.00" }),
      db.insert(invoiceItemsTable).values({ invoiceId: invoice2!.id, inventoryItemId: byName("Heritage Pork Belly").id, description: "Pork Belly 4kg", quantity: "4", unit: "kg", unitPrice: "14.80", totalPrice: "59.20" }),
    ]);

    const [invoice3] = await db.insert(invoicesTable).values({
      venueId, supplierId: fish.id, supplierName: fish.name,
      invoiceNumber: "SLN-2024-0192", totalAmount: "194.40", status: "flagged",
      invoiceDate: dateString(daysAgo(1)), notes: "FLAGGED: scallop pricing higher than last week — check against agreed rate",
    }).returning();
    await Promise.all([
      db.insert(invoiceItemsTable).values({ invoiceId: invoice3!.id, inventoryItemId: byName("Sea Bass (Whole)").id, description: "Sea Bass Whole 6kg", quantity: "6", unit: "kg", unitPrice: "19.50", totalPrice: "117.00" }),
      db.insert(invoiceItemsTable).values({ invoiceId: invoice3!.id, inventoryItemId: byName("Hand-Dived Scallops").id, description: "Hand-Dived Scallops 27 pieces", quantity: "27", unit: "piece", unitPrice: "2.80", totalPrice: "75.60" }),
    ]);

    const [invoice4] = await db.insert(invoicesTable).values({
      venueId, supplierId: dairy.id, supplierName: dairy.name,
      invoiceNumber: "CDB-2024-0341", totalAmount: "156.70", status: "processed",
      invoiceDate: dateString(daysAgo(10)), notes: "Fortnightly dairy order",
    }).returning();
    await Promise.all([
      db.insert(invoiceItemsTable).values({ invoiceId: invoice4!.id, inventoryItemId: byName("Aged Manchego (6mo)").id, description: "Aged Manchego 6mo 2kg", quantity: "2", unit: "kg", unitPrice: "28.00", totalPrice: "56.00" }),
      db.insert(invoiceItemsTable).values({ invoiceId: invoice4!.id, inventoryItemId: byName("Cultured Butter (Normandy)").id, description: "Normandy Cultured Butter 3kg", quantity: "3", unit: "kg", unitPrice: "12.60", totalPrice: "37.80" }),
      db.insert(invoiceItemsTable).values({ invoiceId: invoice4!.id, inventoryItemId: byName("Double Cream").id, description: "Double Cream 4 litres", quantity: "4", unit: "litre", unitPrice: "3.80", totalPrice: "15.20" }),
    ]);

    // ── Venue staff (for prep board assignments) ───────────────────────────────
    const staffData = [
      { name: "James Hartley", role: "Head Chef" },
      { name: "Priya Nair", role: "Sous Chef" },
      { name: "Tom Bellamy", role: "CDP — Hot Section" },
      { name: "Sofia Russo", role: "CDP — Fish" },
      { name: "Callum Drew", role: "Commis Chef" },
      { name: "Riya Kapoor", role: "Pastry Chef" },
    ];
    const staff = await Promise.all(
      staffData.map(s => db.insert(venueStaffTable).values({ venueId, ...s }).returning().then(r => r[0]!))
    );
    const [james, priya, tom, sofia, callum, riya] = staff as NonNullable<typeof staff[number]>[];

    // ── Prep board — today's tasks ─────────────────────────────────────────────
    const prepDate = today();
    await Promise.all([
      // AM shift — done / in progress
      db.insert(prepTasksTable).values({ venueId, recipeId: bavette.id, title: "Butcher beef bavette — portion 200g", category: "portioning", section: "meat", shift: "am", assignedTo: tom.name, priority: "high", status: "done", prepDate, notes: "4 portions per order. Trim fat cap to 5mm." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: seaBass.id, title: "Break down sea bass — 4 per side", category: "portioning", section: "fish", shift: "am", assignedTo: sofia.name, priority: "high", status: "done", prepDate, notes: "Pin-bone check on every fillet. Skin on." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: seaBass.id, title: "Make beurre blanc base", category: "sauce", section: "fish", shift: "am", assignedTo: sofia.name, priority: "high", status: "in_progress", prepDate, notes: "Reduce 2 bottles white wine with shallots. Stop before mounting butter." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: scallops.id, title: "Prep scallop mise en place — 6 portions", category: "mise_en_place", section: "fish", shift: "am", assignedTo: sofia.name, priority: "high", status: "in_progress", prepDate, notes: "Pat dry, pull coral, refrigerate on J-cloth. Do NOT season until service." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: chicken.id, title: "Roast garlic bulbs x 10 for jus", category: "mise_en_place", section: "hot", shift: "am", assignedTo: tom.name, priority: "medium", status: "done", prepDate, notes: "180°C, 45 min wrapped in foil with thyme and oil." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: bavette.id, title: "Caramelise shallot butter x 16 portions", category: "mise_en_place", section: "hot", shift: "am", assignedTo: callum.name, priority: "medium", status: "done", prepDate, notes: "Low and slow — don't rush it. Should be deep golden, not brown." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: duck.id, title: "Roll and crumb manchego croquetas x 20", category: "mise_en_place", section: "larder", shift: "am", assignedTo: priya.name, priority: "high", status: "in_progress", prepDate, notes: "Set bechamel needs 2h in fridge before rolling. Panko only." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: scallops.id, title: "Courgette velouté — blend and pass", category: "sauce", section: "cold", shift: "am", assignedTo: callum.name, priority: "medium", status: "todo", prepDate, notes: "Sweat in butter until tender. High-speed blend, fine sieve. Adjust cream and seasoning." }),
      // PM shift — todo
      db.insert(prepTasksTable).values({ venueId, recipeId: duck.id, title: "Confit duck legs — check core temp", category: "mise_en_place", section: "hot", shift: "pm", assignedTo: tom.name, priority: "high", status: "todo", prepDate, notes: "Should hit 75°C core. Crisp skin to order in hot pan." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: tomatoSalad.id, title: "Slice heritage tomatoes — service ready", category: "mise_en_place", section: "cold", shift: "pm", assignedTo: callum.name, priority: "low", status: "todo", prepDate, notes: "Thick slices, season 10 min before service, room temp only." }),
      db.insert(prepTasksTable).values({ venueId, recipeId: chicken.id, title: "Portion chicken thighs — 350g each", category: "portioning", section: "hot", shift: "pm", assignedTo: tom.name, priority: "medium", status: "todo", prepDate, notes: "Trim sinew. Score skin lightly for even rendering." }),
      db.insert(prepTasksTable).values({ venueId, title: "Set pastry station — pre-service check", category: "mise_en_place", section: "pastry", shift: "pm", assignedTo: riya.name, priority: "medium", status: "todo", prepDate, notes: "Check dessert count with front of house by 5pm." }),
      db.insert(prepTasksTable).values({ venueId, title: "Replenish pass — sauces and garnish", category: "mise_en_place", section: "pass", shift: "pm", assignedTo: priya.name, priority: "high", status: "todo", prepDate, notes: "Beurre blanc, garlic jus, thyme oil, finishing salt. All hot before 6pm." }),
      // Deferred from yesterday
      db.insert(prepTasksTable).values({ venueId, title: "Deep clean stockpot section", category: "cleaning", section: "hot", shift: "am", assignedTo: callum.name, priority: "low", status: "todo", prepDate, deferredFrom: dateString(daysAgo(1)), notes: "Deferred from yesterday — must happen before lunch service." }),
    ]);

    // ── Cleaning roster ────────────────────────────────────────────────────────
    const cleaningData = [
      { title: "Walk-in fridge — daily check and wipe", area: "cold_storage", frequency: "daily", assignedTo: callum.name, notes: "Check temps, wipe shelves, clear any drips. Log temp on clipboard.", lastCompletedAt: daysAgo(0) },
      { title: "Fryer oil check and filter", area: "kitchen", frequency: "daily", assignedTo: tom.name, notes: "Check colour and smell. Filter if cloudy. Full change if off.", lastCompletedAt: daysAgo(0) },
      { title: "Pass and hot section wipe-down", area: "pass", frequency: "per_service", assignedTo: callum.name, notes: "Between lunch and dinner service. Steel cleaner on surfaces.", lastCompletedAt: daysAgo(0) },
      { title: "Dish pit and sink deep scrub", area: "dish_pit", frequency: "daily", assignedTo: callum.name, notes: "End of service. Hot water and degreaser. Check drain for blockages.", lastCompletedAt: daysAgo(1) },
      { title: "Ventilation hoods — degrease filters", area: "kitchen", frequency: "weekly", assignedTo: tom.name, notes: "Remove filters, soak in degreaser 30 min. Rinse and refit. Log date.", lastCompletedAt: daysAgo(4) },
      { title: "Walk-in fridge deep clean", area: "cold_storage", frequency: "weekly", assignedTo: priya.name, notes: "Full clear-out, scrub walls and floor, sanitise. Re-label everything.", lastCompletedAt: daysAgo(6) },
      { title: "Floors — mop kitchen and prep area", area: "kitchen", frequency: "daily", assignedTo: callum.name, notes: "End of service. Anti-slip degreaser. Wet floor signs mandatory.", lastCompletedAt: daysAgo(0) },
      { title: "Prep surfaces — sanitise between tasks", area: "kitchen", frequency: "per_service", assignedTo: callum.name, notes: "Between raw protein and veg prep. Blue boards for fish, red for raw meat.", lastCompletedAt: daysAgo(0) },
      { title: "Dry goods store — organise and date check", area: "kitchen", frequency: "weekly", assignedTo: priya.name, notes: "FIFO rotation. Remove anything past date. Restock from delivery.", lastCompletedAt: daysAgo(5) },
      { title: "Ventilation system full service", area: "kitchen", frequency: "monthly", assignedTo: james.name, notes: "Contractor visit required. Book at least 1 week ahead.", lastCompletedAt: daysAgo(18) },
      { title: "Grease trap clean", area: "kitchen", frequency: "monthly", assignedTo: james.name, notes: "Environmental health requirement. Log completion with date.", lastCompletedAt: daysAgo(22) },
      { title: "Pest control check", area: "kitchen", frequency: "monthly", assignedTo: james.name, notes: "Check traps, log findings, contact contractor if activity noted.", lastCompletedAt: daysAgo(12) },
    ];
    const cleaningTasks = await Promise.all(
      cleaningData.map(c => db.insert(cleaningTasksTable).values({ venueId, ...c }).returning().then(r => r[0]!))
    );

    // Add completion logs for recent tasks
    const recentlyCompleted = cleaningTasks.filter(t => t.lastCompletedAt && (new Date().getTime() - new Date(t.lastCompletedAt).getTime()) < 3 * 24 * 60 * 60 * 1000);
    await Promise.all(
      recentlyCompleted.map(task =>
        db.insert(cleaningLogsTable).values({
          taskId: task.id,
          venueId,
          completedBy: task.assignedTo ?? james.name,
          notes: "Completed as scheduled.",
          completedAt: task.lastCompletedAt!,
        })
      )
    );

    // ── Stocktakes ─────────────────────────────────────────────────────────────
    // Submitted stocktake from last week
    const [lastWeekStocktake] = await db.insert(stocktakesTable).values({
      venueId,
      conductedAt: daysAgo(7),
      status: "submitted",
      notes: "Weekly stocktake — end of Saturday service. Significant variance on rocket and cream.",
    }).returning();

    const lastWeekItems = [
      { inv: byName("Rocket (Wild)"), expected: "3.0", actual: "1.2", unitCost: "4.80" },
      { inv: byName("Heritage Tomatoes"), expected: "5.5", actual: "4.8", unitCost: "3.20" },
      { inv: byName("Baby Courgette"), expected: "2.0", actual: "1.4", unitCost: "5.60" },
      { inv: byName("Shallots"), expected: "2.0", actual: "2.1", unitCost: "2.40" },
      { inv: byName("Fresh Thyme"), expected: "6", actual: "4", unitCost: "0.90" },
      { inv: byName("Beef Bavette"), expected: "4.0", actual: "3.8", unitCost: "22.50" },
      { inv: byName("Duck Leg (Confit-ready)"), expected: "2.5", actual: "0.8", unitCost: "18.00" },
      { inv: byName("Sea Bass (Whole)"), expected: "3.0", actual: "3.0", unitCost: "19.50" },
      { inv: byName("Hand-Dived Scallops"), expected: "30", actual: "27", unitCost: "2.80" },
      { inv: byName("Double Cream"), expected: "2.0", actual: "0.8", unitCost: "3.80" },
      { inv: byName("Aged Manchego (6mo)"), expected: "1.5", actual: "1.4", unitCost: "28.00" },
      { inv: byName("Cultured Butter (Normandy)"), expected: "1.5", actual: "2.0", unitCost: "12.60" },
    ];
    await Promise.all(lastWeekItems.map(({ inv, expected, actual, unitCost }) => {
      const variance = (parseFloat(actual) - parseFloat(expected)).toFixed(3);
      return db.insert(stocktakeItemsTable).values({
        stocktakeId: lastWeekStocktake!.id,
        inventoryItemId: inv.id,
        itemName: inv.name,
        unit: inv.unit,
        expectedStock: expected,
        actualStock: actual,
        variance,
        unitCost,
      });
    }));

    // Draft stocktake started today
    const [todayStocktake] = await db.insert(stocktakesTable).values({
      venueId,
      conductedAt: new Date(),
      status: "draft",
      notes: "End of week count — in progress.",
    }).returning();

    const todayItems = [
      { inv: byName("Rocket (Wild)"), expected: "3.0", actual: "1.2", unitCost: "4.80" },
      { inv: byName("Heritage Tomatoes"), expected: "5.0", actual: "4.5", unitCost: "3.20" },
      { inv: byName("Beef Bavette"), expected: "4.0", actual: "3.2", unitCost: "22.50" },
      { inv: byName("Sea Bass (Whole)"), expected: "3.0", actual: "2.8", unitCost: "19.50" },
      { inv: byName("Hand-Dived Scallops"), expected: "30", actual: "24", unitCost: "2.80" },
      { inv: byName("Double Cream"), expected: "2.0", actual: "0.5", unitCost: "3.80" },
    ];
    await Promise.all(todayItems.map(({ inv, expected, actual, unitCost }) => {
      const variance = (parseFloat(actual) - parseFloat(expected)).toFixed(3);
      return db.insert(stocktakeItemsTable).values({
        stocktakeId: todayStocktake!.id,
        inventoryItemId: inv.id,
        itemName: inv.name,
        unit: inv.unit,
        expectedStock: expected,
        actualStock: actual,
        variance,
        unitCost,
      });
    }));

    // ── Temperature equipment & logs ───────────────────────────────────────────
    const equipmentData = [
      { name: "Fridge — Salad Prep", type: "fridge", minTemp: "1.0", maxTemp: "5.0", checkIntervalHours: 4 },
      { name: "Fridge — Chicken & Meat", type: "fridge", minTemp: "1.0", maxTemp: "4.0", checkIntervalHours: 4 },
      { name: "Freezer — Ice Cream & Pastry", type: "freezer", minTemp: "-22.0", maxTemp: "-18.0", checkIntervalHours: 8 },
      { name: "Hot Hold — Soup & Sauces", type: "hot_hold", minTemp: "63.0", maxTemp: "75.0", checkIntervalHours: 2 },
      { name: "Walk-in Coolroom", type: "fridge", minTemp: "1.0", maxTemp: "5.0", checkIntervalHours: 8 },
    ];
    const equipment = await Promise.all(
      equipmentData.map(e => db.insert(temperatureEquipmentTable).values({ venueId, ...e }).returning().then(r => r[0]!))
    );
    const [fridgeSalad, fridgeMeat, freezer, hotHold, walkin] = equipment as NonNullable<typeof equipment[number]>[];

    function hoursAgo(h: number): Date {
      const d = new Date();
      d.setHours(d.getHours() - h);
      return d;
    }

    await Promise.all([
      // Today — compliant morning checks
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: fridgeSalad.id, logType: "equipment_check", recordedTemp: "2.4", status: "pass", checkedBy: "Callum Drew", checkedAt: hoursAgo(3), notes: "All good. Lettuce looking fresh." }),
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: fridgeMeat.id, logType: "equipment_check", recordedTemp: "1.8", status: "pass", checkedBy: "Tom Bellamy", checkedAt: hoursAgo(3), notes: "Chicken thighs portioned and covered." }),
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: freezer.id, logType: "equipment_check", recordedTemp: "-19.2", status: "pass", checkedBy: "Riya Kapoor", checkedAt: hoursAgo(2.5), notes: "Ice cream at service temp." }),
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: hotHold.id, logType: "equipment_check", recordedTemp: "63.5", status: "pass", checkedBy: "Tom Bellaby", checkedAt: hoursAgo(1), notes: "Soup holding well. Stir before service." }),
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: walkin.id, logType: "equipment_check", recordedTemp: "3.1", status: "pass", checkedBy: "Priya Nair", checkedAt: hoursAgo(4), notes: "Walk-in tidy. Delivery stacked correctly." }),
      // Yesterday — one fail on meat fridge, recheck passed
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: fridgeMeat.id, logType: "equipment_check", recordedTemp: "7.2", status: "fail", checkedBy: "Callum Drew", checkedAt: hoursAgo(28), notes: "Door left ajar overnight. Escalated to sous chef.", correctiveAction: "Door sealed, temp rechecked after 20 min.", recheckTemp: "3.4", isResolved: true }),
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: fridgeSalad.id, logType: "equipment_check", recordedTemp: "2.8", status: "pass", checkedBy: "Callum Drew", checkedAt: hoursAgo(26) }),
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: hotHold.id, logType: "equipment_check", recordedTemp: "65.0", status: "pass", checkedBy: "Tom Bellamy", checkedAt: hoursAgo(24) }),
      // Two days ago — all clean
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: walkin.id, logType: "equipment_check", recordedTemp: "2.9", status: "pass", checkedBy: "Priya Nair", checkedAt: hoursAgo(52) }),
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: freezer.id, logType: "equipment_check", recordedTemp: "-20.1", status: "pass", checkedBy: "Riya Kapoor", checkedAt: hoursAgo(50) }),
      db.insert(temperatureLogsTable).values({ venueId, equipmentId: fridgeSalad.id, logType: "equipment_check", recordedTemp: "3.2", status: "pass", checkedBy: "Callum Drew", checkedAt: hoursAgo(50) }),
      // Delivery probe logs
      db.insert(temperatureLogsTable).values({ venueId, logType: "delivery_probe", itemName: "Chicken Thigh (Boneless) — Atlas Meats delivery", recordedTemp: "2.1", status: "pass", checkedBy: "Tom Bellamy", checkedAt: hoursAgo(24), notes: "Delivery arrived chilled, well within range." }),
      db.insert(temperatureLogsTable).values({ venueId, logType: "delivery_probe", itemName: "Sea Bass (Whole) — Sealane Fisheries delivery", recordedTemp: "1.4", status: "pass", checkedBy: "Sofia Russo", checkedAt: hoursAgo(27), notes: "Fish arrived on ice. Excellent condition." }),
      db.insert(temperatureLogsTable).values({ venueId, logType: "delivery_probe", itemName: "Double Cream — Continental Dairy delivery", recordedTemp: "4.8", status: "pass", checkedBy: "Callum Drew", checkedAt: hoursAgo(48), notes: "Just inside limit. Noted to supplier." }),
    ]);

    // ── Menus ───────────────────────────────────────────────────────────────────
    // We need menusTable and menuItemsTable — import them at the top of the file
    const recipesByName = new Map(recipes.map(r => [r.name, r]));

    // Special recipe: Pork Tenderloin — uses in-stock items
    const [specialRecipe] = await db.insert(recipesTable).values({
      venueId,
      name: "Pork Tenderloin, Caramelised Shallot, Thyme Jus",
      category: "Special",
      description: "Today's special — tender pork fillet with a rich shallot and thyme jus",
      method: "Sear the tenderloin in cultured butter until golden on all sides. Rest 5 minutes. Caramelise the shallots in the same pan with fresh thyme. Deglaze with white wine, reduce, and finish with a knob of cold butter.",
      yield: "4",
      yieldUnit: "portions",
      portionSize: "1",
      portionUnit: "portion",
      sellingPrice: "32.00",
      platingNotes: "Slice tenderloin on the bias, 3 slices per plate. Pool the jus beneath. Garnish with a thyme sprig.",
    }).returning();

    if (specialRecipe) {
      // Add ingredients using available stock
      const shallots = inventoryItems.find(i => i.name === "Shallots");
      const thyme = inventoryItems.find(i => i.name === "Fresh Thyme");
      const butter = inventoryItems.find(i => i.name === "Cultured Butter (Normandy)");
      const ingrPairs: Array<{ item: typeof shallots; qty: string; unit: string }> = [
        { item: shallots, qty: "0.300", unit: "kg" },
        { item: thyme, qty: "8", unit: "sprigs" },
        { item: butter, qty: "0.060", unit: "kg" },
      ];
      for (const { item, qty, unit } of ingrPairs) {
        if (item) {
          await db.insert(recipeIngredientsTable).values({
            recipeId: specialRecipe.id,
            inventoryItemId: item.id,
            quantity: qty,
            unit,
            yieldFactor: "1",
          });
        }
      }
    }

    // Current dinner menu
    const [dinnerMenu] = await db.insert(menusTable).values({
      venueId,
      name: "Evening A La Carte",
      description: "Current dinner menu — updated seasonally",
      isActive: true,
    }).returning();

    if (dinnerMenu) {
      const menuItemDefs: Array<{ recipeName: string; sellingPrice: string; category: string; sortOrder: number }> = [
        // Starters — names must match recipesData exactly
        { recipeName: "Heritage Tomato Salad", sellingPrice: "12.00", category: "starter", sortOrder: 1 },
        { recipeName: "Scallops, Courgette Velouté", sellingPrice: "19.00", category: "starter", sortOrder: 2 },
        // Mains
        { recipeName: "Seared Sea Bass, Beurre Blanc", sellingPrice: "32.00", category: "main", sortOrder: 10 },
        { recipeName: "Duck Leg Confit, Manchego Croqueta", sellingPrice: "28.00", category: "main", sortOrder: 11 },
        { recipeName: "Bavette, Shallot Butter", sellingPrice: "34.00", category: "main", sortOrder: 12 },
        { recipeName: "Chicken Supreme, Garlic Jus", sellingPrice: "26.00", category: "main", sortOrder: 13 },
      ];

      for (const def of menuItemDefs) {
        const recipe = recipesByName.get(def.recipeName);
        if (recipe) {
          await db.insert(menuItemsTable).values({
            menuId: dinnerMenu.id,
            recipeId: recipe.id,
            sellingPrice: def.sellingPrice,
            category: def.category,
            sortOrder: def.sortOrder,
          });
        }
      }

      // Add the today's special
      if (specialRecipe) {
        await db.insert(menuItemsTable).values({
          menuId: dinnerMenu.id,
          recipeId: specialRecipe.id,
          sellingPrice: "32.00",
          category: "special",
          sortOrder: 99,
        });
      }
    }

    // ── Summer lunch menu ───────────────────────────────────────────────────────
    const summerRecipesByName = new Map(summerRecipes.map(r => [r.name, r]));
    const [lunchMenu] = await db.insert(menusTable).values({
      venueId,
      name: "Summer Lunch",
      description: "Seasonal lunch menu — light dishes using the best of summer produce",
      isActive: true,
    }).returning();

    if (lunchMenu) {
      const lunchItemDefs: Array<{ recipeName: string; sellingPrice: string; category: string; sortOrder: number; fromSummer?: boolean }> = [
        { recipeName: "Chilled Cucumber Gazpacho, Mint Oil", sellingPrice: "10.50", category: "starter", sortOrder: 1, fromSummer: true },
        { recipeName: "Burrata, Heritage Tomato & Basil", sellingPrice: "13.50", category: "starter", sortOrder: 2, fromSummer: true },
        { recipeName: "Grilled Courgette, Manchego & Rocket", sellingPrice: "11.00", category: "starter", sortOrder: 3, fromSummer: true },
        { recipeName: "Heritage Tomato Salad", sellingPrice: "10.00", category: "starter", sortOrder: 4 },
        { recipeName: "Sea Bass, Lemon Caper Butter", sellingPrice: "23.00", category: "main", sortOrder: 10, fromSummer: true },
        { recipeName: "Herb Chicken Thigh, Summer Roast Veg", sellingPrice: "21.00", category: "main", sortOrder: 11, fromSummer: true },
        { recipeName: "Bavette, Shallot Butter", sellingPrice: "28.00", category: "main", sortOrder: 12 },
      ];
      for (const def of lunchItemDefs) {
        const recipe = def.fromSummer
          ? summerRecipesByName.get(def.recipeName)
          : recipesByName.get(def.recipeName);
        if (recipe) {
          await db.insert(menuItemsTable).values({
            menuId: lunchMenu.id,
            recipeId: recipe.id,
            sellingPrice: def.sellingPrice,
            category: def.category,
            sortOrder: def.sortOrder,
          });
        }
      }
    }

    // ── Prep task library — summer lunch sections ───────────────────────────────
    await Promise.all([
      // Cold section — gazpacho
      db.insert(prepTaskLibraryTable).values({ venueId, recipeId: gazpacho.id, title: "Batch cucumber gazpacho x 8 portions", description: "Blend, sieve, chill min 2h before service. Label with prep date.", category: "mise_en_place", section: "cold", shift: "am", priority: "high", quantity: "8", unit: "portions", estimatedMinutes: 25, status: "seasonal", notes: "Must be iced — check temp before service. Pull from fridge 5 min before plating.", createdBy: james.name }),
      db.insert(prepTaskLibraryTable).values({ venueId, recipeId: gazpacho.id, title: "Mint oil — pick, blanch, blend, pass", description: "Blanch mint 10 sec, ice bath, squeeze dry. Blend with grapeseed oil. Fine sieve. Store chilled.", category: "sauce", section: "cold", shift: "am", priority: "medium", quantity: "200", unit: "ml", estimatedMinutes: 20, status: "seasonal", notes: "Make fresh each day — oil turns overnight. Store in squeezy.", createdBy: priya.name }),
      // Cold section — burrata
      db.insert(prepTaskLibraryTable).values({ venueId, recipeId: burrata.id, title: "Bring burrata to room temp — 20 min before service", description: "Remove from fridge, leave sealed until service. Tear per order.", category: "mise_en_place", section: "cold", shift: "pm", priority: "high", quantity: "12", unit: "piece", estimatedMinutes: 5, status: "seasonal", notes: "Cold burrata doesn't tear properly. Timing is everything on this one.", createdBy: sofia.name }),
      // Hot section — grilled courgette
      db.insert(prepTaskLibraryTable).values({ venueId, recipeId: grilledCourgette.id, title: "Char courgettes on griddle — all lunch portions", description: "Split lengthways, brush oil, char 3 min each side. Finish with Maldon before service.", category: "hot_cook", section: "hot", shift: "am", priority: "medium", quantity: "16", unit: "halves", estimatedMinutes: 30, status: "seasonal", notes: "Real char marks only — pale courgette goes straight back on. Rest at room temp.", createdBy: tom.name }),
      // Fish section — sea bass lemon caper
      db.insert(prepTaskLibraryTable).values({ venueId, recipeId: seaBassLemon.id, title: "Break down sea bass for lunch — 6 portions", description: "Fillet, pin-bone check, portion 175g skin-on. Refrigerate on J-cloth.", category: "portioning", section: "fish", shift: "am", priority: "high", quantity: "6", unit: "portions", estimatedMinutes: 20, status: "seasonal", notes: "Lunch sea bass is a separate order from dinner — confirm count with James before breaking down.", createdBy: sofia.name }),
      db.insert(prepTaskLibraryTable).values({ venueId, recipeId: seaBassLemon.id, title: "Lemon caper butter — pre-mount for service", description: "Brown cultured butter until nutty. Add capers and lemon juice. Cool slightly, portion into 30g ramekins.", category: "sauce", section: "fish", shift: "am", priority: "medium", quantity: "8", unit: "portions", estimatedMinutes: 15, status: "seasonal", notes: "Reheat gently at the pass — do not re-boil or it splits.", createdBy: sofia.name }),
      // Hot section — herb chicken
      db.insert(prepTaskLibraryTable).values({ venueId, recipeId: herbChicken.id, title: "Marinate chicken thighs for lunch service", description: "Coat in olive oil, thyme, garlic, lemon zest. Cover and refrigerate min 4h.", category: "mise_en_place", section: "hot", shift: "am", priority: "high", quantity: "12", unit: "portions", estimatedMinutes: 15, status: "seasonal", notes: "Must go in fridge by 9am for lunch. James checks marination before sear.", createdBy: tom.name }),
      db.insert(prepTaskLibraryTable).values({ venueId, recipeId: herbChicken.id, title: "Roast summer veg — courgette, tomato, garlic", description: "Halve courgettes and tomatoes. Roast with whole garlic cloves at 200°C for 15 min. Season at the pass.", category: "hot_cook", section: "hot", shift: "am", priority: "medium", quantity: "8", unit: "portions", estimatedMinutes: 25, status: "seasonal", notes: "Roast in batches — don't crowd the tray or they steam instead of caramelise.", createdBy: callum.name }),
    ]);

    // ── Chemical safety register ────────────────────────────────────────────────
    const futureDate = (daysFromNow: number): string => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      return d.toISOString().split("T")[0] as string;
    };

    const chemicalsData = [
      {
        name: "Suma Break D4.4",
        type: "degreaser",
        dilutionRatio: "1:20 with cold water",
        contactTimeSeconds: 300,
        ppeRequired: "nitrile gloves,apron",
        sopInstructions: "1. Dilute 1 part Suma Break to 20 parts cold water in a trigger spray.\n2. Apply to greasy surfaces — oven doors, grill bars, fryer surrounds.\n3. Allow 5 minutes contact time.\n4. Scrub with a green scourer if required.\n5. Rinse thoroughly with clean water.\n6. Do not use on stainless steel without rinsing — may cause staining.",
        msdsUrl: "https://professionalproducts.unilever.com/msds/suma-break-d44.pdf",
        msdsExpiryDate: futureDate(540),
        msdsVersion: "3.1",
        complianceStatus: "current",
        notes: "Primary kitchen degreaser. Used on fryers, oven exteriors, and grill sections.",
        createdBy: james.name,
      },
      {
        name: "Suma Bac D10",
        type: "sanitiser",
        dilutionRatio: "1:200 with water",
        contactTimeSeconds: 30,
        ppeRequired: "nitrile gloves",
        sopInstructions: "1. Dilute 1 part Suma Bac to 200 parts water (5ml per litre).\n2. Apply to clean surfaces only — sanitiser does not clean, clean first.\n3. Apply with trigger spray or clean cloth.\n4. Allow 30 seconds minimum contact time.\n5. Air dry — do not rinse food-contact surfaces.\n6. Use fresh solution each session.",
        msdsUrl: "https://professionalproducts.unilever.com/msds/suma-bac-d10.pdf",
        msdsExpiryDate: futureDate(365),
        msdsVersion: "4.0",
        complianceStatus: "current",
        notes: "Bactericidal sanitiser. Used on prep surfaces, chopping boards, and food-contact equipment between tasks.",
        createdBy: james.name,
      },
      {
        name: "Suma Nova L6",
        type: "detergent",
        dilutionRatio: "1:40 with warm water",
        contactTimeSeconds: 180,
        ppeRequired: "nitrile gloves,non-slip footwear",
        sopInstructions: "1. Dilute 1 part Suma Nova to 40 parts warm water in a mop bucket.\n2. Apply to kitchen floor with mop — work back to front.\n3. Allow 3 minutes contact time before mopping off.\n4. Rinse with clean water mop.\n5. Ensure adequate ventilation.\n6. Place wet floor signs before mopping and leave until dry.",
        msdsUrl: "https://professionalproducts.unilever.com/msds/suma-nova-l6.pdf",
        msdsExpiryDate: futureDate(22),
        msdsVersion: "2.3",
        complianceStatus: "expiring_soon",
        notes: "Floor cleaner and degreaser. End-of-service floor clean. MSDS due for renewal — chase supplier.",
        createdBy: priya.name,
      },
      {
        name: "Suma Chlor F1",
        type: "bleach",
        dilutionRatio: "1:80 with cold water",
        contactTimeSeconds: 120,
        ppeRequired: "nitrile gloves,safety goggles,apron",
        sopInstructions: "1. Dilute 1 part Suma Chlor to 80 parts cold water — ALWAYS add chemical to water, not water to chemical.\n2. Use in ventilated area only.\n3. Apply to hard non-porous surfaces.\n4. Allow 2 minutes contact time.\n5. Rinse thoroughly with clean water before food contact.\n6. Never mix with other chemicals — hazardous gases can form.\n7. Dispose of diluted solution after use — do not store.",
        msdsUrl: null,
        msdsExpiryDate: null,
        msdsVersion: null,
        complianceStatus: "missing",
        notes: "High-level sanitiser for dish rinse and high-risk surface disinfection. MSDS not yet uploaded — action required.",
        createdBy: priya.name,
      },
      {
        name: "Tork Foam Soap (S34)",
        type: "other",
        dilutionRatio: null,
        contactTimeSeconds: null,
        ppeRequired: null,
        sopInstructions: "1. Dispense one pump of foam onto wet hands.\n2. Lather for minimum 20 seconds — including between fingers and under nails.\n3. Rinse thoroughly under running water.\n4. Dry with a single-use paper towel.\n5. Use paper towel to turn off tap.",
        msdsUrl: "https://tork.co.uk/msds/foam-soap-s34.pdf",
        msdsExpiryDate: futureDate(730),
        msdsVersion: "1.8",
        complianceStatus: "current",
        notes: "Staff hand soap — all handwash stations. Refill dispensers when half-empty.",
        createdBy: callum.name,
      },
    ];

    const insertedChemicals = await Promise.all(
      chemicalsData.map(c => db.insert(chemicalsTable).values({ venueId, ...c }).returning().then(r => r[0]!))
    );

    // Auto-create compliance task for Suma Chlor (missing MSDS)
    const sumaChlorChemical = insertedChemicals.find(c => c.name === "Suma Chlor F1");
    if (sumaChlorChemical) {
      await db.insert(complianceTasksTable).values({
        venueId,
        chemicalId: sumaChlorChemical.id,
        type: "attach_msds",
        title: "Attach MSDS for Suma Chlor F1",
        description: "Suma Chlor F1 was added without a safety data sheet. A current MSDS is required for all bleach-based chemicals under COSHH regulations. Obtain the document from your supplier and upload it.",
        status: "pending",
      });
    }

    // Compliance task for Suma Nova expiring soon
    const sumaNova = insertedChemicals.find(c => c.name === "Suma Nova L6");
    if (sumaNova) {
      await db.insert(complianceTasksTable).values({
        venueId,
        chemicalId: sumaNova.id,
        type: "renew_msds",
        title: "Renew MSDS for Suma Nova L6 — expires in 22 days",
        description: "The safety data sheet for Suma Nova L6 is expiring within 30 days. Contact Unilever Professional or your distributor to obtain an updated version before the current one lapses.",
        status: "pending",
      });
    }

    req.log.info({ venueId, userId }, "Demo venue seeded");
    res.status(201).json({ venueId, venueName: venue!.name });
  } catch (err) {
    req.log.error({ err }, "Failed to seed demo");
    res.status(500).json({ error: "Internal server error" }); return;
  }
});

// Clear demo venue by ID (ownership verified)
router.delete("/demo-venue/:venueId", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const venueId = parseInt(req.params["venueId"] as string);
    const [venue] = await db.select().from(venuesTable)
      .where(and(eq(venuesTable.id, venueId), eq(venuesTable.userId, userId)));
    if (!venue || venue.name !== "The Black Apron") {
      res.status(404).json({ error: "Demo venue not found" }); return;
    }
    await db.delete(venuesTable).where(eq(venuesTable.id, venueId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete demo venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
