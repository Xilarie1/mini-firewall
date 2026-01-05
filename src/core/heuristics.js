/**
 * Returns a threat score from 0–100 based on behavior.
 */
export function scoreConnection(conn) {
  let score = 0;

  if (conn.remotePort === 4444 || conn.remotePort === 1337) score += 30; // known backdoor ports
  if (conn.state === "SYN_SENT") score += 10;
  if (conn.processName && conn.processName.toLowerCase().includes("powershell"))
    score += 25;
  if (!conn.remoteIp || conn.remoteIp === "0.0.0.0") score += 15;

  return Math.min(score, 100);
}
