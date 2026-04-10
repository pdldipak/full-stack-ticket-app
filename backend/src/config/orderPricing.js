/**
 * Public web order page — amounts in SEK (must match frontend `constants/orderPricing.js`).
 */
export const ORDER_ADULT_PRICE_SEK = 250;
export const ORDER_STUDENT_PRICE_SEK = 250;
export const ORDER_CHILD_PRICE_SEK = 0;

export function computePublicOrderTotalSek(countAdults, countStudent, countChild) {
  const a = Number(countAdults) || 0;
  const s = Number(countStudent) || 0;
  const c = Number(countChild) || 0;
  return a * ORDER_ADULT_PRICE_SEK + s * ORDER_STUDENT_PRICE_SEK + c * ORDER_CHILD_PRICE_SEK;
}
