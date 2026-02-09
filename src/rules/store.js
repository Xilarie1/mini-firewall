// src/rules/store.js
// Persistent rule store with lifecycle + health tracking

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { recordRollback } from "./health.js";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File where rules are persisted
const RULES_PATH = path.join(__dirname, "../../rules.json");

// In-memory rule map (tag -> rule)
const rules = new Map();

/* ---------------- Persistence Layer ---------------- */

/**
 * Load rules from disk into memory on startup.
 */
function loadRulesFromDisk() {
  if (!fs.existsSync(RULES_PATH)) return;

  const raw = fs.readFileSync(RULES_PATH, "utf-8");
  const parsed = JSON.parse(raw);

  for (const rule of parsed) {
    rules.set(rule.tag, rule);
  }
}

/**
 * Save all rules from memory to disk.
 */
function saveRulesToDisk() {
  const arr = Array.from(rules.values());
  fs.writeFileSync(RULES_PATH, JSON.stringify(arr, null, 2));
}

/* ---------------- Rule Lifecycle ---------------- */

/**
 * Add a new rule to the store
 */
export function addRule(rule) {
  const tag = rule.tag;
  if (!tag) throw new Error("Rule must have a tag");
  if (rules.has(tag)) throw new Error(`Rule "${tag}" already exists`);

  rules.set(tag, {
    ...rule,
    enabled: rule.enabled ?? true,
    temporary: rule.temporary ?? true,
    permanent: !!rule.permanent,
    createdAt: rule.createdAt || Date.now(),
    hitCount: 0,
    failures: 0,
    rollbacks: 0,
  });

  saveRulesToDisk();
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
  rule.permanent = true;
  rule.promotedAt = Date.now();

  saveRulesToDisk();
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

  saveRulesToDisk();
  console.log(`[rules] Deactivated ${tag}`);
}

/**
 * Rollback a single rule (logic + health)
 */
export function rollbackRule(tag) {
  const rule = rules.get(tag);
  if (!rule) return;

  rule.failures++;
  rule.rollbacks++;
  rule.enabled = false;
  rule.rolledBackAt = Date.now();

  recordRollback(tag);
  saveRulesToDisk();

  console.log(`[rules] Rolled back ${tag}`);
}

/* ---------------- Health / Stats ---------------- */

/**
 * Record a rule hit (used by engine)
 */
export function recordHit(tag) {
  const rule = rules.get(tag);
  if (!rule) return;

  rule.hitCount++;
  saveRulesToDisk();
}

/**
 * Get rule stats for CLI / Guardian
 */
export function getRuleStats(tag) {
  const rule = rules.get(tag);
  if (!rule) return null;

  return {
    tag: rule.tag,
    hitCount: rule.hitCount,
    failures: rule.failures,
    rollbacks: rule.rollbacks,
    temporary: rule.temporary,
    permanent: rule.permanent,
    enabled: rule.enabled,
    createdAt: rule.createdAt,
    promotedAt: rule.promotedAt || null,
    deactivatedAt: rule.deactivatedAt || null,
    rolledBackAt: rule.rolledBackAt || null,
  };
}

/* ---------------- Init ---------------- */

// Load persisted rules immediately when module is imported
loadRulesFromDisk();
