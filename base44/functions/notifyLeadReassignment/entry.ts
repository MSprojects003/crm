import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const UMAIR_EMAIL = 'umair.u@primepath-solutions.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const user = await base44.auth.me();

    // Support entity automation payload
    let leadId = body.leadId;
    let newUserId = body.newUserId;
    let oldUserId = body.oldUserId;

    if (body.event) {
      leadId = body.event.entity_id;
      newUserId = body.data?.assigned_user_id;
      oldUserId = body.old_data?.assigned_user_id;

      // Skip if assigned_user_id didn't change
      if (newUserId === oldUserId) {
        return Response.json({ success: false, message: 'No assignment change detected' });
      }
    }

    if (!leadId || !newUserId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get lead and new user details
    const [lead, newUser] = await Promise.all([
      base44.asServiceRole.entities.Lead.get(leadId),
      base44.asServiceRole.entities.User.get(newUserId)
    ]);

    if (!lead || !newUser) {
      return Response.json({ error: 'Lead or user not found' }, { status: 404 });
    }

    // Send notifications for all lead reassignments
    // Special handling: if lead is converted and reassigner is umair.u, use special message
    const isConvertedReassignment = lead.lead_status === 'Converted' && user?.email === UMAIR_EMAIL;

    // Send email notification to new assignee (only for regular reassignments, not converted)
    if (!isConvertedReassignment) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: newUser.email,
          subject: `Lead Reassigned: ${lead.first_name} ${lead.last_name}`,
          body: `
            <h2>Lead Reassigned to You</h2>
            <p><strong>Lead:</strong> ${lead.first_name} ${lead.last_name}</p>
            <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
            <p><strong>Lead Status:</strong> ${lead.lead_status || 'N/A'}</p>
            <p><strong>Account Status:</strong> ${lead.account_status || 'N/A'}</p>
            <p><strong>Assigned By:</strong> ${user?.full_name || 'System'}</p>
            <p>This lead has been reassigned to you.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    // Create in-app notification for new assignee
    try {
      const message = isConvertedReassignment
        ? `Converted lead assigned to you by ${user?.full_name || 'System'}`
        : `Lead reassigned to you by ${user?.full_name || 'System'}`;

      await base44.asServiceRole.entities.LeadNotification.create({
        lead_id: leadId,
        user_id: newUserId,
        lead_name: `${lead.first_name} ${lead.last_name}`,
        lead_phone: lead.phone || '',
        lead_status: lead.lead_status,
        scheduled_datetime: new Date().toISOString(),
        is_read: false,
        notification_key: `reassignment_${leadId}_${newUserId}_${Date.now()}`,
        type: 'Priority',
        message
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    return Response.json({ success: true, message: 'Notifications sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});