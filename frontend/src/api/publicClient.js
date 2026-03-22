import axios from 'axios';

/**
 * Public (unauthenticated) API — no Authorization header, no cookies sent with cross-origin requests.
 * Use for /public/* from the order page so seller JWT is not attached.
 */
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export default publicApi;
