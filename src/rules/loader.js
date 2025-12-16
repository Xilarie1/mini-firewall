import fs from "fs";
import path from "path";

/**
 * Loads and parses rule files from the rules folder.
 * This version loads ONLY defaultRules.json,
 *
 * @returns {Array} - Array of rule objects
 */
export function loadRules() {
  const rulesPath = path.resolve("src/rules/defaultRules.json");

  try {
    const data = fs.readFileSync(rulesPath, "utf-8");
    const rules = JSON.parse(data);

    // Normalize rules so missing fields become undefined
    return rules.map((rule, index) => ({
      id: index, // unique rule id during session
      type: rule.type || "deny",
      process: rule.process || undefined,
      pid: rule.pid || undefined,
      localIp: rule.localIp || undefined,
      localPort: rule.localPort || undefined,
      remoteIp: rule.remoteIp || undefined,
      remotePort: rule.remotePort || undefined,
      protocol: rule.protocol || undefined,
      remoteHost: rule.remoteHost || undefined,
    }));
  } catch (err) {
    console.error("Failed to load rules:", err);
    return [];
  }
}
