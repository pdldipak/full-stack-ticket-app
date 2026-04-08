import { PAYMENT_LABEL_PAID_TO_ORG_ACCOUNT } from '@src/config/eventConfig.js';

/** Keep `value` in sync with backend ENUM `paid_to` on tickets. */
export const PAID_TO_SELLER = 'seller';
export const PAID_TO_NRNA_NCC = 'nrna_ncc';

export const PAID_TO_OPTIONS = [
  { value: PAID_TO_SELLER, label: 'Seller' },
  { value: PAID_TO_NRNA_NCC, label: PAYMENT_LABEL_PAID_TO_ORG_ACCOUNT },
];

export function labelForPaidTo(value) {
  if (!value) return '—';
  const o = PAID_TO_OPTIONS.find((x) => x.value === value);
  return o ? o.label : value;
}
