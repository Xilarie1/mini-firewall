// Import the 'systeminformation' library to get system-level information
import si from "systeminformation";
// Import 'exec' from child_process to run shell commands
import { exec } from "child_process";
// Import 'util' to use promisify, which converts callback-based functions into promises
import util from "util";
// Promisify exec so we can use async/await syntax with it
const execAsync = util.promisify(exec);
/**
 * Parses a line from the PowerShell TCP connection output
 * @param {string} line - A line of text representing a network connection
 * @returns {object|null} - Returns a connection object or null if the line is invalid
 */
function parseConnectionLine(line) {
  if (!line || !line.trim()) return null; // Skip empty or whitespace-only lines
  // Split line by whitespace
  const parts = line.trim().split(/\s+/);
  // If line has fewer than 6 parts, it's invalid
  if (parts.length < 6) return null;
  // Destructure relevant parts
  const [localIp, localPort, remoteIp, remotePort, state, pid] = parts;
  // Return a formatted connection object
  return {
    id: `${pid}|${localIp}|${localPort}|${remoteIp}|${remotePort}|tcp`,
    protocol: "tcp",
    localIp,
    localPort: Number(localPort),
    remoteIp,
    remotePort: Number(remotePort),
    state,
    pid: Number(pid),
    processName: null, // Placeholder to be filled later
    seenAt: Date.now(), // Timestamp of when the connection was seen
  };
}
/**
 * Retrieves a snapshot of all current TCP connections
 * @returns {Promise<Array>} - Array of connection objects
 */
export async function getConnectionSnapshot() {
  let connections = [];
  try {
    // Attempt to get network connections using systeminformation library
    const netCons = await si.networkConnections();
    // Map each connection to a standardized format
    connections = netCons.map((c) => ({
      id: `${c.pid}|${c.localaddress}|${c.localport}|${c.peeraddress}|${c.peerport}|${c.protocol}`,
      protocol: c.protocol,
      localIp: c.localaddress,
      localPort: c.localport,
      remoteIp: c.peeraddress,
      remotePort: c.peerport,
      state: c.state,
      pid: c.pid,
      processName: null,
      seenAt: Date.now(),
    }));
  } catch (err) {
    console.warn(
      "systeminformation.networkConnections() failed, falling back to PowerShell..."
    );
  }
  // Fallback for Windows if systeminformation fails
  if (connections.length === 0 && process.platform === "win32") {
    try {
      const { stdout } = await execAsync(
        // PowerShell command to list TCP connections
        "Get-NetTCPConnection | Select-Object LocalAdress, LocalPort,RemoteAdress,RemotePort,State,OwningProcess"
      );
      // Skip header lines and split remaining lines
      const lines = stdout.split("\n").slice(3);
      // Parse each line and add to connections array
      for (const line of lines) {
        const parsed = parseConnectionLine(line);
        if (parsed) connections.push(parsed);
      }
    } catch (err) {
      console.error("Failed to get connections from PowerShell", err);
    }
  }
  try {
    // Fetch all running processes
    const processesData = await si.processes();
    const pidMap = new Map();
    // Map PIDs to process names
    processesData.list.forEach((p) => pidMap.set(p.pid, p.name));
    // Add process names to each connection object
    connections = connections.map((c) => ({
      ...c,
      processName: pidMap.get(c.pid) || null,
    }));
  } catch (err) {
    console.warn("Failed to resolve process names:", err);
  }
  // Return the final array of connections
  return connections;
}
