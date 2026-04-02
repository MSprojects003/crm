import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { depositId, oldStatus, newStatus } = await req.json();

    // Get deposit to check authorization
    const deposits = await base44.entities.Deposit.list();
    const deposit = deposits.find(d => d.id === depositId);

    if (!deposit) {
      return Response.json({ error: 'Deposit not found' }, { status: 404 });
    }

    // Only admin or the deposit creator can log changes
    if (user.role !== 'admin' && deposit.user_id !== user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Log activity
    await base44.entities.Activity.create({
      lead_id: deposit.lead_id,
      user_id: user.id,
      type: 'Note',
      notes: `Deposit status changed from ${oldStatus} to ${newStatus}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});