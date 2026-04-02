import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'leadId is required' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);

    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    return Response.json({ lead, users: [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});