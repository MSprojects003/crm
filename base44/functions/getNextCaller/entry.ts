import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const excludeIds = new Set(Array.isArray(body.excludeIds) ? body.excludeIds : []);
    const sourceFilter = body.source_id ? { source_id: body.source_id } : {};

    const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
    const nowSLT = new Date(Date.now() + SLT_OFFSET_MS);
    const todayDateSLT = nowSLT.toISOString().slice(0, 10);

    const isAdmin = user.role === 'admin';
    const assignedFilter = isAdmin ? {} : { assigned_user_id: user.id };
    const FETCH = 100;

    const findFirst = (leads) => leads.find(l => !excludeIds.has(l.id)) || null;

    // Fire ALL queries in parallel — apply sourceFilter as first-level condition
    const [
      priorityLeads,
      followUpLeads,
      unassignedLeads,
      unassignedNullLeads,
      noAnswerLeads,
      userBusyLeads,
      unhandledLeads,
    ] = await Promise.all([
      base44.asServiceRole.entities.Lead.filter(
        { ...assignedFilter, ...sourceFilter, lead_status: 'Priority' },
        'sales_follow_up_datetime', FETCH
      ),
      base44.asServiceRole.entities.Lead.filter(
        { ...assignedFilter, ...sourceFilter, lead_status: 'Follow Up' },
        'sales_follow_up_datetime', FETCH
      ),
      isAdmin
        ? base44.asServiceRole.entities.Lead.filter({ ...sourceFilter, lead_status: 'Unassigned' }, 'created_date', FETCH)
        : base44.asServiceRole.entities.Lead.filter({ assigned_user_id: user.id, ...sourceFilter, lead_status: 'Unassigned' }, 'created_date', FETCH),
      isAdmin
        ? base44.asServiceRole.entities.Lead.filter({ ...sourceFilter, lead_status: null }, 'created_date', FETCH)
        : Promise.resolve([]),
      base44.asServiceRole.entities.Lead.filter(
        { ...assignedFilter, ...sourceFilter, lead_status: 'No Answer' },
        'last_call_datetime', FETCH
      ),
      base44.asServiceRole.entities.Lead.filter(
        { ...assignedFilter, ...sourceFilter, lead_status: 'User Busy' },
        'last_call_datetime', FETCH
      ),
      base44.asServiceRole.entities.Lead.filter(
        { ...assignedFilter, ...sourceFilter, lead_status: 'Unhandled' },
        'updated_date', FETCH
      ),
    ]);

    // Priority 1: Priority due
    const priority = findFirst(priorityLeads);
    if (priority) return Response.json({ leadId: priority.id, reason: 'Priority' });

    // Priority 2: Follow Up due
    const followUp = findFirst(followUpLeads);
    if (followUp) return Response.json({ leadId: followUp.id, reason: 'Follow Up' });

    // Priority 3: Unassigned
    const unassignedPool = [...unassignedLeads, ...unassignedNullLeads]
      .filter((l, i, arr) => arr.findIndex(x => x.id === l.id) === i)
      .filter(l => !l.lead_status || l.lead_status === '' || l.lead_status === 'Unassigned')
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const unassigned = findFirst(unassignedPool);
    if (unassigned) return Response.json({ leadId: unassigned.id, reason: 'Unassigned' });

    // Priority 4: No Answer (not called today)
    const noAnswer = noAnswerLeads
      .filter(l => {
        if (excludeIds.has(l.id)) return false;
        if (l.last_call_datetime) {
          const lastCallSLT = new Date(new Date(l.last_call_datetime).getTime() + SLT_OFFSET_MS);
          if (lastCallSLT.toISOString().slice(0, 10) === todayDateSLT) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (!a.last_call_datetime) return 1;
        if (!b.last_call_datetime) return -1;
        return new Date(a.last_call_datetime) - new Date(b.last_call_datetime);
      })[0] || null;
    if (noAnswer) return Response.json({ leadId: noAnswer.id, reason: 'No Answer' });

    // Priority 5: User Busy
    const userBusy = findFirst(userBusyLeads);
    if (userBusy) return Response.json({ leadId: userBusy.id, reason: 'User Busy' });

    // Priority 6: Unhandled
    const unhandled = findFirst(unhandledLeads);
    if (unhandled) return Response.json({ leadId: unhandled.id, reason: 'Unhandled' });

    // Priority 7: Any lead (last resort)
    const anyLeads = await base44.asServiceRole.entities.Lead.filter(
      { ...assignedFilter, ...sourceFilter }, 'updated_date', FETCH
    );
    const anyLead = findFirst(anyLeads);
    if (anyLead) return Response.json({ leadId: anyLead.id, reason: anyLead.lead_status || 'Other' });

    return Response.json({ leadId: null, reason: 'none' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});