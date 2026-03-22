/**
 * Parse comma-separated env values (no commas inside a single password — use strong passwords without commas).
 */
export function parseCommaList(raw) {
  if (raw == null || String(raw).trim() === '') {
    return [];
  }
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
