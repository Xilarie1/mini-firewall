import { isTor, isBogon } from "../intel/localIntel.js";
import { getCached, setCached } from "../utils/reputationCache.js";

/**
 * Returns reputation context for an IP.
 */
export function getReputation(ip) {
  const cached = getCached(ip);
  if (cached) return cached;

  const rep = {
    tor: isTor(ip),
    bogon: isBogon(ip),
    knownBad: false, // later feeds plug here
    risk: 0,
  };

  if (rep.tor) rep.risk += 35;
  if (rep.bogon) rep.risk += 25;

  setCached(ip, rep);
  return rep;
}
