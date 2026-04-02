import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Only lightweight fields for the list view
const LEAD_LIST_FIELDS = [
  'id', 'first_name', 'last_name', 'email', 'phone', 'country_code', 'phone_number',
  'status_id', 'lead_status', 'source_id', 'source', 'campaign_name', 'language_id',
  'assigned_user_id', 'assigned_user', 'created_date', 'updated_date',
  'dial_attempts', 'no_of_calls', 'last_call_datetime', 'sales_follow_up_datetime',
  'country', 'city', 'company', 'account_status', 'deposit_amount_usd', 'balance',
  'equity', 'retention_status', 'retention_status_id', 'ftd_amount', 'ftd_datetime',
  'trading_status', 'client_potential', 'no_answer_times', 'last_followup_notification_sent',
  'account_number', 'account_name', 'account_type', 'conversion_owner',
  'account', 'last_deposit_date', 'last_deposit_amount', 'last_withdrawal_amount',
  'client_deposit_potential', 'retention_follow_up', 'client_feedback', 'server',
  'investor_password', 'last_withdrawal_sl', 'last_withdrawal_utc'
];

function matchesAdvancedFilters(lead, advancedFilters) {
  if (!advancedFilters || !advancedFilters.rows || advancedFilters.rows.length === 0) return true;
  const logic = (advancedFilters.logic || 'AND').toUpperCase();

  const results = advancedFilters.rows.map(row => {
    const { field, condition, values } = row;
    if (!field || !condition || !values || values.length === 0) return true;

    let rawVal;
    if (field === 'name') {
      rawVal = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
    } else {
      rawVal = lead[field];
    }

    const strVal = (rawVal ?? '').toString().toLowerCase();
    const v = (values[0] ?? '').toString().toLowerCase();

    switch (condition) {
      case 'contains':     return strVal.includes(v);
      case 'not_contains': return !strVal.includes(v);
      case 'equals':       return strVal === v;
      case 'not_equals':   return strVal !== v;
      case 'starts_with':  return strVal.startsWith(v);
      case 'greater_than': return parseFloat(rawVal) > parseFloat(values[0]);
      case 'less_than':    return parseFloat(rawVal) < parseFloat(values[0]);
      case 'after':        return rawVal && new Date(rawVal) > new Date(values[0]);
      case 'before':       return rawVal && new Date(rawVal) < new Date(values[0]);
      case 'on': {
        if (!rawVal) return false;
        const d1 = new Date(rawVal).toDateString();
        const d2 = new Date(values[0]).toDateString();
        return d1 === d2;
      }
      case 'is_any_of':  return values.includes(rawVal) || values.includes(String(rawVal));
      case 'is_none_of': return !values.includes(rawVal) && !values.includes(String(rawVal));
      default: return true;
    }
  });

  return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

function stripLead(lead) {

  const out = {};
  for (const field of LEAD_LIST_FIELDS) {
    if (lead[field] !== undefined) out[field] = lead[field];
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ leads: [], users: [], total: 0, error: 'Unauthorized' }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit ?? 50, 100);
    const skip  = body.skip  ?? 0;

    // Server-side filter object (exact-match fields supported by SDK)
    const query = {};
    if (body.status_id)    query.status_id    = body.status_id;
    if (body.source_id)    query.source_id    = body.source_id;
    if (body.language_id)  query.language_id  = body.language_id;

    // Non-admin users can only see their own leads
    if (user.role !== 'admin') {
      query.assigned_user_id = user.id;
    } else if (body.assigned_user_id) {
      query.assigned_user_id = body.assigned_user_id;
    }

    const SAFE_BATCH = 20; // stay well under 65KB SDK limit
    const hasSearch = body.search && body.search.trim().length > 0;
    const hasDate   = body.dateFrom || body.dateTo;
    const advancedFilters = body.advancedFilters || null;
    const hasAdvanced = advancedFilters && advancedFilters.rows && advancedFilters.rows.length > 0;
    let leads = [];
    let total = null;
    let hasMore = false;

    if (hasSearch || hasDate || hasAdvanced) {
      // Fetch in small batches, filter in-memory, collect until we have enough for the requested page
      const needed = skip + limit;
      let filtered = [];
      let batchSkip = 0;
      let exhausted = false;

      while (filtered.length < needed && !exhausted) {
        let batch = await base44.asServiceRole.entities.Lead.filter(query, '-updated_date', SAFE_BATCH, batchSkip);
        if (typeof batch === 'string') batch = JSON.parse(batch);
        if (!Array.isArray(batch) || batch.length === 0) { exhausted = true; break; }
        if (batch.length < SAFE_BATCH) exhausted = true;

        // Apply search
        if (hasSearch) {
          const q = body.search.trim().toLowerCase();
          batch = batch.filter(l => {
            const name = `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase();
            return name.includes(q) || (l.email || '').toLowerCase().includes(q) || (l.phone || '').includes(q);
          });
        }
        // Apply date range
        if (body.dateFrom) {
          const from = new Date(body.dateFrom);
          batch = batch.filter(l => l.created_date && new Date(l.created_date) >= from);
        }
        if (body.dateTo) {
          const to = new Date(body.dateTo + 'T23:59:59');
          batch = batch.filter(l => l.created_date && new Date(l.created_date) <= to);
        }
        // Apply advanced filters
        if (hasAdvanced) {
          batch = batch.filter(l => matchesAdvancedFilters(l, advancedFilters));
        }

        filtered = filtered.concat(batch);
        batchSkip += SAFE_BATCH;

        // Safety cap to avoid infinite loops
        if (batchSkip > 5000) { exhausted = true; break; }
      }

      total = exhausted ? filtered.length : null;
      leads = filtered.slice(skip, skip + limit).map(stripLead);
      hasMore = filtered.length > skip + limit || (!exhausted && leads.length === limit);

    } else {
      // Pure server-side pagination — exact-match filters only, fast path
      let raw = await base44.asServiceRole.entities.Lead.filter(query, '-updated_date', SAFE_BATCH, skip);
      if (typeof raw === 'string') raw = JSON.parse(raw);
      if (!Array.isArray(raw)) raw = [];
      leads = raw.map(stripLead);
      hasMore = raw.length === SAFE_BATCH;
    }

    // Fetch users only on first page
    let usersFormatted = [];
    if (skip === 0) {
      let allUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
      if (typeof allUsers === 'string') allUsers = JSON.parse(allUsers);
      usersFormatted = (Array.isArray(allUsers) ? allUsers : []).map(u => ({
        id: u.id, full_name: u.full_name || u.email, email: u.email, role: u.role,
      }));
    }

    return Response.json({ leads, users: usersFormatted, total, hasMore, skip });

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return Response.json({ leads: [], users: [], total: 0, hasMore: false, skip: 0, error: error.message }, { status: 200 });
  }
});