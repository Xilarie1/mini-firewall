#!/usr/bin/env node
// The shebang allows this file to be executed as a standalone CLI program
// on Unix-like systems (Linux/macOS). When marked as executable, a user
// can run `./index.js` directly without calling `node` manually.

// Commander is a small framework for building CLI tools. It handles
// parsing commands, options, help text, and dispatching actions.
import { program } from "commander";

// Retrieves a one-time snapshot of active network connections.
// This is used for the basic "view only" mode.
import { getConnectionsSnapshot } from "./core/collector.js";

// Renders connection data in a terminal-friendly table format.
// This does not modify connections — it only formats them for output.
import { renderTable } from "./ui/cliTable.js";

// Starts the continuous live monitor (phase 3).
// Not used in the simple snapshot command yet, but imported for later use.
import { startMonitor } from "./core/monitor.js";

import { evaluateConnection } from "../rules/engine.js";
import { rollbackAll } from "./core/rollback.js";
import { startGuardian } from "./core/guardian.js";
import { startMonitor } from "./core/monitor.js";

startGuardian();

// Define the CLI command: "start"
// This appears as `mini-firewall start` when the package is installed globally.
// Each `.command()` block registers one runnable operation.
program
  .command("start")
  .description("Start mini-firewall and show snapshot") // Displayed in --help
  .option(
    "--dry-run",
    "Do not apply any rules (rules are evaluated but not enforced)",
    true
  )
  .action(async (opts) => {
    // This function runs when the user executes:
    //     mini-firewall start

    console.log("mini-firewall starting...");

    // Fetch the current list of TCP connections from the system.
    // The collector normalizes platform output into a consistent structure.
    const connections = await getConnectionsSnapshot();

    // Render the collected data as a formatted table.
    // By default this shows: PID, process name, local/remote address, etc.
    renderTable(connections);
  });

// Commander reads `process.argv`, matches commands and flags,
// and executes the associated `.action()` blocks.
// Without this call, the CLI would not respond to user input.
program.parse(process.argv);

newConnections.forEach((conn) => {
  const result = evaluateConnection(conn);
  conn.ruleHit = result.hit;
  conn.matchedRule = result.rule;
});

program
  .command("rollback")
  .description("Undo all firewall rules created by mini-firewall")
  .action(async () => {
    await rollbackAll();
  });
