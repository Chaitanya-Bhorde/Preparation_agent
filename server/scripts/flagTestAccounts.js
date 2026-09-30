/**
 * flagTestAccounts.js
 * ---------------------------------------------------------------------------
 * Marks automated E2E / smoke-test accounts with `isTestAccount: true` so they
 * are excluded from the public leaderboards (see utils/testAccount.js).
 *
 * SAFETY CONTRACT
 *   - DRY RUN by default. Nothing is written unless you pass `--apply`.
 *   - Only ever writes ONE boolean field on the `users` collection.
 *   - Performs NO deletes, NO reseeds and NO updates to any other collection.
 *   - Prints the full evidence table and every account it would touch, so the
 *     decision is reviewable before and after.
 *   - `--revert` clears the flag only on the accounts this script flagged,
 *     which is why the match is recomputed rather than remembered.
 *
 * USAGE
 *   node scripts/flagTestAccounts.js            # report only
 *   node scripts/flagTestAccounts.js --apply    # set the flag
 *   node scripts/flagTestAccounts.js --revert   # clear the flag
 * ---------------------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { testAccountReason, domainOf } = require('../utils/testAccount');

async function main() {
  const apply = process.argv.includes('--apply');
  const revert = process.argv.includes('--revert');
  if (apply && revert) {
    console.error('Choose either --apply or --revert, not both.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 });

  const users = await User.find({}).select('name email isTestAccount stats').lean();

  const byDomain = new Map();
  users.forEach((u) => {
    const d = domainOf(u.email) || '(none)';
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d).push(u);
  });

  console.log('=== ACCOUNTS BY EMAIL DOMAIN ===');
  [...byDomain.keys()].sort().forEach((d) => {
    const list = byDomain.get(d);
    const flagged = list.filter((u) => u.isTestAccount).length;
    console.log(`${d.padEnd(18)} total=${String(list.length).padStart(3)}  flagged=${flagged}  e.g. ${list.slice(0, 4).map((u) => u.name).join(', ')}`);
  });

  const matched = users.filter((u) => testAccountReason(u));
  const untouched = users.filter((u) => !testAccountReason(u));

  console.log(`\n=== MATCHED AS TEST ACCOUNTS (${matched.length}) ===`);
  matched.forEach((u) => {
    console.log(`  ${u._id}  ${String(u.name).padEnd(28)} ${u.email.padEnd(45)} reason: ${testAccountReason(u)}  currentlyFlagged=${!!u.isTestAccount}`);
  });

  console.log(`\n=== NOT MATCHED — REAL OR NEEDS MANUAL REVIEW (${untouched.length}) ===`);
  const domains = new Map();
  untouched.forEach((u) => {
    const d = domainOf(u.email) || '(none)';
    if (!domains.has(d)) domains.set(d, []);
    domains.get(d).push(`${u.name} <${u.email}>`);
  });
  [...domains.keys()].sort().forEach((d) => {
    console.log(`  ${d}: ${domains.get(d).join(', ')}`);
  });
  console.log('  (These are left untouched: the rule keys off the email domain, never a display');
  console.log('   name, so a real student is never hidden. Mark one by hand with');
  console.log('   `db.users.updateOne({_id},{$set:{isTestAccount:true}})` if it is automation.)');

  if (revert) {
    const ids = matched.map((u) => u._id);
    const res = await User.updateMany({ _id: { $in: ids } }, { $set: { isTestAccount: false } });
    console.log(`\nREVERT: cleared isTestAccount on ${res.modifiedCount} account(s).`);
  } else if (apply) {
    const ids = matched.map((u) => u._id);
    const res = await User.updateMany({ _id: { $in: ids } }, { $set: { isTestAccount: true } });
    console.log(`\nAPPLY: set isTestAccount=true on ${res.modifiedCount} account(s).`);
    console.log('No other field or collection was touched.');
  } else {
    console.log('\nDRY RUN — nothing was written. Re-run with --apply to set the flag.');
  }

  await mongoose.disconnect();
}

main().catch((e) => { console.error('flagTestAccounts failed:', e.message); process.exit(1); });
