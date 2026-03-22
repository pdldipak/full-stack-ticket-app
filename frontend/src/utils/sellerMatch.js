/** Same seller as logged-in user (trim + case-insensitive). */
export function isSameSeller(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

/**
 * Edit/delete in the UI: own tickets; admin may change or remove any ticket (API enforces the same).
 */
export function canMutateTicket(soldBy, username, role, checkedIn) {
  if (role === 'admin') return true;
  if (checkedIn) return false;
  return isSameSeller(soldBy, username);
}
