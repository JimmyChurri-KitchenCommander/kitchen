import { Router, type IRouter } from "express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { venuesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import healthRouter from "./health";
import venuesRouter from "./venues";
import inventoryRouter from "./inventory";
import suppliersRouter from "./suppliers";
import recipesRouter from "./recipes";
import wasteRouter from "./waste";
import invoicesRouter from "./invoices";
import invoiceScanRouter from "./invoiceScan";
import dashboardRouter from "./dashboard";
import analyticsRouter from "./analytics";
import sharesRouter from "./shares";
import ordersRouter from "./orders";
import prepPlanRouter from "./prepPlan";
import prepTasksRouter from "./prepTasks";
import prepLibraryRouter from "./prepLibrary";
import bookingNotesRouter from "./bookingNotes";
import cleaningRouter from "./cleaning";
import stocktakesRouter from "./stocktakes";
import venueMembersRouter from "./venueMembers";
import seedDemoRouter from "./seedDemo";
import supplierImportRouter from "./supplierImport";
import supplierBulkImportRouter from "./supplierBulkImport";
import authInviteRouter from "./authInvite";
import exportRouter from "./export";
import venueSetupRouter from "./venueSetup";
import menusRouter from "./menus";
import temperatureRouter from "./temperature";
import dataRetentionRouter from "./dataRetention";
import userRouter from "./user";
import demoRouter from "./demo";
import chemicalsRouter from "./chemicals";
import complianceOverviewRouter from "./complianceOverview";
import assistantContextRouter from "./assistantContext";
import commandCentreRouter from "./commandCentre";
import serviceModeRouter from "./serviceMode";
import foodCostConfidenceRouter from "./foodCostConfidence";
import starterPackRouter from "./starterPack";
import setupProgressRouter from "./setupProgress";
import handoverNotesRouter from "./handoverNotes";
import purchaseOrdersRouter from "./purchaseOrders";
import productionBatchesRouter from "./productionBatches";

// ── Demo user cache ────────────────────────────────────────────────────────────
// Caches the Clerk user ID of The Black Apron venue owner to avoid a DB lookup
// on every demo request. Expires every 5 minutes.
let _demoCachedUserId: string | null = null;
let _demoCacheExpiry = 0;

async function resolveDemoUserId(): Promise<string | null> {
  if (_demoCachedUserId && Date.now() < _demoCacheExpiry) {
    return _demoCachedUserId;
  }
  const [venue] = await db
    .select({ userId: venuesTable.userId })
    .from(venuesTable)
    .where(eq(venuesTable.name, "The Black Apron"))
    .limit(1);
  _demoCachedUserId = venue?.userId ?? null;
  _demoCacheExpiry = Date.now() + 5 * 60 * 1000;
  return _demoCachedUserId;
}

const router: IRouter = Router();

// ── Demo sandbox middleware ────────────────────────────────────────────────────
// Intercepts requests with a demo bearer token. If the token matches
// DEMO_ACCESS_TOKEN, the request is authenticated as the owner of The Black
// Apron with read-only privileges (writes are blocked below).
router.use(async (req: Request, _res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  const token = process.env.DEMO_ACCESS_TOKEN;
  if (token && auth === `Bearer demo-${token}`) {
    const userId = await resolveDemoUserId();
    if (userId) {
      req.userId = userId;
      req.isDemoMode = true;
    }
  }
  next();
});

// Block all write operations for demo sessions.
router.use((req: Request, res: Response, next: NextFunction) => {
  if (req.isDemoMode && req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    res.status(403).json({
      error: "This is the demo kitchen — sign up to save real changes.",
      demo: true,
    });
    return;
  }
  next();
});

// Public demo init endpoint (no Clerk auth required) — registered before requireAuth routes.
router.use(demoRouter);

router.use(healthRouter);
router.use(venuesRouter);
router.use(inventoryRouter);
router.use(suppliersRouter);
router.use(recipesRouter);
router.use(wasteRouter);
router.use(invoicesRouter);
router.use(invoiceScanRouter);
router.use(dashboardRouter);
router.use(analyticsRouter);
router.use(sharesRouter);
router.use(ordersRouter);
router.use(prepPlanRouter);
router.use(prepTasksRouter);
router.use(prepLibraryRouter);
router.use(bookingNotesRouter);
router.use(cleaningRouter);
router.use(stocktakesRouter);
router.use(venueMembersRouter);
router.use(seedDemoRouter);
router.use(supplierImportRouter);
router.use(supplierBulkImportRouter);
router.use(authInviteRouter);
router.use(exportRouter);
router.use(venueSetupRouter);
router.use(menusRouter);
router.use(temperatureRouter);
router.use(dataRetentionRouter);
router.use(userRouter);
router.use(chemicalsRouter);
router.use(complianceOverviewRouter);
router.use(assistantContextRouter);
router.use(commandCentreRouter);
router.use(serviceModeRouter);
router.use(foodCostConfidenceRouter);
router.use(starterPackRouter);
router.use(setupProgressRouter);
router.use(handoverNotesRouter);
router.use(purchaseOrdersRouter);
router.use(productionBatchesRouter);

export default router;
