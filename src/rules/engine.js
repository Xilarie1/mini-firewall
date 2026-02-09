import { loadRules } from "./loader.js";
import { recordHit } from "./health.js";
import { recordThreat } from "./threatMemory.js";
import { recordHit } from "./store.js";

/**
 * Checks if one rule matches a connection.
 * Flat rule = simple field equality.
 * Now also supports:
 *  - enable/disable
 *  - TTL expiration (expiresAt)
 *
 * @param {object} conn - A network connection snapshot entry
 * @param {object} rule - A single rule object
 * @returns {boolean}
 */
function ruleMatchesConnection(conn, rule) {
  // Rule explicitly disabled
  if (rule.enabled === false) return false;

  // Rule expired (TTL safety)
  if (rule.expiresAt && rule.expiresAt <= Date.now()) return false;

  // --- Flat matching logic ---
  if (rule.process && conn.processName !== rule.process) return false;
  if (rule.pid && conn.pid !== rule.pid) return false;

  if (rule.localIp && conn.localIp !== rule.localIp) return false;
  if (rule.localPort && conn.localPort !== rule.localPort) return false;

  if (rule.remoteIp && conn.remoteIp !== rule.remoteIp) return false;
  if (rule.remotePort && conn.remotePort !== rule.remotePort) return false;

  if (rule.protocol && conn.protocol !== rule.protocol) return false;
  if (rule.remoteHost && conn.remoteHost !== rule.remoteHost) return false;

  return true;
}

/**
 * Evaluates all rules against a connection.
 * If a rule matches, record a health hit.
 *
 * @param {object} conn - The connection to test
 * @returns {object} - { hit: boolean, rule: matchedRule|null }
 */
export function evaluateConnection(conn) {
  const rules = loadRules();

  for (const rule of rules) {
    if (ruleMatchesConnection(conn, rule)) {
      // Phase 10.7 — health learning
      recordHit(rule.tag);

      // Phase 10.8 — threat memory
      recordThreat(conn, rule);

      return { hit: true, rule };
    }
  }

  return { hit: false, rule: null };
}
// dss

if (result.hit) {
  recordHit(result.rule.tag);
}
