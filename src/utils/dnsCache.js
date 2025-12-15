import dns from "node:dns/promises";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const dnsCache = new Map();

/**
 * Reverse DNS lookup with in-memory TTL cache.
 * Returns cached result instantly, while refreshing asynchronously.
 */

export async function reverseLookup(ip) {
  const cached = dnsCache.get(ip);

  // If cached and fresh -> return immediately
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  // Otherwise: return fallback first, update async
  // fallback: previous result, or null
  if (cached) {
    refreshAsync(ip);
    return cached.value;
  }

  // No cache -> lookup async, but return null immediately
  dnsCache.set(ip, { value: null, expires: 0 });
  refreshAsync(ip);

  return null;
}

// Refresh DNS result asynchronously and update cache
async function refreshAsync(ip) {
  try {
    const result = await dns.reverse(ip);
    dnsCache.set(ip, {
      value: result[0] || null,
      expires: Date.now() + CACHE_TTL_MS,
    });
  } catch {
    dnsCache.set(ip, {
      value: null,
      expires: Date.now() + CACHE_TTL_MS,
    });
  }
}
