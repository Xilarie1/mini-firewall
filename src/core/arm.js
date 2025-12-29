/**
 * Safety interlock — prevents accidental system lockout.
 * Enforcement can only occur if BOTH flags are present.
 */
export function isArmed(options = {}) {
  return options.apply === true && options.confirm === true;
}
