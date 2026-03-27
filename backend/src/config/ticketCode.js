/**
 * Ticket code format (default slug from ticketEventConfig.js):
 *   TKT-{slug}-{zeroPaddedId}  e.g. TKT-NY-2083-0001
 * Legacy only when TICKET_CODE_LEGACY=1:
 *   TKT-{zeroPaddedId}  e.g. TKT-0001
 */

import { DEFAULT_TICKET_CODE_EVENT_SLUG } from './ticketEventConfig.js';

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
  const num = String(Number(id) || 0).padStart(4, '0');
  if (process.env.TICKET_CODE_LEGACY === '1') {
    return `TKT-${num}`;
  }
  const raw = process.env.TICKET_CODE_EVENT_SLUG;
  const effective =
    raw != null && String(raw).trim() !== ''
      ? String(raw).trim()
      : DEFAULT_TICKET_CODE_EVENT_SLUG;
  const slug = sanitizeEventSlug(effective);
  if (!slug) {
    return `TKT-${num}`;
  }
  return `TKT-${slug}-${num}`;
}

/** One-line description for startup logs. */
export function getTicketCodeFormatLogLine() {
  if (process.env.TICKET_CODE_LEGACY === '1') {
    return 'legacy TKT-{nnnn} (TICKET_CODE_LEGACY=1)';
  }
  const raw = process.env.TICKET_CODE_EVENT_SLUG;
  const effective =
    raw != null && String(raw).trim() !== ''
      ? String(raw).trim()
      : DEFAULT_TICKET_CODE_EVENT_SLUG;
  const slug = sanitizeEventSlug(effective);
  return `TKT-${slug}-0001 … (slug ${JSON.stringify(slug)})`;
}
