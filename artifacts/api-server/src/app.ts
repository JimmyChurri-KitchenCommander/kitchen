import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { startExportScheduler } from "./jobs/exportScheduler";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

// In production (e.g. Railway) serve the Vite-built frontend from the same
// Express process so that relative /api/... calls are same-origin.
// The frontend is built to artifacts/hospitality-ops/dist/public/; from the
// compiled bundle at artifacts/api-server/dist/index.mjs that is two levels up.
const frontendDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../hospitality-ops/dist/public",
);

if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  // SPA fallback: serve index.html for any path that is not an /api/ route.
  // This lets client-side routing (Wouter) handle all non-API paths.
  app.get(/^(?!\/api\/).*$/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

startExportScheduler();

export default app;
