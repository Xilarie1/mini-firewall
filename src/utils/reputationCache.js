const cache = new Map();
const TTL = 1000 * 60 * 60 * 24; // 24h

export function getCached(ip) {
  const e = cache.get(ip);
  if (!e) return null;
  if (Date.now() - e.time > TTL) {
    cache.delete(ip);
    return null;
  }
  return e.data;
}

export function setCached(ip, data) {
  cache.set(ip, { data, time: Date.now() });
}
