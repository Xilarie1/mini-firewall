import { loadRegistry, clearRegistry } from "../state/registry.js";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

/**
 * Removes every firewall rule created by mini-firewall.
 */
export async function rollbackAll() {
  const rules = loadRegistry();

  for (const r of rules) {
    if (r.osCmd) {
      console.log("Rolling back:", r.osCmd.undo);
      await execAsync(r.osCmd.undo);
    }
  }

  clearRegistry();
  console.log("Rollback complete.");
}
