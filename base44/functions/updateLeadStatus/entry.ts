import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, newStatusId } = await req.json();

    // Fetch lead to check permissions
    const lead = await base44.entities.Lead.list().then(leads => 
      leads.find(l => l.id === leadId)
    );

    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Only admin can change lead status
    if (user.role !== 'admin') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const oldStatusId = lead.status_id;

    // Update lead status
    const updatedLead = await base44.entities.Lead.update(leadId, { status_id: newStatusId });

    // Log status change activity
    if (user.id) {
      await base44.entities.Activity.create({
        lead_id: leadId,
        user_id: user.id,
        type: 'Note',
        notes: `Status changed from ${oldStatusId} to ${newStatusId}`,
      });
    }

    return Response.json({ lead: updatedLead });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});