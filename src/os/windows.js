// src/os/windows.js

/**
 * Builds a Windows Firewall (PowerShell) command
 * to block a remote IP for an outbound connection.
 *
 * IMPORTANT:
 * - This function ONLY returns a command string
 * - It does NOT execute anything
 *
 * @param {object} conn - Connection object
 * @param {object} rule - Matched rule
 * @returns {string} PowerShell command
 */
export function buildWindowsBlockCommand(conn, rule) {
  const ruleName = `mini-fw-block-${conn.remoteIp}`;

  // PowerShell New-NetFirewallRule command
  return `
New-NetFirewallRule \
-DisplayName "${ruleName}" \
-Direction Outbound \
-Action Block \
-RemoteAddress ${conn.remoteIp}
`.trim();
}
