import fs from "fs";
import { atomicWrite } from "../utils/atomicWrite.js";

const PATH = "./src/state/rules.json";

function load() {
  if (!fs.existsSync(PATH)) return {};
  return JSON.parse(fs.readFileSync(PATH, "utf8"));
}

export function saveRule(rule) {
  const db = load();
  db[rule.id] = rule;
  atomicWrite(PATH, db);
}

export function removeRule(id) {
  const db = load();
  delete db[id];
  atomicWrite(PATH, db);
}

export function listRules() {
  return load();
}
