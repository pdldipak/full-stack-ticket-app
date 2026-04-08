import axios from 'axios';
import { resolveApiBaseUrl } from '@src/config/apiBaseUrl.js';

/**
 * Public (unauthenticated) API — no Authorization header, no cookies sent with cross-origin requests.
 * Use for /public/* from the order page so seller JWT is not attached.
 */
const publicApi = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export default publicApi;
