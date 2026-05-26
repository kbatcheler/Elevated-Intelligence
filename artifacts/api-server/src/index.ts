import app from "./app";
import { logger } from "./lib/logger";
import { reconcileStaleRuns } from "./lib/pipeline/reconciler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  // Third-line defense for runs orphaned by process kill or transient DB
  // outage during failRun. Fire-and-forget; the reconciler logs its own
  // errors and never throws.
  void reconcileStaleRuns();
});
