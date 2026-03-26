/**
 * Ticket code format when TICKET_CODE_EVENT_SLUG is set:
 *   TKT-{slug}-{zeroPaddedId}  e.g. TKT-NY-2083-0001
 * When unset or empty, legacy format:
 *   TKT-{zeroPaddedId}  e.g. TKT-0001
 */

function sanitizeEventSlug(raw) {
  if (raw == null) return '';
  return String(raw)
    .trim()
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    // Must fit in ticket_code VARCHAR(32): TKT-{slug}-{dddd} → slug max 22 chars
    .slice(0, 22);
}

export function buildTicketCodeForId(id) {
  const slug = sanitizeEventSlug(process.env.TICKET_CODE_EVENT_SLUG);
  const num = String(Number(id) || 0).padStart(4, '0');
  if (!slug) {
    return `TKT-${num}`;
  }
  return `TKT-${slug}-${num}`;
}
