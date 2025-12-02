// Import the CLI table library for nicely formatted console tables
import Table from "cli-table3";

// Import Chalk for colored output in the terminal
import chalk from "chalk";

/**
 * Renders a snapshot of network connections in a CLI table.
 *
 * @param {Array} connections - Array of connection objects from collector
 * @param {Object} options - Optional settings (not used yet, placeholder for future)
 */
export function renderTable(connections, options = {}) {
  // Create a new table with headers, column widths, and word wrapping
  const table = new Table({
    head: ["PID", "Process", "Local", "Remote", "State", "Age(s)", "RuleHit"],
    colWidths: [8, 20, 22, 22, 15, 10, 10], // Fixed width for each column
    wordWrap: true, // Wrap long content instead of breaking layout
  });

  // Capture current time for computing "Age" of each connection
  const now = Date.now();

  // Iterate over each connection and push a row into the table
  connections.forEach((conn) => {
    // Age in seconds, rounded to 1 decimal place
    const age = ((now - conn.seenAt) / 1000).toFixed(1);

    // Push a row into the table
    table.push([
      conn.pid, // PID of the owning process
      conn.processName || "-", // Process name or placeholder if null
      `${conn.localIp}:${conn.localPort}`, // Local address:port
      `${conn.remoteIp}:${conn.remotePort}`, // Remote address:port
      conn.state, // Connection state (LISTEN, ESTABLISHED, etc.)
      age, // Age in seconds since snapshot
      // If a rule was hit, show "YES" in red, otherwise "-"
      conn.ruleHit ? chalk.red("YES") : "-",
    ]);
  });

  // Output the table to the console
  console.log(table.toString());
}
