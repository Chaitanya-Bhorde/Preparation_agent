// SQL execution util (kept as schema/helper for API compatibility).
// The SQL practice section has been removed; this module is retained so
// remaining controllers that reference it can boot without errors.

async function executeSQL() {
  return { success: false, error: 'SQL execution is disabled (SQL section removed)' };
}

module.exports = { executeSQL };
