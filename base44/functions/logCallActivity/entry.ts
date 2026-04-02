import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, callType, callOutcome, notes, duration } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Missing leadId' }, { status: 400 });
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

    // Determine activity type and outcome
    const activityType = callType === 'Click to Call' ? 'DialAttempt' : 'Call';
    const activityOutcome = callOutcome || (callType === 'Click to Call' ? 'Call Initiated' : 'Connected');

    // Create Activity record for the call
    const activity = await base44.entities.Activity.create({
      lead_id: leadId,
      user_id: user.id,
      type: activityType,
      outcome: activityOutcome,
      notes: notes?.trim() || `${callType} at ${new Date().toLocaleString('en-GB', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })}`,
      duration: duration || 0
    });

    // Manage dial attempts and reassign if needed (only for Call types, not Click to Call)
    let dialAttemptResult = null;
    if (activityType === 'Call') {
      dialAttemptResult = await base44.functions.invoke('manageLeadDialAttempts', { leadId });
    }

    return Response.json({ success: true, activity, dialAttempt: dialAttemptResult.data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});