// src/rules/autoSynth.js

import { listThreats } from "./threatMemory.js";
import { addRule } from "./store.js";
import { standardizeTag } from "./tagger.js";

const THREAT_THRESHOLD = 5; // how many times before auto-rule is created

/**
 * Scan threat memory and auto-generate firewall rules
 */
export function synthesizeRules() {
  const threats = listThreats();

  for (const threat of threats) {
    if (threat.count >= THREAT_THRESHOLD && !threat.ruleCreated) {
      const tag = standardizeTag(
        `auto-block-${threat.sample.remoteIp}-${threat.sample.remotePort}`,
      );

      const rule = {
        tag,
        type: "block",
        remoteIp: threat.sample.remoteIp,
        remotePort: threat.sample.remotePort,
        process: threat.sample.processName || null,
        direction: "outbound",
        temporary: true,
        createdAt: Date.now(),
        enabled: true,
      };

      console.log(`[autoSynth] Creating auto rule: ${tag}`);

      addRule(rule);

      // Mark this threat as handled so we don't duplicate
      threat.ruleCreated = true;
    }
  }
}
