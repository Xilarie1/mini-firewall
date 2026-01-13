import fs from "fs";
import { atomicWrite } from "../utils/atomicWrite";

const PATH = "./src/state/events.json";

export function loadEvents() {
  if (!fs.existsSync(PATH)) return [];
  return JSON.parse(fs.readFileSync(PATH));
}

export function recordEvent(evt) {
  const list = loadEvents();
  list.push({ ...evt, time: Date.now() });
  atomicWrite(PATH, JSON.stringify(list, null, 2));
}
