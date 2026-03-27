/**
 * Default middle segment for ticket codes: TKT-{slug}-{id}.
 * Keep in sync with frontend `src/config/eventConfig.js` → `TICKET_CODE_EVENT_SLUG`.
 *
 * Env `TICKET_CODE_EVENT_SLUG` overrides this when set (non-empty).
 * Env `TICKET_CODE_LEGACY=1` forces legacy codes `TKT-{nnnn}` only (no slug).
 */
export const DEFAULT_TICKET_CODE_EVENT_SLUG = 'NY-2083';
