import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, dueDateTime, notes } = await req.json();

    if (!leadId || !dueDateTime) {
      return Response.json({ error: 'Missing leadId or dueDateTime' }, { status: 400 });
    }

    // Check access: admin or assigned user
    const response = await base44.functions.invoke('checkResourceAccess', {
      resource: 'lead',
      resourceId: leadId,
      requiredRole: 'user'
    });

    if (!response.data.hasAccess) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create Reminder record
    const reminder = await base44.entities.Reminder.create({
      lead_id: leadId,
      user_id: user.id,
      type: 'Call',
      status: 'Pending',
      due_datetime: dueDateTime,
      notes: notes?.trim() || ''
    });

    return Response.json({ success: true, reminder });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});