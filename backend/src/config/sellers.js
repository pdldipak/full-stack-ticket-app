import bcrypt from 'bcryptjs';
import { parseCommaList } from './envLists.js';

/**
 * Seller logins come only from the environment (no hardcoded passwords).
 * SELLER_USERNAMES and SELLER_PASSWORDS: same count, comma-separated, same order.
 * Usernames must match keys in sellerCities.js (SELLER_ALLOWED_CITIES).
 */
function buildSellers() {
  const users = parseCommaList(process.env.SELLER_USERNAMES);
  const passes = parseCommaList(process.env.SELLER_PASSWORDS);
  if (users.length === 0 || users.length !== passes.length) {
    return [];
  }
  return users.map((username, i) => ({
    username,
    passwordHash: bcrypt.hashSync(passes[i], 10),
  }));
}

const sellers = buildSellers();

export function listSellerUsernames() {
  return sellers.map((s) => s.username);
}

export function findSellerByUsername(username) {
  return sellers.find((s) => s.username === username) || null;
}

export function verifySellerPassword(seller, plainPassword) {
  return bcrypt.compareSync(plainPassword, seller.passwordHash);
}
