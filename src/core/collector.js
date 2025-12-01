import si from "systeminformation";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

function parseConnectionLine(line) {
  if (!line || !line.trim()) return null;

  const parts = line.trim().split(/\s+/);
  if (parts.length < 6) return null;

  const [localIp, localPort, remoteIp, remotePort, state, pid] = parts;

  return {
    id: `${pid}|${localIp}|${localPort}|${remoteIp}|${remotePort}|tcp`,
    protocol: "tcp",
    localIp,
    localPort: Number(localPort),
    remoteIp,
    remotePort: Number(remotePort),
    state,
    pid: Number(pid),
    processName: null,
    seenAt: Date.now(),
  };
}

export async function getConnectionSnapshot() {
  let connections = [];

  try {
    const netCons = await si.networkConnections();
    connections = netCons.map((c) => ({
      id: `${c.pid}|${c.localaddress}|${c.localport}|${c.peeraddress}|${c.peerport}|${c.protocol}`,
      protocol: c.protocol,
      localIp: c.protocol,
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

  if (connections.length === 0 && process.platform === "win32") {
    try {
      const { stdout } = await execAsync(
        "Get-NetTCPConnection | Select-Object LocalAdress, LocalPort,RemoteAdress,RemotePort,State,OwningProcess"
      );
      const lines = stdout.split("\n").slice(3);
      for (const line of lines) {
        const parsed = parseConnectionLine(line);
        if (parsed) connections.push(parsed);
      }
    } catch (err) {
      console.error("Failed to get connections from PowerShell", err);
    }
  }

  try {
    const processesData = await si.processes();
    const pidMap = new Map();
    processesData.list.forEach((p) => pidMap.set(p.pid, p.name));

    connections = connections.map((c) => ({
      ...c,
      procesesName: pidMap.get(c.pid) || null,
    }));
  } catch (err) {
    console.warn("Failed to resolve process names:", err);
  }
  return connections;
}
