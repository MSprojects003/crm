import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deposits = await base44.entities.Deposit.list('-deposit_date', 1000);
    const leads = await base44.entities.Lead.list();
    const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));

    // Filter based on role
    let filtered = deposits;
    if (user.role !== 'admin') {
      filtered = deposits.filter(d => {
        const lead = leadMap[d.lead_id];
        return lead && lead.assigned_user_id === user.id;
      });
    }

    return Response.json({ deposits: filtered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});