import { record, getCount } from "../state/offenderStore.js";

export function decide(ip, score) {
  const history = getCount(ip);
  const multiplier = history >= 3 ? 2 : 1;
  const finalScore = score * multiplier;

  let action = "allow";
  if (finalScore >= 100) action = "quarantine";
  else if (finalScore >= 70) action = "block";
  else if (finalScore >= 40) action = "alert";

  if (action !== "allow") record(ip);
  return action;
}
