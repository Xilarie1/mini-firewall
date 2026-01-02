import { runFirewallCommand } from "../os/runner.js";

export async function enforce(conn, rule, options) {
  if (rule.mode === "alert") {
    console.log("⚠️ ALERT:", conn.remoteIp);
    return;
  }

  if (rule.mode === "block") {
    const cmd = `netsh advfirewall firewall add rule name="mini-fw-${conn.remoteIp}" dir=out action=block remoteip=${conn.remoteIp}`;
    const undo = `netsh advfirewall firewall delete rule name="mini-fw-${conn.remoteIp}"`;

    await runFirewallCommand(
      cmd,
      {
        osCmd: { undo },
        ip: conn.remoteIp,
        type: "block",
      },
      options
    );
  }
}
