// src/core/guardian.js

import { checkHeartbeat } from "./heartbeat.js";
import { rollbackAll, rollbackRule } from "../os/runner.js";
import {
  getActiveRules,
  deactivateRule,
  promoteRule,
  listRules,
} from "../rules/store.js";
import { computeScore } from "../rules/health.js";
import { synthesizeRules } from "../rules/autoSynth.js";
import { scoreThreats } from "../rules/threatScorer.js";
import { addRule } from "../rules/store.js";

const INTERVAL = 30_000; // Guardian heartbeat interval (30s)

// Hard safety limits
const MAX_RULE_AGE = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 3; // auto rollback threshold

/**
 * Starts the Guardian safety & governance loop.
 * Runs continuously and enforces:
 * - System heartbeat safety
 * - Rule expiration
 * - Rule rollback
 * - Rule promotion
 * - Rule health scoring
 */
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

    // ---- RULE HEALTH SCORING ----
    await evaluateRuleHealth();

    synthesizeRules();
    1;
  }, INTERVAL);
}

/**
 * Evaluates long-term rule health and promotes/deactivates automatically
 */
export async function evaluateRuleHealth() {
  const rules = listRules();

  for (const rule of rules) {
    const score = computeScore(rule.tag);

    if (score > 25 && rule.temporary) {
      console.log(`[guardian] Health promote ${rule.tag} (score=${score})`);
      promoteRule(rule.tag);
    }

    if (score < -10) {
      console.warn(`[guardian] Health deactivate ${rule.tag} (score=${score})`);
      deactivateRule(rule.tag);
    }
  }
}

const scored = scoreThreats();

for (const threat of scored) {
  if (threat.confidence > 30 && !threat.ruleCreated) {
    console.log(
      `[guardian] High confidence threat — auto blocking ${threat.sample.remoteIp}`,
    );

    addRule({
      tag: `conf-block-${threat.sample.remoteIp}-${threat.sample.remotePort}`,
      remoteIp: threat.sample.remoteIp,
      remotePort: threat.sample.remotePort,
      process: threat.sample.processName || null,
      temporary: false,
      enabled: true,
      createdAt: Date.now(),
    });

    threat.ruleCreated = true;
  }
}
