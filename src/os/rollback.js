import { listRules, removeRule } from "../state/ruleStore.js";
import { runCommand } from "./runner.js";
import { recordRollback } from "../rules/health.js";

/**
 * Roll back ALL firewall rules created by mini-firewall.
 * Each rollback is recorded for rule health scoring.
 */
export async function rollbackAll() {
  const rules = listRules();

  for (const id of Object.keys(rules)) {
    const rule = rules[id];

    if (rule.tag) {
      recordRollback(rule.tag);
    }

    // Build OS delete command based on rule.type
    const delCmd = buildDeleteCommand(rule); // your OS-specific builder
    await runCommand(delCmd);

    removeRule(id);
  }
}
