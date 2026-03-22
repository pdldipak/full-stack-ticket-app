import bcrypt from 'bcryptjs';
import { parseCommaList } from './envLists.js';

/**
 * Scanner (door-staff) logins come only from the environment (no hardcoded passwords).
 * SCANNER_USERNAMES and SCANNER_PASSWORDS: same count, comma-separated, same order.
 */
function buildScanners() {
  const users = parseCommaList(process.env.SCANNER_USERNAMES);
  const passes = parseCommaList(process.env.SCANNER_PASSWORDS);
  if (users.length === 0 || users.length !== passes.length) {
    return [];
  }
  return users.map((username, i) => ({
    username,
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
