import fs from "fs";

const TOR_NODES = fs
  .readFileSync("./src/intel/tor.txt", "utf8")
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

export function isTor(ip) {
  return TOR_NODES.includes(ip);
}

export function isBogon(ip) {
  return (
    ip.startsWith("0.") || ip.startsWith("127.") || ip.startsWith("169.254.")
  );
}
