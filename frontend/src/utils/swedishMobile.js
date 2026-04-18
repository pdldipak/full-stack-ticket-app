/**
 * Strips spaces, dashes, and parentheses for Swedish mobile validation.
 * @param {string} value
 * @returns {string}
 */
export function normalizeSwedishMobileInput(value) {
  return String(value ?? '').replace(/[\s\-().]/g, '');
}

/**
 * True if the value is a Swedish mobile in common formats:
 * - 0701234567 (10 digits, leading 0)
 * - +46701234567 or 46701234567
 * - 0046701234567
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidSwedishMobile(value) {
  const n = normalizeSwedishMobileInput(value);
  if (/^07\d{8}$/.test(n)) return true;
  if (/^\+?467\d{8}$/.test(n)) return true;
  if (/^00467\d{8}$/.test(n)) return true;
  return false;
}
