// src/os/linux.js

/**
 * Builds an iptables command to block outbound traffic
 * to a specific remote IP.
 *
 * DRY-RUN ONLY — returns command string.
 *
 * @param {object} conn - Connection object
 * @param {object} rule - Matched rule
 * @returns {string} iptables command
 */
export function buildLinuxBlockCommand(conn, rule) {
  return `iptables -A OUTPUT -d ${conn.remoteIp} -j DROP`;
}
