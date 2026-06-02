import { Router } from "express";
import { db } from "@workspace/db";
import {
  venuesTable, suppliersTable, chemicalsTable, prepTaskLibraryTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// ── Archetype scaffolding ──────────────────────────────────────────────────────
// Philosophy: scaffold the STRUCTURE of a kitchen — categories, areas, SOPs,
// prep workflows — without fabricating operational data (stock counts, par
// levels, costs, business names). Suppliers are created as honest category
// placeholders the chef edits to match their real vendors.

type SupplierPlaceholder = { category: string; suggestedRole: string };
type ChemicalSOP = {
  name: string; type: string; dilutionRatio?: string; contactTime?: number;
  ppe?: string[]; storageInstructions?: string;
};
type PrepTaskTemplate = {
  title: string; category: string; section: string; shift: string;
  estimatedDurationMinutes?: number; priority?: string;
};

type ArchetypeData = {
  venueType: string;
  kitchenAreas: string[];
  supplierCategories: SupplierPlaceholder[];
  chemicals: ChemicalSOP[];
  prepTasks: PrepTaskTemplate[];
};

const ARCHETYPES: Record<string, ArchetypeData> = {
  cafe: {
    venueType: "cafe",
    kitchenAreas: ["Brew Bar", "Cold Prep", "Pastry", "Wash Up"],
    supplierCategories: [
      { category: "Coffee", suggestedRole: "Espresso beans, filter blends" },
      { category: "Dairy", suggestedRole: "Milk, cream, butter, alt-milks" },
      { category: "Bakery", suggestedRole: "Bread, pastries, cakes" },
      { category: "Fruit & Veg", suggestedRole: "Seasonal produce" },
      { category: "Cleaning Supplies", suggestedRole: "Chemicals, sanitisers" },
    ],
    chemicals: [
      { name: "Espresso Machine Cleaner", type: "detergent", dilutionRatio: "Follow manufacturer instructions", contactTime: 30, ppe: ["gloves"], storageInstructions: "Keep away from food surfaces" },
      { name: "Food Surface Sanitiser", type: "sanitiser", dilutionRatio: "1:80 with water", contactTime: 60, ppe: ["gloves"], storageInstructions: "Store in cool, dry place" },
      { name: "Kitchen Degreaser", type: "degreaser", dilutionRatio: "1:20 with water", contactTime: 120, ppe: ["gloves", "goggles"], storageInstructions: "Keep upright, avoid heat" },
    ],
    prepTasks: [
      { title: "Calibrate and backflush espresso machine", category: "cleaning", section: "other", shift: "am", estimatedDurationMinutes: 15, priority: "high" },
      { title: "Portion and label cake slices for display", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 20, priority: "medium" },
      { title: "Slice and prep seasonal fruit for service", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 15, priority: "medium" },
      { title: "Check and rotate cool room stock — FIFO", category: "other", section: "other", shift: "am", estimatedDurationMinutes: 10, priority: "medium" },
      { title: "Set up cold bench and garnishes", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 10, priority: "high" },
    ],
  },

  restaurant: {
    venueType: "restaurant",
    kitchenAreas: ["Hot Section", "Cold Kitchen", "Grill", "Prep", "Pass", "Wash Up"],
    supplierCategories: [
      { category: "Meat", suggestedRole: "Beef, chicken, lamb, pork" },
      { category: "Seafood", suggestedRole: "Fresh fish and shellfish" },
      { category: "Fruit & Veg", suggestedRole: "Produce, herbs, salad" },
      { category: "Dairy", suggestedRole: "Butter, cream, cheese, eggs" },
      { category: "Dry Goods", suggestedRole: "Pasta, rice, oils, pantry" },
      { category: "Cleaning Supplies", suggestedRole: "Sanitisers, degreasers" },
    ],
    chemicals: [
      { name: "Food Surface Sanitiser", type: "sanitiser", dilutionRatio: "1:80 with water", contactTime: 60, ppe: ["gloves"], storageInstructions: "Store in cool, dry place" },
      { name: "Kitchen Degreaser", type: "degreaser", dilutionRatio: "1:20 with water", contactTime: 120, ppe: ["gloves", "goggles"], storageInstructions: "Keep upright, avoid heat" },
      { name: "Oven & Grill Cleaner", type: "degreaser", dilutionRatio: "Undiluted for heavy soiling", contactTime: 300, ppe: ["gloves", "goggles", "apron"], storageInstructions: "Keep away from food surfaces" },
    ],
    prepTasks: [
      { title: "Break down and portion proteins for service", category: "prep", section: "butchery", shift: "am", estimatedDurationMinutes: 45, priority: "high" },
      { title: "Make stocks, jus, and sauces", category: "prep", section: "stocks_sauces", shift: "am", estimatedDurationMinutes: 60, priority: "high" },
      { title: "Prep and portion veg mise en place", category: "prep", section: "veg_prep", shift: "am", estimatedDurationMinutes: 35, priority: "high" },
      { title: "Set cold kitchen — salads, garnishes, starters", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 25, priority: "high" },
      { title: "Portion and label desserts for service", category: "prep", section: "pastry", shift: "pm", estimatedDurationMinutes: 20, priority: "medium" },
    ],
  },

  bistro: {
    venueType: "bistro",
    kitchenAreas: ["Hot Section", "Cold Larder", "Pastry", "Prep Kitchen", "Wash Up"],
    supplierCategories: [
      { category: "Meat", suggestedRole: "Beef, lamb, pork, charcuterie" },
      { category: "Seafood", suggestedRole: "Fresh fish and shellfish" },
      { category: "Fruit & Veg", suggestedRole: "Seasonal produce, herbs" },
      { category: "Dairy", suggestedRole: "Cheese, butter, cream" },
      { category: "Cleaning Supplies", suggestedRole: "Sanitisers, degreasers" },
    ],
    chemicals: [
      { name: "Food Surface Sanitiser", type: "sanitiser", dilutionRatio: "1:80 with water", contactTime: 60, ppe: ["gloves"] },
      { name: "Kitchen Degreaser", type: "degreaser", dilutionRatio: "1:20 with water", contactTime: 120, ppe: ["gloves", "goggles"] },
      { name: "Oven & Grill Cleaner", type: "degreaser", dilutionRatio: "Undiluted for heavy soiling", contactTime: 300, ppe: ["gloves", "goggles", "apron"] },
    ],
    prepTasks: [
      { title: "Break down and portion protein for service", category: "prep", section: "butchery", shift: "am", estimatedDurationMinutes: 45, priority: "high" },
      { title: "Make and reduce stocks and sauces", category: "prep", section: "stocks_sauces", shift: "am", estimatedDurationMinutes: 60, priority: "high" },
      { title: "Prep and portion veg mise en place", category: "prep", section: "veg_prep", shift: "am", estimatedDurationMinutes: 40, priority: "high" },
      { title: "Check and set cold larder for service", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 20, priority: "medium" },
      { title: "Portion and label desserts", category: "prep", section: "pastry", shift: "am", estimatedDurationMinutes: 25, priority: "medium" },
    ],
  },

  pub: {
    venueType: "pub",
    kitchenAreas: ["Grill", "Fryer", "Cold Section", "Pass", "Prep"],
    supplierCategories: [
      { category: "Meat", suggestedRole: "Beef mince, chicken, bacon, pork" },
      { category: "Frozen", suggestedRole: "Chips, frozen protein, convenience" },
      { category: "Fruit & Veg", suggestedRole: "Salad, garnishes, tomatoes" },
      { category: "Dairy", suggestedRole: "Cheese, butter, sauces base" },
      { category: "Bakery", suggestedRole: "Burger buns, bread rolls" },
      { category: "Cleaning Supplies", suggestedRole: "Fryer degreaser, sanitisers" },
    ],
    chemicals: [
      { name: "Food Surface Sanitiser", type: "sanitiser", dilutionRatio: "1:80 with water", contactTime: 60, ppe: ["gloves"] },
      { name: "Fryer Degreaser", type: "degreaser", dilutionRatio: "1:10 with hot water", contactTime: 300, ppe: ["gloves", "goggles", "apron"] },
      { name: "Grill Cleaner", type: "degreaser", dilutionRatio: "Undiluted", contactTime: 180, ppe: ["gloves", "goggles"] },
    ],
    prepTasks: [
      { title: "Form and press burger patties to spec weight", category: "prep", section: "butchery", shift: "am", estimatedDurationMinutes: 30, priority: "high" },
      { title: "Marinate and portion chicken wings", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 20, priority: "high" },
      { title: "Set up cold section — salads, garnishes, sauces", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 25, priority: "high" },
      { title: "Check fryer oil levels and temperature", category: "cleaning", section: "other", shift: "am", estimatedDurationMinutes: 10, priority: "high" },
      { title: "Clean and season grill for service", category: "cleaning", section: "other", shift: "am", estimatedDurationMinutes: 15, priority: "medium" },
    ],
  },

  fine_dining: {
    venueType: "fine_dining",
    kitchenAreas: ["Garde Manger", "Hot Starters", "Sauce Section", "Meat Station", "Fish Station", "Pastry", "Prep"],
    supplierCategories: [
      { category: "Specialty Produce", suggestedRole: "Heritage varieties, micro herbs, flowers" },
      { category: "Meat & Game", suggestedRole: "Dry-aged beef, game, prime cuts" },
      { category: "Seafood", suggestedRole: "Day-boat fish, live shellfish" },
      { category: "Cheese", suggestedRole: "Farmhouse and imported cheese" },
      { category: "Dry Goods", suggestedRole: "Specialty oils, vinegars, pantry" },
      { category: "Cleaning Supplies", suggestedRole: "Sanitisers, stainless cleaner" },
    ],
    chemicals: [
      { name: "Food Surface Sanitiser", type: "sanitiser", dilutionRatio: "1:80 with water", contactTime: 60, ppe: ["gloves"] },
      { name: "Stainless Steel Cleaner", type: "detergent", dilutionRatio: "Ready to use", contactTime: 60, ppe: ["gloves"] },
      { name: "Oven Cleaner", type: "degreaser", dilutionRatio: "Undiluted", contactTime: 300, ppe: ["gloves", "goggles", "apron"] },
    ],
    prepTasks: [
      { title: "Break down and portion proteins to spec", category: "prep", section: "butchery", shift: "am", estimatedDurationMinutes: 60, priority: "high" },
      { title: "Make and pass stocks, jus, and reductions", category: "prep", section: "stocks_sauces", shift: "am", estimatedDurationMinutes: 90, priority: "high" },
      { title: "Pick herbs, prep micro greens and garnishes", category: "prep", section: "veg_prep", shift: "am", estimatedDurationMinutes: 45, priority: "high" },
      { title: "Set garde manger — terrines, tartares, amuses", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 40, priority: "high" },
      { title: "Pastry section setup — petit fours, pre-desserts", category: "prep", section: "pastry", shift: "am", estimatedDurationMinutes: 45, priority: "medium" },
    ],
  },

  bakery: {
    venueType: "bakery",
    kitchenAreas: ["Bread", "Pastry", "Decorating", "Cold Store", "Dispatch"],
    supplierCategories: [
      { category: "Flour & Grains", suggestedRole: "Strong flour, specialty grains" },
      { category: "Dairy", suggestedRole: "Butter, cream, milk, eggs" },
      { category: "Specialty Ingredients", suggestedRole: "Chocolate, nuts, dried fruit, yeast" },
      { category: "Packaging", suggestedRole: "Boxes, bags, labels, paper" },
      { category: "Cleaning Supplies", suggestedRole: "Sanitisers, equipment cleaners" },
    ],
    chemicals: [
      { name: "Food Surface Sanitiser", type: "sanitiser", dilutionRatio: "1:80 with water", contactTime: 60, ppe: ["gloves"] },
      { name: "Equipment Detergent", type: "detergent", dilutionRatio: "1:50 with water", contactTime: 120, ppe: ["gloves"] },
      { name: "Oven Cleaner", type: "degreaser", dilutionRatio: "Undiluted", contactTime: 300, ppe: ["gloves", "goggles", "apron"] },
    ],
    prepTasks: [
      { title: "Mix and prove bread doughs for next bake", category: "prep", section: "other", shift: "am", estimatedDurationMinutes: 45, priority: "high" },
      { title: "Laminate croissant and danish dough", category: "prep", section: "pastry", shift: "am", estimatedDurationMinutes: 60, priority: "high" },
      { title: "Pipe and bake cookies, biscuits for display", category: "prep", section: "pastry", shift: "am", estimatedDurationMinutes: 30, priority: "medium" },
      { title: "Make pastry cream and curds for fillings", category: "prep", section: "pastry", shift: "am", estimatedDurationMinutes: 25, priority: "high" },
      { title: "Rotate and label finished product for retail", category: "other", section: "other", shift: "am", estimatedDurationMinutes: 15, priority: "medium" },
    ],
  },

  burger: {
    venueType: "burger",
    kitchenAreas: ["Grill", "Prep", "Assembly", "Fryer"],
    supplierCategories: [
      { category: "Meat", suggestedRole: "Beef mince, bacon, patties" },
      { category: "Bakery", suggestedRole: "Brioche buns, sesame buns" },
      { category: "Fruit & Veg", suggestedRole: "Pickles, onions, lettuce, tomatoes" },
      { category: "Dairy", suggestedRole: "Cheese slices, sauces base" },
      { category: "Frozen", suggestedRole: "Chips, fries, frozen sides" },
      { category: "Packaging", suggestedRole: "Burger boxes, wrappers, bags" },
    ],
    chemicals: [
      { name: "Food Surface Sanitiser", type: "sanitiser", dilutionRatio: "1:80 with water", contactTime: 60, ppe: ["gloves"] },
      { name: "Fryer Degreaser", type: "degreaser", dilutionRatio: "1:10 with hot water", contactTime: 300, ppe: ["gloves", "goggles", "apron"] },
      { name: "Grill Cleaner", type: "degreaser", dilutionRatio: "Undiluted", contactTime: 180, ppe: ["gloves", "goggles"] },
    ],
    prepTasks: [
      { title: "Press and portion burger patties to spec", category: "prep", section: "butchery", shift: "am", estimatedDurationMinutes: 30, priority: "high" },
      { title: "Slice tomato, pickle, onion for assembly", category: "prep", section: "veg_prep", shift: "am", estimatedDurationMinutes: 20, priority: "high" },
      { title: "Fill sauce bottles and label with prep date", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 10, priority: "medium" },
      { title: "Heat and season flat top grill for service", category: "other", section: "other", shift: "am", estimatedDurationMinutes: 10, priority: "high" },
      { title: "Set up assembly line and check prep levels", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 15, priority: "high" },
    ],
  },

  hotel: {
    venueType: "hotel",
    kitchenAreas: ["Breakfast", "Hot Kitchen", "Cold Larder", "Pastry", "Banquet Prep", "Butchery", "Wash Up"],
    supplierCategories: [
      { category: "Food Service Distributor", suggestedRole: "Full range — dry, frozen, ambient" },
      { category: "Fruit & Veg", suggestedRole: "Fresh produce, herbs" },
      { category: "Meat", suggestedRole: "Beef, chicken, pork" },
      { category: "Seafood", suggestedRole: "Fish and shellfish" },
      { category: "Dairy", suggestedRole: "Milk, cream, butter, eggs, cheese" },
      { category: "Beverages", suggestedRole: "Juice, soft drinks, water" },
      { category: "Cleaning Supplies", suggestedRole: "Sanitisers, dishwasher, descaler" },
    ],
    chemicals: [
      { name: "Food Surface Sanitiser", type: "sanitiser", dilutionRatio: "1:80 with water", contactTime: 60, ppe: ["gloves"] },
      { name: "Heavy Duty Degreaser", type: "degreaser", dilutionRatio: "1:10 with hot water", contactTime: 180, ppe: ["gloves", "goggles"] },
      { name: "Dishwasher Detergent", type: "detergent", dilutionRatio: "Auto-dose system", contactTime: 60, ppe: ["gloves"] },
      { name: "Descaler", type: "acid", dilutionRatio: "1:5 with water", contactTime: 300, ppe: ["gloves", "goggles", "apron"] },
    ],
    prepTasks: [
      { title: "Set up breakfast service — eggs, proteins, buffet", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 45, priority: "high" },
      { title: "Portion proteins for lunch service", category: "prep", section: "butchery", shift: "am", estimatedDurationMinutes: 40, priority: "high" },
      { title: "Make stocks and prepare banquet components", category: "prep", section: "stocks_sauces", shift: "am", estimatedDurationMinutes: 60, priority: "high" },
      { title: "Set cold larder — salads, dressings, starters", category: "prep", section: "mise_en_place", shift: "am", estimatedDurationMinutes: 30, priority: "medium" },
      { title: "Check all storage temps and log readings", category: "other", section: "other", shift: "am", estimatedDurationMinutes: 15, priority: "high" },
    ],
  },
};

// ── Route ──────────────────────────────────────────────────────────────────────

router.post("/venues/:venueId/starter-pack", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const venueId = parseInt(req.params["venueId"] as string);
    const { archetype } = req.body as { archetype?: string };

    if (!archetype || !ARCHETYPES[archetype]) {
      res.status(400).json({ error: "Invalid archetype. Choose: cafe, restaurant, bistro, pub, fine_dining, bakery, burger, hotel" }); return;
    }

    const [venue] = await db.select().from(venuesTable)
      .where(and(eq(venuesTable.id, venueId), eq(venuesTable.userId, userId)));

    if (!venue) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const data = ARCHETYPES[archetype]!;

    // Update venue with type and kitchen areas (structural — not fake data)
    await db.update(venuesTable).set({
      venueType: data.venueType,
      kitchenAreas: data.kitchenAreas,
      updatedAt: new Date(),
    }).where(eq(venuesTable.id, venueId));

    // Seed honest supplier category placeholders — name explicitly signals
    // "this is a slot to fill", chef edits to their real supplier business name.
    const createdSuppliers = await Promise.all(
      data.supplierCategories.map(s =>
        db.insert(suppliersTable).values({
          venueId,
          name: `${s.category} supplier`,
          category: s.category,
          notes: `Replace with your actual supplier — ${s.suggestedRole}`,
        }).returning().then(r => r[0]!)
      )
    );

    // Seed chemicals (SOPs — these are universal kitchen products, not fake operational data)
    const createdChemicals = await Promise.all(
      data.chemicals.map(chem =>
        db.insert(chemicalsTable).values({
          venueId,
          name: chem.name,
          type: chem.type,
          dilutionRatio: chem.dilutionRatio ?? null,
          contactTimeSeconds: chem.contactTime != null ? chem.contactTime * 60 : null,
          ppeRequired: chem.ppe ? chem.ppe.join(",") : null,
          sopInstructions: chem.storageInstructions ?? null,
          isActive: true,
        }).returning().then(r => r[0]!)
      )
    );

    // Seed prep library task templates
    await Promise.all(
      data.prepTasks.map(task =>
        db.insert(prepTaskLibraryTable).values({
          venueId,
          title: task.title,
          category: task.category as "prep" | "cleaning" | "order" | "other",
          section: task.section as "mise_en_place" | "stocks_sauces" | "pastry" | "butchery" | "veg_prep" | "cleaning" | "other",
          shift: task.shift as "am" | "pm" | "split",
          estimatedMinutes: task.estimatedDurationMinutes ?? null,
          priority: (task.priority ?? "medium") as "low" | "medium" | "high" | "urgent",
        }).returning().then(r => r[0]!)
      )
    );

    req.log.info({ venueId, archetype, supplierSlots: createdSuppliers.length, chemicals: createdChemicals.length }, "Starter pack applied (scaffold-only)");

    res.json({
      archetype,
      suppliersCreated: createdSuppliers.length,
      inventoryCreated: 0,
      chemicalsCreated: createdChemicals.length,
      message: `${data.venueType.replace(/_/g, " ")} structure ready. Next: rename the supplier placeholders to your real vendors, then add your real inventory.`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to apply starter pack");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
