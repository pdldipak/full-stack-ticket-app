import { verifyAdminCredentials } from '../config/admins.js';
import {
  findSellerByUsername,
  listSellerUsernames,
  verifySellerPassword,
} from '../config/sellers.js';
import { findScannerByUsername, verifyScannerPassword } from '../config/scanners.js';
import { getAllowedCitiesForSeller } from '../config/sellerCities.js';
import { ALLOWED_CITIES } from '../config/cities.js';
import { signToken } from '../utils/jwt.js';

export async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const u = String(username).trim();

  if (verifyAdminCredentials(u, password)) {
    const adminUser = String(process.env.ADMIN_USERNAME || '').trim();
    const token = signToken({ sub: adminUser, role: 'admin' });
    return res.json({
      token,
      username: adminUser,
      role: 'admin',
      allowedCities: [...ALLOWED_CITIES],
      sellerUsernames: listSellerUsernames(),
    });
  }

  const seller = findSellerByUsername(u);
  if (seller && verifySellerPassword(seller, password)) {
    const token = signToken({ sub: seller.username, role: 'seller' });
    const allowedCities = getAllowedCitiesForSeller(seller.username);
    return res.json({
      token,
      username: seller.username,
      role: 'seller',
      allowedCities,
    });
  }

  const scanner = findScannerByUsername(u);
  if (scanner && verifyScannerPassword(scanner, password)) {
    const token = signToken({ sub: scanner.username, role: 'scanner' });
    return res.json({
      token,
      username: scanner.username,
      role: 'scanner',
      allowedCities: [],
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}

export async function getMe(req, res) {
  if (req.user.role === 'scanner') {
    return res.json({
      username: req.user.username,
      role: 'scanner',
      allowedCities: [],
    });
  }

  if (req.user.role === 'admin') {
    return res.json({
      username: req.user.username,
      role: 'admin',
      allowedCities: [...ALLOWED_CITIES],
      sellerUsernames: listSellerUsernames(),
    });
  }

  const allowedCities = getAllowedCitiesForSeller(req.user.username);
  return res.json({
    username: req.user.username,
    role: 'seller',
    allowedCities,
  });
}
