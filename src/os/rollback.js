import { listRules, removeRule } from "../state/ruleStore.js";
import { runCommand } from "./runner.js";
import { recordRollback } from "../rules/health.js";
import { buildDeleteCommand } from "./builders.js"; // <-- make sure this exists

/**
 * Roll back ALL firewall rules created by mini-firewall.
 * Each rollback is recorded for rule health scoring.
 */
export async function rollbackAll() {
  const rules = listRules();

  for (const id of Object.keys(rules)) {
    const rule = rules[id];

    try {
      // Build OS delete command based on rule.type
      const delCmd = buildDeleteCommand(rule);

      // Execute rollback command
      await runCommand(delCmd);

      // Record rollback only AFTER success
      if (rule.tag) {
        recordRollback(rule.tag);
      }

      // Remove rule from store
      removeRule(id);
    } catch (err) {
      console.error(`[rollback] Failed to rollback rule ${rule.tag}:`, err);
    }
  }
}
