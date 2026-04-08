import bcrypt from 'bcryptjs';
import { parseCommaList, parseLoginSegment } from './envLists.js';

/**
 * Scanner (door-staff) logins come only from the environment (no hardcoded passwords).
 * SCANNER_USERNAMES and SCANNER_PASSWORDS: same count, comma-separated, same order.
 */
function buildScanners() {
  const rawUsers = parseCommaList(process.env.SCANNER_USERNAMES);
  const users = rawUsers.map(parseLoginSegment).filter(Boolean);
  const passes = parseCommaList(process.env.SCANNER_PASSWORDS);
  if (users.length === 0 || users.length !== passes.length) {
    return [];
  }
  return users.map((entry, i) => ({
    username: entry.username,
    passwordHash: bcrypt.hashSync(passes[i], 10),
  }));
}

const scanners = buildScanners();

export function findScannerByUsername(username) {
  return scanners.find((s) => s.username === username) || null;
}

export function verifyScannerPassword(scanner, plainPassword) {
  return bcrypt.compareSync(plainPassword, scanner.passwordHash);
}
