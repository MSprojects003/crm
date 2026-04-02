import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { leadId } = await req.json();
    if (!leadId) return Response.json({ error: 'Missing leadId' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const now = new Date();
    const lastCall = lead.last_call_datetime ? new Date(lead.last_call_datetime) : null;
    const oneHourMs = 60 * 60 * 1000;

    // Within the 1-hour window — skip increment, return current values
    if (lastCall && (now.getTime() - lastCall.getTime()) < oneHourMs) {
      const lastCallStr = lastCall.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return Response.json({
        incremented: false,
        message: `Call already logged at ${lastCallStr}. Count updates after 1 hour.`,
        no_of_calls: lead.no_of_calls || 0,
        last_call_datetime: lead.last_call_datetime
      });
    }

    // Increment call count
    const updates = {
      no_of_calls: (lead.no_of_calls || 0) + 1,
      last_call_datetime: now.toISOString(),
    };
    if (lead.lead_status === 'No Answer') {
      updates.no_answer_times = (lead.no_answer_times || 0) + 1;
    }

    await base44.asServiceRole.entities.Lead.update(leadId, updates);

    // Log activity
    await base44.asServiceRole.entities.Activity.create({
      lead_id: leadId,
      user_id: user.id,
      type: 'Call',
      notes: `Click to Call — attempt #${updates.no_of_calls}`
    });

    return Response.json({
      incremented: true,
      no_of_calls: updates.no_of_calls,
      last_call_datetime: updates.last_call_datetime,
      no_answer_times: updates.no_answer_times
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});