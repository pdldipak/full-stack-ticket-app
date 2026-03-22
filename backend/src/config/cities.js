/** Allowed program cities (venues). */
export const ALLOWED_CITIES = ['Stockholm', 'Gothenburg'];

export function isAllowedCity(value) {
  return ALLOWED_CITIES.includes(String(value || '').trim());
}
