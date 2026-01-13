import { checkHeartbeat } from "./heartbeat.js";
import { rollbackAll } from "../os/runner.js";

const INTERVAL = 30_000; // every 30 seconds

export function startGuardian() {
  setInterval(async () => {
    const ok = await checkHeartbeat();
    if (!ok) {
      console.error("HEARTBEAT FAILED — auto rollback triggered");
      rollbackAll();
    }
  }, INTERVAL);
}
