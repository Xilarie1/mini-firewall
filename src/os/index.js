// src/os/index.js

import { buildWindowsBlockCommand } from "./windows.js";
import { buildLinuxBlockCommand } from "./linux.js";

/**
 * Returns an OS-specific firewall command string
 * based on the current platform.
 */
export function buildBlockCommand(conn, rule) {
  if (process.platform === "win32") {
    return buildWindowsBlockCommand(conn, rule);
  }

  if (process.platform === "linux") {
    return buildLinuxBlockCommand(conn, rule);
  }

  throw new Error("Unsupported OS for firewall commands");
}
