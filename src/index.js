#!/usr/bin/env node
// The above "shebang" allows this file to be run directly as a CLI tool
// on Unix-like systems if the file has executable permissions.

// Import the Commander library for building command-line interfaces
import { program } from "commander";

// Import the collector function to retrieve network connections
import { getConnectionsSnapshot } from "./core/collector.js";

// Import the CLI table renderer to display connections nicely
import { renderTable } from "./ui/cliTable.js";

// Define a new CLI command called "start"
program
  .command("start")
  .description("Start mini-firewall and show snapshot") // Brief description for help
  .option("--dry-run", "Do not apply any rules", true) // CLI flag to indicate dry-run mode
  .action(async (opts) => {
    // This function executes when the "start" command is called

    console.log("mini-firewall starting..."); // Log startup message

    // Retrieve the current network connections snapshot
    // This is an async function returning an array of connection objects
    const connections = await getConnectionsSnapshot();

    // Render the connections snapshot in a table in the terminal
    // Uses cli-table3 formatting via renderTable()
    renderTable(connections);
  });

// Parse the command-line arguments and execute the matching command
// This is required to make Commander actually run the defined CLI commands
program.parse(process.argv);
