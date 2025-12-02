// src/core/collector.js

// Import systeminformation for cross-platform system data
import si from "systeminformation";
// Import exec to run shell/PowerShell commands
import { exec } from "child_process";
// Import util to promisify callback-based functions
import util from "util";

// Convert exec to return a promise so we can use async/await
const execAsync = util.promisify(exec);

/**
 * Parses a single line of PowerShell TCP connection output.
 * This is used as a fallback when systeminformation fails.
 *
 * @param {string} line - A single line from Get-NetTCPConnection output
 * @returns {object|null} - Returns a normalized connection object or null if invalid
 */
function parseConnectionLine(line) {
  // Skip empty or whitespace-only lines
  if (!line || !line.trim()) return null;

  // Split the line by whitespace
  const parts = line.trim().split(/\s+/);

  // PowerShell output should have 6 columns: LocalAddress LocalPort RemoteAddress RemotePort State OwningProcess
  if (parts.length < 6) return null;

  // Destructure the fields
  const [localIp, localPort, remoteIp, remotePort, state, pid] = parts;

  // Normalize values and provide safe defaults
  return {
    // Unique identifier for this connection (pid + addresses + ports + protocol)
    id: `${pid}|${localIp || "-"}|${localPort || 0}|${remoteIp || "-"}|${
      remotePort || 0
    }|tcp`,
    protocol: "tcp", // PowerShell only returns TCP connections here
    localIp: localIp || "-", // Default to "-" if missing
    localPort: Number(localPort) || 0, // Default to 0 if missing
    // Normalize remote IP for LISTEN sockets (:: or 0.0.0.0)
    remoteIp:
      remoteIp === "::" || remoteIp === "0.0.0.0" ? "-" : remoteIp || "-",
    remotePort: remotePort === "0" ? 0 : Number(remotePort) || 0,
    state, // Connection state (LISTEN, ESTABLISHED, TIME_WAIT, etc.)
    pid: Number(pid), // Owning process ID
    processName: null, // Will be populated later
    seenAt: Date.now(), // Timestamp when snapshot was taken
  };
}

/**
 * Returns a snapshot of current network connections.
 * Each connection is normalized into a consistent object structure.
 *
 * @returns {Promise<Array>} - Array of connection objects
 */
export async function getConnectionsSnapshot() {
  let connections = [];

  // 1️⃣ Attempt primary source: systeminformation.networkConnections()
  try {
    const netCons = await si.networkConnections();

    // Map the systeminformation output to our normalized model
    connections = netCons.map((c) => ({
      id: `${c.pid}|${c.localaddress}|${c.localport}|${c.peeraddress}|${c.peerport}|${c.protocol}`,
      protocol: c.protocol, // tcp | udp
      localIp: c.localaddress || "-",
      localPort: c.localport || 0,
      // Normalize LISTEN sockets with empty remote addresses
      remoteIp:
        c.peeraddress === "::" || c.peeraddress === "0.0.0.0"
          ? "-"
          : c.peeraddress || "-",
      remotePort: c.peerport || 0,
      state: c.state, // ESTABLISHED, LISTEN, TIME_WAIT, etc.
      pid: c.pid,
      processName: null, // Will resolve next
      seenAt: Date.now(),
    }));
  } catch (err) {
    // systeminformation failed (sometimes needs admin privileges)
    console.warn(
      "systeminformation.networkConnections() failed, falling back to PowerShell..."
    );
  }

  // 2️⃣ Fallback for Windows: PowerShell Get-NetTCPConnection
  if (connections.length === 0 && process.platform === "win32") {
    try {
      const { stdout } = await execAsync(
        "Get-NetTCPConnection | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess"
      );

      // Remove header lines from output and split into lines
      const lines = stdout.split("\n").slice(3);

      // Parse each line and add to the connections array
      for (const line of lines) {
        const parsed = parseConnectionLine(line);
        if (parsed) connections.push(parsed);
      }
    } catch (err) {
      console.error("Failed to get connections from PowerShell", err);
    }
  }

  // 3️⃣ Resolve process names from PID
  try {
    const processesData = await si.processes();
    const pidMap = new Map();

    // Build a map PID => process name
    processesData.list.forEach((p) => pidMap.set(p.pid, p.name));

    // Add processName to each connection
    connections = connections.map((c) => ({
      ...c,
      processName: pidMap.get(c.pid) || null,
    }));
  } catch (err) {
    console.warn("Failed to resolve process names:", err);
  }

  // Return the final array of normalized connection objects
  return connections;
}
