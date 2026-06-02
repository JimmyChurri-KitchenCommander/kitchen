import { logger } from "../lib/logger";
import { runScheduledExports } from "../routes/dataRetention";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startExportScheduler(): void {
  if (intervalId) return;

  // Check every hour if any exports are due
  intervalId = setInterval(async () => {
    try {
      await runScheduledExports();
    } catch (err) {
      logger.error({ err }, "Export scheduler error");
    }
  }, 60 * 60 * 1000); // every 60 minutes

  logger.info("Export scheduler started (hourly check)");
}

export function stopExportScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
