import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'No IDs provided' }, { status: 400 });
    }

    let deletedCount = 0;
    let failedCount = 0;

    // Delete leads sequentially with small delay to avoid DB timeouts
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        await base44.asServiceRole.entities.Lead.delete(id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete lead ${id}:`, error.message);
        failedCount++;
      }
      // Small delay every 10 deletes to reduce DB pressure
      if (i > 0 && i % 10 === 0) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return Response.json({ success: true, deletedCount, failedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});