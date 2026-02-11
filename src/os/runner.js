// src/os/runner.js
import { exec } from "child_process";
import util from "util";
import os from "os";
import { loadRegistry, saveRegistry, recordRule } from "../state/registry.js";

const execAsync = util.promisify(exec);
const PLATFORM = os.platform();

/**
 * Apply a firewall rule via OS commands
 */
export async function applyRule(rule) {
  const { apply, undo } = buildOSCommand(rule);

  console.log("[os] APPLY:", apply);
  await execAsync(apply);

  recordRule({
    tag: rule.tag,
    osCmd: { apply, undo },
    createdAt: Date.now(),
  });

  saveRegistry();
}

/**
 * Roll back a single rule by tag
 */
export async function rollbackRule(tag) {
  const registry = loadRegistry();
  const entry = registry.find((r) => r.tag === tag);
  if (!entry) return;

  console.log("[os] ROLLBACK:", entry.osCmd.undo);
  await execAsync(entry.osCmd.undo);

  registry.splice(registry.indexOf(entry), 1);
  saveRegistry();
}

/**
 * Roll back ALL firewall rules created by mini-firewall
 */
export async function rollbackAll() {
  const registry = loadRegistry();

  for (const r of registry) {
    console.log("[os] ROLLBACK:", r.osCmd.undo);
    await execAsync(r.osCmd.undo);
  }

  saveRegistry([]);
  console.log("[os] Full rollback complete.");
}

/* ---------------- OS COMMAND BUILDER ---------------- */

function buildOSCommand(rule) {
  const { remoteIp, remotePort, protocol } = rule;

  if (PLATFORM === "win32") {
    const name = rule.tag;

    const apply = `netsh advfirewall firewall add rule name="${name}" dir=in action=block remoteip=${remoteIp} protocol=${protocol || "TCP"} localport=${remotePort}`;
    const undo = `netsh advfirewall firewall delete rule name="${name}"`;

    return { apply, undo };
  }

  if (PLATFORM === "darwin") {
    const anchor = `mf-${rule.tag}`;

    const apply = `echo "block in proto ${protocol || "tcp"} from ${remoteIp} to any port ${remotePort}" | sudo pfctl -a ${anchor} -f -`;
    const undo = `sudo pfctl -a ${anchor} -F all`;

    return { apply, undo };
  }

  // Linux (iptables)
  const apply = `sudo iptables -A INPUT -p ${protocol || "tcp"} -s ${remoteIp} --dport ${remotePort} -j DROP`;
  const undo = `sudo iptables -D INPUT -p ${protocol || "tcp"} -s ${remoteIp} --dport ${remotePort} -j DROP`;

  return { apply, undo };
}
