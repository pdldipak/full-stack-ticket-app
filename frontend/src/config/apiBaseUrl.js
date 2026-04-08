/**
 * API base URL for axios.
 *
 * - Development: leave VITE_API_URL unset so requests stay same-origin and Vite’s proxy (vite.config.js) forwards to the API.
 * - Production: set VITE_API_URL in the **build** environment for whatever host you use (Netlify, Vercel, Docker/nginx, etc.).
 *   Use a dedicated API prefix (e.g. /api on Netlify, or https://api.example.com) so routes like /tickets are only SPA URLs.
 */
export function resolveApiBaseUrl() {
  const env = import.meta.env.VITE_API_URL;
  if (typeof env === 'string' && env.trim() !== '') {
    return env.trim();
  }
  return '';
}
