import fs from "fs";

const PATH = "./src/state/offenders.json";

function load() {
  return JSON.parse(fs.readFileSync(PATH, "utf8"));
}
function save(data) {
  fs.writeFileSync(PATH, JSON.stringify(data, null, 2));
}

export function record(ip) {
  const db = load();
  db[ip] = (db[ip] || 0) + 1;
  save(db);
  return db[ip];
}

export function getCount(ip) {
  const db = load();
  return db[ip] || 0;
}
