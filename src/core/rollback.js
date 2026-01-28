import { loadRegistry, clearRegistry } from "../state/registry.js";
import { exec } from "child_process";
import util from "util";
import { recordRollback } from "../rules/threatMemory.js";

const execAsync = util.promisify(exec);

/**
 * Removes every firewall rule created by mini-firewall.
 */
export async function rollbackAll() {
  const rules = loadRegistry();

  for (const r of rules) {
    if (r.osCmd?.undo) {
      console.log("Rolling back:", r.osCmd.undo);

      try {
        await execAsync(r.osCmd.undo);

        // ✅ Only record if rollback actually succeeded
        recordRollback(r);
      } catch (err) {
        console.error("Rollback failed:", r.tag || r.id, err.message);
      }
    }
  }

  clearRegistry();
  console.log("Rollback complete.");
}
