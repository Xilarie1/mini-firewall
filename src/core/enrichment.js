// src/core/enrichment.js
import { getProcessName } from "../utils/processCache.js";
import { reverseLookup } from "../utils/dnsCache.js";

/**
 * Enriches a single connection.
 * Returns immediately with base data, and updates fields asynchronously.
 */
export function enrichConnection(conn) {
  // Start with fast placeholder values
  conn.processName = null;
  conn.remoteHost = null;

  // Process name enrichment (async, cached)
  getProcessName(conn.pid).then((name) => {
    conn.processName = name || "-";
  });

  // Reverse DNS enrichment (async, cached)
  reverseLookup(conn.remoteIp).then((host) => {
    conn.remoteHost = host || null;
  });

  return conn;
}

/**
 * Fast enrichment for lists.
 */
export function enrichConnections(list) {
  return list.map((c) => enrichConnection(c));
}
