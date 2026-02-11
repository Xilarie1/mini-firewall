// src/state/registry.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REG_PATH = path.join(__dirname, "../../registry.json");

let registry = [];

export function loadRegistry() {
  if (fs.existsSync(REG_PATH)) {
    registry = JSON.parse(fs.readFileSync(REG_PATH, "utf-8"));
  }
  return registry;
}

export function saveRegistry(data = registry) {
  registry = data;
  fs.writeFileSync(REG_PATH, JSON.stringify(registry, null, 2));
}

export function recordRule(entry) {
  registry.push(entry);
}
