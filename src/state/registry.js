import fs from "fs";

const PATH = "./src/state/rules.json";

export function loadRegistry() {
  if (!fs.existsSync(PATH)) return [];
  return JSON.parse(fs.readFileSync(PATH));
}

export function registerRule(rule) {
  const list = loadRegistry();
  list.push({ ...rule, createdAt: Date.now() });
  fs.writeFileSync(PATH, JSON.stringify(list, null, 2));
}

export function clearRegistry() {
  fs.writeFileSync(PATH, "[]");
}
