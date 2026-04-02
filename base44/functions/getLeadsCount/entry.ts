import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ count: 0, error: 'Unauthorized' }, { status: 200 });
    }

    const BATCH = 1000;
    let skip = 0;
    let count = 0;
    let hasMore = true;

    while (hasMore) {
      let batch;
      if (user.role === 'admin') {
        batch = await base44.asServiceRole.entities.Lead.list('-created_date', BATCH, skip);
      } else {
        batch = await base44.asServiceRole.entities.Lead.filter(
          { assigned_user_id: user.id },
          '-created_date',
          BATCH,
          skip
        );
      }

      count += batch.length;
      hasMore = batch.length === BATCH;
      skip += BATCH;
    }

    return Response.json({ count });
  } catch (error) {
    console.error("Count error:", error.message);
    return Response.json({ count: 0, error: error.message }, { status: 200 });
  }
});