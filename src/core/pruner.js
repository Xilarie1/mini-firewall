import { listRules, removeRule } from "../state/ruleStore.js";
import { runCommand } from "../os/runner.js";

export async function pruneExpiredRules() {
  const now = Date.now();
  const rules = listRules();

  for (const id in rules) {
    const rule = rules[id];
    if (rule.expiresAt && rule.expiresAt <= now) {
      const delCmd = buildDeleteCommand(rule);
      await runCommand(delCmd);
      removeRule(id);
    }
  }
}

setInterval(pruneExpiredRules, 60_000);
