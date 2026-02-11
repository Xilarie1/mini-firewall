// src/rules/threatMemory.js
// Persistent Threat Memory with clustering + disk storage

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File where threat memory is persisted
const MEMORY_PATH = path.join(__dirname, "../../threatMemory.json");

// In-memory store
const memory = new Map();

/* ---------------- Persistence Layer ---------------- */

function loadMemoryFromDisk() {
  if (!fs.existsSync(MEMORY_PATH)) return;

  const raw = fs.readFileSync(MEMORY_PATH, "utf-8");
  const parsed = JSON.parse(raw);

  for (const entry of parsed) {
    memory.set(entry.key, entry);
  }
}

function saveMemoryToDisk() {
  const arr = Array.from(memory.values());
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(arr, null, 2));
}

/* ---------------- Core API ---------------- */

/**
 * Record a suspicious event in memory
 */
export function recordThreat(conn, rule) {
  const key = `${conn.remoteIp}|${conn.processName || "unknown"}|${conn.remotePort}`;

  if (!memory.has(key)) {
    memory.set(key, {
      key,
      count: 0,
      firstSeen: Date.now(),
      lastSeen: null,
      sample: conn,
      ruleTag: rule.tag,
      ruleCreated: false,
    });
  }

  const entry = memory.get(key);
  entry.count++;
  entry.lastSeen = Date.now();

  saveMemoryToDisk();
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

/**
 * Clear threat memory (optional admin tool)
 */
export function clearThreats() {
  memory.clear();
  saveMemoryToDisk();
}

/* ---------------- Init ---------------- */

loadMemoryFromDisk();
