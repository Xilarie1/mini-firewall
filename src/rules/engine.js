import { loadRules } from "./loader.js";

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

  // --- Existing flat matching logic ---
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
 *
 * @param {object} conn - The connection to test
 * @returns {object} - { hit: boolean, rule: matchedRule|null }
 */
export function evaluateConnection(conn) {
  const rules = loadRules();

  for (const rule of rules) {
    if (ruleMatchesConnection(conn, rule)) {
      return {
        hit: true,
        rule,
      };
    }
  }

  // No rule matched
  return {
    hit: false,
    rule: null,
  };
}
