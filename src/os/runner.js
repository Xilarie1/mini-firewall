import { exec } from "child_process";
import util from "util";
import { isArmed } from "../core/arm.js";
import { registerRule } from "../state/registry.js";
import { decide } from "./decision.js";
import { applyRule } from "../os/runner.js";

const execAsync = util.promisify(exec);

/**
 * Executes OS firewall commands ONLY if safety interlock is armed.
 */
export async function runFirewallCommand(cmd, meta, options = {}) {
  if (!isArmed(options)) {
    console.log("🟡 Enforcement skipped (not armed)");
    return false;
  }

  console.log("🔴 APPLYING:", cmd);
  await execAsync(cmd);
  registerRule(meta);
  return true;
}

const action = decide(conn.remoteIp, threatScore);

if (action === "block") {
  applyRule("block-ip", conn.remoteIp);
}
