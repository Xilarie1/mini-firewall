// src/rules/cli.js

import { Command } from "commander";
import {
  addRule,
  listRules,
  promoteRule,
  deactivateRule,
  rollbackRule,
  getRuleStats,
} from "./store.js";

export function registerRuleCLI(program) {
  const rules = program.command("rules").description("Rule lifecycle controls");

  rules
    .command("add")
    .requiredOption("--tag <tag>")
    .option("--process <name>")
    .option("--remote-ip <ip>")
    .option("--remote-port <port>")
    .option("--protocol <proto>")
    .description("Add a temporary firewall rule")
    .action((opts) => addRule(opts));

  rules
    .command("list")
    .description("List all rules")
    .action(() => console.table(listRules()));

  rules
    .command("promote <tag>")
    .description("Make a rule permanent")
    .action((tag) => promoteRule(tag));

  rules
    .command("expire <tag>")
    .description("Disable a rule")
    .action((tag) => deactivateRule(tag));

  rules
    .command("rollback <tag>")
    .description("Rollback a rule")
    .action((tag) => rollbackRule(tag));

  rules
    .command("stats <tag>")
    .description("Show rule health")
    .action((tag) => console.table(getRuleStats(tag)));
}
