// src/rules/threatScorer.js

import { listThreats } from "./threatMemory.js";

/**
 * Computes confidence score for each threat cluster.
 * Returns enriched threat objects with a confidence field.
 */
export function scoreThreats() {
  const threats = listThreats();

  return threats.map((t) => {
    let score = 0;

    // Frequency
    score += t.count * 2;

    // Persistence
    const ageMinutes = (Date.now() - t.firstSeen) / 60000;
    if (ageMinutes > 10) score += 5;
    if (ageMinutes > 30) score += 10;

    // Correlation strength
    if (t.sample.processName) score += 5;
    if (t.sample.remotePort) score += 3;

    // Rollback penalty (if the rule caused pain)
    if (t.rollbacks) score -= t.rollbacks * 5;

    return {
      ...t,
      confidence: score,
    };
  });
}
