/**
 * testAccount.js
 * ---------------------------------------------------------------------------
 * How PrepAgent decides that an account is an automated test account, so test
 * traffic cannot pollute the public leaderboard.
 *
 * DESIGN GOALS
 *  1. Prevent test data from ENTERING production, not just hide it later.
 *     `authController.register` stamps the flag at account creation.
 *  2. Never hide a genuine user. The rule keys off a property of the ADDRESS
 *     (its domain), never off a display name, so a real student who happens to
 *     be called "Verify User" is never affected.
 *  3. Be auditable. `scripts/flagTestAccounts.js` prints the full evidence
 *     table (domain -> account count) and is a dry run unless `--apply` is
 *     passed.
 *
 * WHY DOMAINS
 *  `example.com` / `example.org` / `example.net` are reserved by RFC 2606 and
 *  the `.test` TLD is reserved by RFC 6761: no real person can own them, so an
 *  account on one of those is an automation account by construction.
 *  `test.com` and `t.com` are NOT reserved, but every account on them in this
 *  deployment was created by the repository's own end-to-end scripts
 *  ("Smoke User", "Sol Check", "E2E", "Err", ...). They are listed separately
 *  in OBSERVED_AUTOMATION_DOMAINS so the evidence behind each entry is
 *  explicit and reviewable rather than implied.
 *
 * ESCAPE HATCH
 *  An operator can always mark an account by hand (`isTestAccount: true` in the
 *  database, or the admin route) regardless of its domain.
 * ---------------------------------------------------------------------------
 */

/** Reserved by RFC 2606 / RFC 6761 — provably cannot belong to a real user. */
const RESERVED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'localhost',
]);

/**
 * Non-reserved domains that, in this deployment, hold only accounts created by
 * the repository's automated E2E / smoke scripts. Listed explicitly so the
 * decision is reviewable; extend deliberately, never by pattern-matching a
 * display name.
 */
const OBSERVED_AUTOMATION_DOMAINS = new Set([
  'test.com',
  't.com',
]);

/** Domains that must never be treated as test accounts, whatever else matches. */
const PROTECTED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
]);

function domainOf(email) {
  const value = String(email || '').trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at === -1) return '';
  return value.slice(at + 1);
}

/**
 * @returns {boolean} true when the address cannot belong to a genuine user
 *
 * Subdomains are resolved to their registrable domain first, so
 * `ci@build.example.com` is treated like `ci@example.com`.
 */
function isTestEmail(email) {
  const domain = registrableDomain(domainOf(email));
  if (!domain) return false;
  if (PROTECTED_EMAIL_DOMAINS.has(domain)) return false;
  if (domain.endsWith('.test')) return true;
  if (RESERVED_EMAIL_DOMAINS.has(domain)) return true;
  return OBSERVED_AUTOMATION_DOMAINS.has(domain);
}

/** Strip leading sub-domains: `a.b.example.com` -> `example.com`. */
function registrableDomain(domain) {
  if (!domain) return '';
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  return parts.slice(-2).join('.');
}

/** Reason string for reporting, or null when the account looks genuine. */
function testAccountReason(user) {
  const domain = registrableDomain(domainOf(user && user.email));
  if (!domain) return 'no email domain';
  if (PROTECTED_EMAIL_DOMAINS.has(domain)) return null;
  if (domain.endsWith('.test')) return 'RFC 6761 reserved .test domain';
  if (RESERVED_EMAIL_DOMAINS.has(domain)) return 'RFC 2606 reserved example domain';
  if (OBSERVED_AUTOMATION_DOMAINS.has(domain)) return 'domain used only by automated E2E runs in this deployment';
  return null;
}

module.exports = {
  RESERVED_EMAIL_DOMAINS,
  OBSERVED_AUTOMATION_DOMAINS,
  PROTECTED_EMAIL_DOMAINS,
  domainOf,
  registrableDomain,
  isTestEmail,
  testAccountReason,
};
