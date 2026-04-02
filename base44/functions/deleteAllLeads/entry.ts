import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch a small batch
    const batch = await base44.asServiceRole.entities.Lead.list('-created_date', 20);
    if (!batch || batch.length === 0) {
      return Response.json({ deleted: 0, done: true });
    }

    // Delete one by one with delay
    let deleted = 0;
    for (const lead of batch) {
      await base44.asServiceRole.entities.Lead.delete(lead.id);
      await new Promise(r => setTimeout(r, 150));
      deleted++;
    }

    return Response.json({ deleted, done: batch.length < 20 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});