import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve("src/state/threatMemory.json");

// Internal memory map
const memory = new Map();

/**
 * Load memory from disk at startup
 */
function loadMemory() {
  if (!fs.existsSync(DATA_PATH)) return;

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const data = JSON.parse(raw);

  for (const [key, value] of Object.entries(data)) {
    memory.set(key, value);
  }
}

/**
 * Save memory to disk
 */
function saveMemory() {
  const obj = Object.fromEntries(memory.entries());
  fs.writeFileSync(DATA_PATH, JSON.stringify(obj, null, 2));
}

// Load on boot
loadMemory();

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

  saveMemory();
}

/**
 * Check if a connection matches a known threat pattern
 */
export function isKnownThreat(conn) {
  for (const entry of memory.values()) {
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
