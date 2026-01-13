import { exec } from "child_process";

/**
 * Returns true if the system still has external connectivity.
 * Uses a simple ping to a known-good public resolver.
 */
export function checkHeartbeat() {
  return new Promise((resolve) => {
    exec("ping -n 1 1.1.1.1", (err) => {
      resolve(!err); // if ping fails → heartbeat failed
    });
  });
}
