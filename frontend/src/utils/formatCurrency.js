/**
 * Format amounts as Swedish kronor (SEK) for display.
 */
export function formatSek(value) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    return '—';
  }
  return n.toLocaleString('sv-SE', {
    style: 'currency',
    currency: 'SEK',
  });
}
