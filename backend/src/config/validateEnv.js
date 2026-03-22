import { parseCommaList } from './envLists.js';

/**
 * Fail fast on misconfiguration in production.
 */
export function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  if (isProd) {
    const jwt = process.env.JWT_SECRET || '';
    if (jwt.length < 32) {
      throw new Error(
        'JWT_SECRET must be set and at least 32 characters long in production'
      );
    }

    const cors = (process.env.CORS_ORIGIN || '').trim();
    if (!cors) {
      throw new Error(
        'CORS_ORIGIN must be set in production (comma-separated allowed origins)'
      );
    }

    const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASSWORD'];
    for (const key of required) {
      if (!(process.env[key] || '').trim()) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    const sellerUsers = parseCommaList(process.env.SELLER_USERNAMES);
    const sellerPasses = parseCommaList(process.env.SELLER_PASSWORDS);
    if (
      sellerUsers.length === 0 ||
      sellerPasses.length === 0 ||
      sellerUsers.length !== sellerPasses.length
    ) {
      throw new Error(
        'SELLER_USERNAMES and SELLER_PASSWORDS must be set in production with the same number of comma-separated values'
      );
    }

    const scannerUsers = parseCommaList(process.env.SCANNER_USERNAMES);
    const scannerPasses = parseCommaList(process.env.SCANNER_PASSWORDS);
    if (
      scannerUsers.length === 0 ||
      scannerPasses.length === 0 ||
      scannerUsers.length !== scannerPasses.length
    ) {
      throw new Error(
        'SCANNER_USERNAMES and SCANNER_PASSWORDS must be set in production with the same number of comma-separated values'
      );
    }

    const adminUser = (process.env.ADMIN_USERNAME || '').trim();
    const adminPass = String(process.env.ADMIN_PASSWORD || '');
    const adminPartial =
      (adminUser && !adminPass) || (!adminUser && adminPass);
    if (adminPartial) {
      throw new Error(
        'ADMIN_USERNAME and ADMIN_PASSWORD must both be set or both be empty in production'
      );
    }
  }
}
