import { signatures } from "../signatures/basic.js";
import { recordEvent } from "../state/events.js";
import { scoreConnection } from "./heuristics.js";

/**
 * Returns a detection result for a connection.
 */
export function detect(conn) {
  let score = scoreConnection(conn);
  const hits = [];

  for (const sig of signatures) {
    if (sig.match(conn)) {
      score += sig.weight;
      hits.push(sig.id);
    }
  }

  score = Math.min(score, 100);

  const result = {
    score,
    hits,
    level:
      score >= 80
        ? "critical"
        : score >= 50
        ? "high"
        : score >= 25
        ? "medium"
        : score > 0
        ? "low"
        : "clean",
  };

  if (score > 0) {
    recordEvent({
      ip: conn.remoteIp,
      pid: conn.pid,
      process: conn.processName,
      score,
      hits,
    });
  }

  return result;
}

import { getReputation } from "./reputation.js";

const rep = getReputation(conn.remoteIp);

if (rep.tor) {
  score += 35;
  hits.push("TOR_NODE");
}

if (rep.bogon) {
  score += 20;
  hits.push("BOGON_RANGE");
}
