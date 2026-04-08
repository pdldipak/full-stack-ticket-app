import bcrypt from 'bcryptjs';
import { parseCommaList, parseLoginSegment } from './envLists.js';

/**
 * Seller logins come only from the environment (no hardcoded passwords).
 * SELLER_USERNAMES and SELLER_PASSWORDS: same count, comma-separated, same order.
 * SELLER_USERNAMES entries may be `seller1` or `seller1:Rajendra`.
 * Usernames must match keys in sellerCities.js (SELLER_ALLOWED_CITIES).
 */
function buildSellers() {
  const rawUsers = parseCommaList(process.env.SELLER_USERNAMES);
  const users = rawUsers.map(parseLoginSegment).filter(Boolean);
  const passes = parseCommaList(process.env.SELLER_PASSWORDS);
  if (users.length === 0 || users.length !== passes.length) {
    return [];
  }
  return users.map((entry, i) => ({
    username: entry.username,
    displayName: entry.displayLabel || '',
    passwordHash: bcrypt.hashSync(passes[i], 10),
  }));
}

const sellers = buildSellers();

export function listSellerUsernames() {
  return sellers.map((s) => s.username);
}

export function listSellersForPublic() {
  return sellers.map((s) => ({
    username: s.username,
    displayName: s.displayName || '',
  }));
}

export function findSellerByUsername(username) {
  return sellers.find((s) => s.username === username) || null;
}

export function verifySellerPassword(seller, plainPassword) {
  return bcrypt.compareSync(plainPassword, seller.passwordHash);
}
