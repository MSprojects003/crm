import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Fetch all pages of an entity list with small batches and delays to avoid rate limits
async function fetchAll(fetchFn, batchSize = 5) {
  let all = [];
  let skip = 0;
  while (true) {
    let batch = await fetchFn(batchSize, skip);
    if (typeof batch === 'string') batch = JSON.parse(batch);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < batchSize) break;
    skip += batch.length;
    await sleep(1000); // avoid rate limiting
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { dateFrom, dateTo } = body;

    const inRange = (dateStr) => {
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    };

    // Today's date in SLT (Asia/Colombo = UTC+5:30)
    const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
    const nowSLT = new Date(Date.now() + SLT_OFFSET_MS);
    const todaySLT = nowSLT.toISOString().slice(0, 10);

    const isTodaySLT = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(new Date(dateStr).getTime() + SLT_OFFSET_MS);
      return d.toISOString().slice(0, 10) === todaySLT;
    };

    // Fetch sequentially with delays to avoid rate limiting
    const allUsers = await fetchAll((limit, skip) => base44.asServiceRole.entities.User.list('-created_date', limit, skip));
    await sleep(1000);
    const allLeads = await fetchAll((limit, skip) => base44.asServiceRole.entities.Lead.list('-created_date', limit, skip));
    await sleep(500);
    const allActivities = await fetchAll((limit, skip) => base44.asServiceRole.entities.Activity.list('-created_date', limit, skip));

    const agents = allUsers.filter(u => u.role === 'user');

    // Group leads and activities by agent
    const leadsByAgent = {};
    for (const lead of allLeads) {
      const aid = lead.assigned_user_id;
      if (!aid) continue;
      if (!leadsByAgent[aid]) leadsByAgent[aid] = [];
      leadsByAgent[aid].push(lead);
    }

    const activitiesByAgent = {};
    for (const act of allActivities) {
      const aid = act.user_id;
      if (!aid) continue;
      if (!activitiesByAgent[aid]) activitiesByAgent[aid] = [];
      activitiesByAgent[aid].push(act);
    }

    const agentStats = agents.map((agent) => {
      const agentLeads = leadsByAgent[agent.id] || [];
      const agentActivities = activitiesByAgent[agent.id] || [];

      const filteredActivities = agentActivities.filter(a => inRange(a.created_date));
      const totalCalls = filteredActivities.filter(a => a.type === 'Call').length;
      const totalAssignedLeads = agentLeads.length;

      const convertedLeads = agentLeads.filter(l => l.lead_status === 'Converted').length;
      const assignedConversionRate = totalAssignedLeads > 0
        ? ((convertedLeads / totalAssignedLeads) * 100).toFixed(1)
        : '0.0';

      const freshLeads = agentLeads.filter(l => isTodaySLT(l.created_date));
      const freshLeadsCount = freshLeads.length;
      const freshLeadsConverted = freshLeads.filter(l => l.lead_status === 'Converted').length;
      const freshLeadsConversionRate = freshLeadsCount > 0
        ? ((freshLeadsConverted / freshLeadsCount) * 100).toFixed(1)
        : '0.0';

      const statusBreakdown = {};
      agentLeads.forEach(l => {
        const s = l.lead_status || 'Unassigned';
        statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
      });

      const agentName = agent.full_name || [agent.first_name, agent.last_name].filter(Boolean).join(' ') || agent.email;
      return {
        agent: { id: agent.id, full_name: agentName, email: agent.email, role: agent.role },
        totalCalls,
        totalAssignedLeads,
        convertedLeads,
        assignedConversionRate,
        freshLeadsCount,
        freshLeadsConverted,
        freshLeadsConversionRate,
        statusBreakdown,
      };
    });

    return Response.json({ agents: agentStats });
  } catch (error) {
    console.error("getAgentMetrics error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});