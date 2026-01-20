const memory = new Map();

/**
 * Record a suspicious event in memory
 * @param {object} conn - The connection that triggered a rule
 * @param {object} rule - The rule that matched
 */
export function recordThreat(conn, rule) {
  const key = `${conn.remoteIp}|${conn.processName || "unknown"}|${conn.remotePort}`;

  if (!memory.has(key)) {
    memory.set(key, {
      count: 0,
      firstSeen: Date.now(),
      lastSeen: null,
      sample: conn,
      ruleTag: rule.tag,
    });
  }

  const entry = memory.get(key);
  entry.count++;
  entry.lastSeen = Date.now();
}

/**
 * Check if a connection matches a known threat pattern
 */
export function isKnownThreat(conn) {
  for (const [key, entry] of memory.entries()) {
    if (
      conn.remoteIp === entry.sample.remoteIp &&
      conn.remotePort === entry.sample.remotePort &&
      conn.processName === entry.sample.processName
    ) {
      return true;
    }
  }
  return false;
}

/**
 * List current threat memory clusters
 */
export function listThreats() {
  return Array.from(memory.values());
}
