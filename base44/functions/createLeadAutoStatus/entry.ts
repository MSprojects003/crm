import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // This function is called as an entity automation on Lead creation.
    // The payload has: { event: { entity_id }, data: { ...leadFields } }
    const leadId = body.event?.entity_id;
    const leadData = body.data || {};

    if (!leadId) {
      return Response.json({ error: 'No entity_id in automation payload' }, { status: 400 });
    }

    // Only set account_status if not already set
    if (!leadData.account_status) {
      await base44.asServiceRole.entities.Lead.update(leadId, { account_status: 'Lead' });
    }

    return Response.json({ success: true, leadId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});