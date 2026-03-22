/**
 * Clamp non-negative integers for attendance counts (0–99 per category).
 */
function clampInt(v, def) {
  const n = Number.parseInt(String(v ?? ''), 10);
  if (Number.isNaN(n)) return def;
  return Math.max(0, Math.min(99, n));
}

/**
 * Reads adults / student / child from the request body; falls back to legacy `ticketCount` only.
 * @returns {{ countAdults: number, countStudent: number, countChild: number, ticketCount: number }}
 */
export function parseAttendanceFromBody(body) {
  const a = clampInt(body?.countAdults, 0);
  const s = clampInt(body?.countStudent, 0);
  const c = clampInt(body?.countChild, 0);
  let ticketCount = a + s + c;
  if (ticketCount === 0 && body?.ticketCount != null) {
    const legacy = clampInt(body.ticketCount, 0);
    if (legacy >= 1) {
      return { countAdults: legacy, countStudent: 0, countChild: 0, ticketCount: legacy };
    }
  }
  return { countAdults: a, countStudent: s, countChild: c, ticketCount };
}
