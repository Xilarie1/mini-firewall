// src/core/blastGovernor.js

const MAX_RULES_PER_HOUR = 10;
const MAX_ACTIVE_RULES = 25;
const MAX_SEVERITY = 3;

let ruleWindow = [];
let activeRuleCount = 0;

export function canCreateRule(severity = 1) {
  const now = Date.now();

  // sliding 1-hour window
  ruleWindow = ruleWindow.filter((t) => now - t < 60 * 60 * 1000);

  if (ruleWindow.length >= MAX_RULES_PER_HOUR) return false;
  if (activeRuleCount >= MAX_ACTIVE_RULES) return false;
  if (severity > MAX_SEVERITY) return false;

  ruleWindow.push(now);
  return true;
}

export function registerRuleActivation() {
  activeRuleCount++;
}

export function registerRuleDeactivation() {
  activeRuleCount = Math.max(0, activeRuleCount - 1);
}

export function getBlastStatus() {
  return {
    rulesLastHour: ruleWindow.length,
    activeRules: activeRuleCount,
    maxActiveRules: MAX_ACTIVE_RULES,
    maxSeverity: MAX_SEVERITY,
  };
}
