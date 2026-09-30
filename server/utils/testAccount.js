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

/**
 * Accounts individually verified as automation, keyed by their COMPLETE address.
 *
 * These sit on domains the rules above cannot see, and widening the domain
 * rules to reach them is unsafe: `prepagent.com`, `prepagent.io`, `x.com` and
 * `prep.com` are all domains a genuine account could own, and
 * tests/leaderboardSolvedState.test.js explicitly pins `x@prepagent.com` as a
 * real user. Matching is therefore on the whole address — never a domain and
 * never a display-name pattern — so no other account on those domains is
 * affected and no real user can be caught by a future account on them.
 *
 * Evidence checked per account, 2026-09 stabilization pass:
 *   verify1786552358055@x.com  local part decodes to 2026-08-12T16:32:38.055Z
 *   verify1786552437197@x.com  local part decodes to 2026-08-12T16:33:57.197Z
 *   v1786556132890@x.com       local part decodes to 2026-08-12T17:35:32.890Z
 *   finalcheck_1787415068753@prepagent.com  decodes to 2026-08-22T16:11:08.753Z
 *       ... each landing within 1s of that account's own createdAt, which is
 *       only possible if the address was generated as Date.now() by a script.
 *   v31786556214121@x.com      name "V3", created 81s after v1786556132890@x.com
 *   apt_*@prepagent.com        names "Probe User" / "Apt Token User 1-3" /
 *                              "Apt Final User", 5 accounts in an 11-minute
 *                              burst on 2026-08-22 (70s-321s apart)
 *   finalcheck2/3/4@prep.com   names "Final2" / "Final3" / "Final4"; #4 carries
 *                              DSA submissions timestamped 2026-08-01, the same
 *                              manual acceptance-check session as Final2
 *   admin@prepagent.io         name "TestAdmin"
 */
const VERIFIED_AUTOMATION_ACCOUNTS = new Map([
  ['verify1786552358055@x.com', 'local part is Date.now(); within 1s of createdAt'],
  ['verify1786552437197@x.com', 'local part is Date.now(); within 1s of createdAt'],
  ['v1786556132890@x.com', 'local part is Date.now(); within 1s of createdAt'],
  ['v31786556214121@x.com', 'name "V3", created 81s after the v1786556132890 script account'],
  ['apt_1136327@prepagent.com', 'name "Probe User"; scripted aptitude probe'],
  ['apttok_6494077@prepagent.com', 'name "Apt Token User"; scripted token test'],
  ['apttok2_3591882@prepagent.com', 'name "Apt Token User 2"; scripted token test'],
  ['apttok3_8683502@prepagent.com', 'name "Apt Token User 3"; scripted token test'],
  ['aptfinal_6019783@prepagent.com', 'name "Apt Final User"; scripted acceptance check'],
  ['finalcheck_1787415068753@prepagent.com', 'local part is Date.now(); within 1s of createdAt'],
  ['finalcheck2@prep.com', 'name "Final2"; manual acceptance-check series'],
  ['finalcheck3@prep.com', 'name "Final3"; manual acceptance-check series'],
  ['finalcheck4@prep.com', 'name "Final4"; carries DSA submissions from that series'],
  ['admin@prepagent.io', 'name "TestAdmin"'],
]);

/** Normalised full address for exact-match lookups. */
function normalizeAddress(email) {
  return String(email || '').trim().toLowerCase();
}

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

/**
 * Reason string for reporting, or null when the account looks genuine.
 *
 * This is the auditing path used by scripts/flagTestAccounts.js, so it is
 * strictly wider than isTestEmail: it also reports the individually verified
 * automation accounts above, which sit on domains no domain rule may claim.
 */
function testAccountReason(user) {
  const verified = VERIFIED_AUTOMATION_ACCOUNTS.get(normalizeAddress(user && user.email));
  if (verified) return `verified automation account: ${verified}`;
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
  VERIFIED_AUTOMATION_ACCOUNTS,
  domainOf,
  registrableDomain,
  isTestEmail,
  testAccountReason,
};
