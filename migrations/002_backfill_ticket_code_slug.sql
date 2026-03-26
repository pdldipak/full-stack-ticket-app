-- =============================================================================
-- Optional: rewrite legacy ticket_code values (TKT-0001) to TKT-{slug}-0001
-- after you set TICKET_CODE_EVENT_SLUG (e.g. NY-2083) on the API.
--
-- Edit the slug below to match TICKET_CODE_EVENT_SLUG / backend/.env.
-- Only rows that match legacy pattern TKT- + digits are updated.
--
-- After this UPDATE, qr_image_base64 may still encode the OLD code until those
-- QR images are regenerated (new tickets created after the env fix include the
-- correct QR automatically).
-- =============================================================================

UPDATE tickets
SET ticket_code = CONCAT('TKT-', 'NY-2083', '-', LPAD(id, 4, '0'))
WHERE ticket_code REGEXP '^TKT-[0-9]+$';
