import si from "systeminformation";

const CACHE_TTL_MS = 10 * 60 * 1000;
const processCache = new Map();

/**
 * Gets process name for a PID with caching
 */
export async function getProcessName(pid) {
  const cached = processCache.get(pid);

  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const name = await lookupProcess(pid);

  processCache.set(pid, {
    value: name,
    expires: Date.now() + CACHE_TTL_MS,
  });
  return name;
}

// queries system for process info

async function lookupProcess(pid) {
  try {
    const list = await si.processes();
    const proc = list.list.find((p) => p.pid === pid);
    return proc ? proc.name : null;
  } catch {
    return null;
  }
}
