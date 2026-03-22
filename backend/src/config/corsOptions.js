/**
 * CORS: in development, reflect request origin. In production, allow only CORS_ORIGIN (comma-separated).
 */
export function getCorsOptions() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    return {
      origin: true,
      credentials: true,
    };
  }

  const allowed = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  };
}
