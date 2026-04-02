import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Only admins can create leads' }, { status: 403 });
    }

    const leadData = await req.json();

    // If no status provided, use first active status
    if (!leadData.status_id) {
      const statuses = await base44.entities.LeadStatus.list();
      const activeStatuses = statuses.filter(s => s.is_active);
      const defaultStatus = activeStatuses.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
      
      if (defaultStatus) {
        leadData.status_id = defaultStatus.id;
      }
    }

    const lead = await base44.entities.Lead.create(leadData);
    
    // Log lead import activity
    await base44.entities.Activity.create({
      lead_id: lead.id,
      user_id: user.email,
      type: 'LeadImport',
      notes: `Lead imported by ${user.full_name}`,
      source: leadData.source_id || 'Manual'
    });
    
    return Response.json({ lead });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});