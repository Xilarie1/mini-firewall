import { getConnectionSnapshot } from "./collector.js";
import { renderTable } from "../ui/cliTable.js";

/**
 * Evaluates firewall rules against a connection.
 * Placeholder for real rule logic — always returns false for now.
 *
 * @param {object} conn - A single connection entry
 * @returns {boolean} - Whether a rule matched this connection
 */
function evaluateRules(conn) {
  // TODO: Implement real rule matching later (IP, port, process name, etc.)
  return false;
}

/**
 * Continuously monitors active network connections, detects
 * new/closed connections, applies rules, and updates live CLI output.
 *
 * @param {object} options - { interval: number, dryRun: boolean, ... }
 */
export async function startMonitor(options = {}) {
  // How often to refresh the snapshot (default: 2 seconds)
  const intervalMs = options.interval || 2000;

  // Stores the previous cycle's connection map.
  // Used to detect newly opened or recently closed connections.
  let lastSnapshot = new Map();

  console.log("Starting live monitor...\n");

  // Infinite monitoring loop — executes once per interval
  while (true) {
    // ---------------------------------------------------------
    // 1. Fetch the latest list of active TCP connections
    // ---------------------------------------------------------
    const currentList = await getConnectionSnapshot();

    // ---------------------------------------------------------
    // 2. Convert array → Map for efficient comparison by ID
    //    Map key = unique connection ID created in collector.js
    // ---------------------------------------------------------
    const currentMap = new Map(currentList.map((c) => [c.id, c]));

    // ---------------------------------------------------------
    // 3. Determine which connections are NEW since last cycle
    // ---------------------------------------------------------
    const newConnections = [];
    currentMap.forEach((conn, id) => {
      if (!lastSnapshot.has(id)) {
        newConnections.push(conn);
      }
    });

    // ---------------------------------------------------------
    // 4. Determine which connections CLOSED since last cycle
    // ---------------------------------------------------------
    const closedConnections = [];
    lastSnapshot.forEach((conn, id) => {
      if (!currentMap.has(id)) {
        closedConnections.push(conn);
      }
    });

    // ---------------------------------------------------------
    // 5. Evaluate rules ONLY on new connections
    //    (better performance vs re-checking every cycle)
    // ---------------------------------------------------------
    newConnections.forEach((conn) => {
      conn.ruleHit = evaluateRules(conn);
    });

    // ---------------------------------------------------------
    // 6. Merge ruleHit into the full connection list
    // ---------------------------------------------------------
    const resultList = currentList.map((conn) => ({
      ...conn,
      ruleHit: conn.ruleHit || false,
    }));

    // ---------------------------------------------------------
    // 7. Clear console and redraw UI
    // ---------------------------------------------------------
    console.clear();
    console.log("mini-firewall - live monitor\n");

    renderTable(resultList);

    // Add summary information below the table
    console.log(`\nNew connections: ${newConnections.length}`);
    console.log(`Closed connections: ${closedConnections.length}`);

    // ---------------------------------------------------------
    // 8. Store the current map for comparison in next cycle
    // ---------------------------------------------------------
    lastSnapshot = currentMap;

    // ---------------------------------------------------------
    // 9. Sleep before repeating the loop
    // ---------------------------------------------------------
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
