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

/**
 * Parse one login segment in form `username` or `username:displayLabel`.
 * Only the first colon splits the segment.
 */
export function parseLoginSegment(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const idx = s.indexOf(':');
  if (idx === -1) {
    return { username: s, displayLabel: '' };
  }
  return {
    username: s.slice(0, idx).trim(),
    displayLabel: s.slice(idx + 1).trim(),
  };
}
