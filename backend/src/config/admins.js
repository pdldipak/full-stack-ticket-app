/**
 * Optional master admin: full seller API access, including edit/delete on any ticket.
 * Configure with ADMIN_USERNAME and ADMIN_PASSWORD in the environment (never commit).
 * If either variable is unset or empty, admin login is disabled.
 */
export function isAdminLoginConfigured() {
  const u = String(process.env.ADMIN_USERNAME || '').trim();
  const p = String(process.env.ADMIN_PASSWORD || '');
  return Boolean(u && p);
}

export function verifyAdminCredentials(inputUsername, inputPassword) {
  if (!isAdminLoginConfigured()) return false;
  const u = String(process.env.ADMIN_USERNAME || '').trim();
  const p = String(process.env.ADMIN_PASSWORD || '');
  return (
    String(inputUsername || '').trim() === u && String(inputPassword || '') === p
  );
}
