import { isSameSeller } from './sellerMatch.js';

/** Web order not yet confirmed by the assigned seller or an admin. */
export function pendingWebOrderVerification(ticket) {
  return ticket?.submissionSource === 'public' && !ticket?.verifiedAt;
}

export function canVerifyWebOrder(ticket, username, role) {
  if (!pendingWebOrderVerification(ticket)) return false;
  if (role === 'admin') return true;
  return isSameSeller(ticket.soldBy, username);
}
