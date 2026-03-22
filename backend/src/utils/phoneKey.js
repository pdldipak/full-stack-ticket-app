/**
 * Canonical key for comparing Swedish/international mobiles (digits; leading 0 → 46…).
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizePublicPhoneKey(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits.length) return '';
  if (digits.startsWith('46') && digits.length >= 10) return digits;
  if (digits.startsWith('0') && digits.length >= 9) return `46${digits.slice(1)}`;
  return digits;
}
