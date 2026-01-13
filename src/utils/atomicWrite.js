import fs from "fs";

/**
 * Safely writes JSON to disk without corruption risk.
 * If the program crashes mid-write, the original file is preserved.
 */
export function atomicWrite(path, data) {
  const tmp = path + ".tmp";

  // Write to a temporary file first
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));

  // Then swap it over the real file atomically
  fs.renameSync(tmp, path);
}
