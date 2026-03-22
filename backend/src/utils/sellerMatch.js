/** Compare seller usernames (trim + case-insensitive). */
export function isSameSeller(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}
