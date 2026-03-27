/**
 * Must be imported before any module that reads process.env at load time (e.g. sellers.js).
 * ES modules hoist imports, so dotenv cannot run after other imports in app.js.
 */
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Do not use override: true — it would replace Docker / injected env (e.g. TICKET_CODE_EVENT_SLUG)
// with backend/.env and truncate slugs like NY-2083 to a wrong value.
dotenv.config({ path: join(__dirname, '../.env') });
