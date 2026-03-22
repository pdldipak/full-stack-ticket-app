import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  try {
    const decoded = verifyToken(token);
    const username = String(decoded.sub || '').trim();
    let role = 'seller';
    if (decoded.role === 'scanner') role = 'scanner';
    else if (decoded.role === 'admin') role = 'admin';
    req.user = { username, role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireSeller(req, res, next) {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Seller access required' });
  }
  next();
}

export function requireSellerOrAdmin(req, res, next) {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Seller or admin access required' });
  }
  next();
}

export function requireScanner(req, res, next) {
  if (req.user.role !== 'scanner') {
    return res.status(403).json({ error: 'Scanner access required' });
  }
  next();
}
