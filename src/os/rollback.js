import { listRules, removeRule } from "../state/ruleStore.js";
import { runCommand } from "./runner.js";

export async function rollbackAll() {
  const rules = listRules();

  for (const id of Object.keys(rules)) {
    const rule = rules[id];

    // Build OS delete command based on rule.type
    const delCmd = buildDeleteCommand(rule); // your OS-specific builder
    await runCommand(delCmd);

    removeRule(id);
  }
}
