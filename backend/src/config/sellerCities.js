/**
 * Which seller accounts may create/edit tickets for which cities.
 * Each value is an array — list one city or several, e.g. ['Stockholm', 'Gothenburg'].
 */
export const SELLER_ALLOWED_CITIES = {
  seller1: ['Stockholm'],
  seller2: ['Stockholm'],
  seller3: ['Stockholm'],
  seller4: ['Stockholm'],
  seller5: ['Gothenburg'],
  seller6: ['Gothenburg'],
  seller7: ['Gothenburg'],
  seller8: ['Gothenburg'],
  seller9: ['Stockholm', 'Gothenburg'],
  seller10: ['Stockholm', 'Gothenburg'],
  
};

export function getAllowedCitiesForSeller(username) {
  const u = String(username || '').trim();
  return SELLER_ALLOWED_CITIES[u] || [];
}

export function sellerMayUseCity(username, city) {
  const c = String(city || '').trim();
  return getAllowedCitiesForSeller(username).includes(c);
}
