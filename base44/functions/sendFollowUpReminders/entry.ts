import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // sales_follow_up_datetime is stored as naive SLT (YYYY-MM-DDTHH:mm) from datetime-local inputs.
    // Build comparison strings in the same naive SLT format.
    const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
    const nowSLT = new Date(Date.now() + SLT_OFFSET_MS);
    const fiveMinutesAgo = new Date(nowSLT.getTime() - 5 * 60 * 1000).toISOString().slice(0, 16);
    const nowIso = nowSLT.toISOString().slice(0, 16);

    // Find Priority and Follow-Up leads with a scheduled follow-up in the current 5-min window
    const [priorityLeads, followUpLeads] = await Promise.all([
      base44.asServiceRole.entities.Lead.filter({
        lead_status: 'Priority',
        sales_follow_up_datetime: { $gte: fiveMinutesAgo, $lte: nowIso }
      }),
      base44.asServiceRole.entities.Lead.filter({
        lead_status: 'Follow Up',
        sales_follow_up_datetime: { $gte: fiveMinutesAgo, $lte: nowIso }
      })
    ]);

    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com';

    // Pre-fetch all users once to avoid per-lead queries (fixes StreamingResponse error + speeds up)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

    const sendReminder = async (lead, type) => {
      if (!lead.assigned_user_id) return 'no_assignee';
      if (!lead.sales_follow_up_datetime) return 'no_datetime';

      // Deduplication: skip if already notified for this exact scheduled time
      if (lead.last_followup_notification_sent === lead.sales_follow_up_datetime) {
        return 'duplicate';
      }

      // Get the assigned user from pre-fetched map
      const assignedUser = userMap[lead.assigned_user_id];
      if (!assignedUser) return 'user_not_found';
      if (!assignedUser.email) return 'no_email';

      const leadName = `${lead.first_name} ${lead.last_name}`;
      const profileLink = `${appUrl}/LeadProfile?id=${lead.id}`;

      // Create in-app notification (dedup via notification_key)
      const notifKey = `${lead.id}_${lead.sales_follow_up_datetime}`;
      const existingNotifs = await base44.asServiceRole.entities.LeadNotification.filter({ notification_key: notifKey });
      if (existingNotifs.length === 0) {
        await base44.asServiceRole.entities.LeadNotification.create({
          lead_id: lead.id,
          user_id: lead.assigned_user_id,
          lead_name: leadName,
          lead_phone: lead.phone || '',
          lead_status: lead.lead_status || '',
          scheduled_datetime: lead.sales_follow_up_datetime,
          is_read: false,
          notification_key: notifKey,
          type: type === 'Priority' ? 'Priority' : 'FollowUp'
        });
      }

      // Mark lead as notified for this scheduled time (dedup)
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        last_followup_notification_sent: lead.sales_follow_up_datetime
      });

      return 'sent';
    };

    const results = { priority: 0, followUp: 0, skipped: 0, errors: [] };

    const [priorityOutcomes, followUpOutcomes] = await Promise.all([
      Promise.all(priorityLeads.map(lead => sendReminder(lead, 'Priority').catch(e => { results.errors.push(e.message); return 'error'; }))),
      Promise.all(followUpLeads.map(lead => sendReminder(lead, 'Follow Up').catch(e => { results.errors.push(e.message); return 'error'; })))
    ]);

    for (const outcome of priorityOutcomes) {
      if (outcome === 'sent') results.priority++;
      else if (outcome === 'duplicate') results.skipped++;
    }
    for (const outcome of followUpOutcomes) {
      if (outcome === 'sent') results.followUp++;
      else if (outcome === 'duplicate') results.skipped++;
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});