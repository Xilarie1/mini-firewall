import { recordRollback } from "./health.js";

const rules = new Map();

/**
 * Add a new rule to the store
 */
export function addRule(rule) {
  const tag = rule.tag;
  if (!tag) throw new Error("Rule must have a tag");

  rules.set(tag, {
    ...rule,
    enabled: rule.enabled ?? true,
    temporary: rule.temporary ?? true,
    createdAt: rule.createdAt || Date.now(),
    hitCount: 0,
    failures: 0,
  });

  console.log(`[rules] Added rule ${tag}`);
}

/**
 * List all rules
 */
export function listRules() {
  return Array.from(rules.values());
}

/**
 * Return only enabled rules
 */
export function getActiveRules() {
  return Array.from(rules.values()).filter((r) => r.enabled);
}

/**
 * Promote rule to permanent
 */
export function promoteRule(tag) {
  const rule = rules.get(tag);
  if (!rule) return;

  rule.temporary = false;
  rule.promotedAt = Date.now();
  console.log(`[rules] Promoted ${tag}`);
}

/**
 * Disable (expire) rule
 */
export function deactivateRule(tag) {
  const rule = rules.get(tag);
  if (!rule) return;

  rule.enabled = false;
  rule.deactivatedAt = Date.now();
  console.log(`[rules] Deactivated ${tag}`);
}

/**
 * Rollback a single rule
 */
export function rollbackRule(tag) {
  const rule = rules.get(tag);
  if (!rule) return;

  rule.failures++;
  recordRollback(tag);
  rule.enabled = false;

  console.log(`[rules] Rolled back ${tag}`);
}

/**
 * Rule health / stats
 */
export function getRuleStats(tag) {
  const rule = rules.get(tag);
  if (!rule) return null;

  return {
    tag: rule.tag,
    hitCount: rule.hitCount,
    failures: rule.failures,
    temporary: rule.temporary,
    enabled: rule.enabled,
    createdAt: rule.createdAt,
    promotedAt: rule.promotedAt || null,
    deactivatedAt: rule.deactivatedAt || null,
  };
}
