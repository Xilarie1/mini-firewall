// src/core/guardian.js

import { checkHeartbeat } from "./heartbeat.js";
import { rollbackAll, rollbackRule } from "../os/runner.js";
import { getActiveRules, deactivateRule, promoteRule } from "../rules/store.js";

const INTERVAL = 30_000; // Guardian heartbeat interval (30s)

// Hard safety limits
const MAX_RULE_AGE = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 3; // auto rollback threshold

export function startGuardian() {
  setInterval(async () => {
    console.log("[guardian] heartbeat tick");

    // ---- SYSTEM SAFETY RAIL ----
    const ok = await checkHeartbeat();
    if (!ok) {
      console.error("[guardian] SYSTEM HEARTBEAT FAILED — FULL ROLLBACK");
      rollbackAll();
      return;
    }

    // ---- RULE GOVERNOR ----
    const rules = getActiveRules();

    for (const rule of rules) {
      const age = Date.now() - rule.createdAt;

      // 1. Auto-expire old rules
      if (age > MAX_RULE_AGE) {
        console.warn(`[guardian] Expiring rule ${rule.tag}`);
        deactivateRule(rule.tag);
        continue;
      }

      // 2. Auto-rollback unstable rules
      if (rule.failures >= MAX_FAILURES) {
        console.error(`[guardian] Rolling back unstable rule ${rule.tag}`);
        rollbackRule(rule.tag);
        continue;
      }

      // 3. Auto-promote stable rules
      if (rule.hitCount > 50 && rule.failures === 0 && !rule.permanent) {
        console.log(`[guardian] Promoting stable rule ${rule.tag}`);
        promoteRule(rule.tag);
      }
    }
  }, INTERVAL);
}
