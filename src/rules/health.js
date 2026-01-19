// src/rules/health.js

const healthMap = new Map();

/**
 * Initialize health record for a rule
 */
export function initRuleHealth(tag) {
  if (!healthMap.has(tag)) {
    healthMap.set(tag, {
      hits: 0,
      falsePositives: 0,
      rollbacks: 0,
      createdAt: Date.now(),
      lastHit: null,
      score: 0,
    });
  }
}

/**
 * Record when a rule matched traffic
 */
export function recordHit(tag) {
  const h = healthMap.get(tag);
  if (!h) return;
  h.hits++;
  h.lastHit = Date.now();
}

/**
 * Record when rule was rolled back
 */
export function recordRollback(tag) {
  const h = healthMap.get(tag);
  if (!h) return;
  h.rollbacks++;
}

/**
 * Compute health score
 */
export function computeScore(tag) {
  const h = healthMap.get(tag);
  if (!h) return 0;

  let score = 0;
  score += h.hits * 2;
  score -= h.falsePositives * 3;
  score -= h.rollbacks * 5;

  // favor older stable rules
  const ageHours = (Date.now() - h.createdAt) / 3_600_000;
  score += Math.min(ageHours, 24);

  h.score = score;
  return score;
}

export function getRuleHealth(tag) {
  return healthMap.get(tag);
}
9;
