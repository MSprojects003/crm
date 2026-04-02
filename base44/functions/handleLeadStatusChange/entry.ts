import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const UMAIR_EMAIL = 'umair.u@primepath-solutions.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const user = await base44.auth.me();

    // Support both entity automation payload { event, data } and direct calls { leadId, newStatus, userId }
    let leadId = body.leadId;
    let newStatus = body.newStatus;
    let userId = body.userId || user?.id;

    if (body.event) {
      leadId = body.event.entity_id;
      if (body.data) {
        newStatus = body.data.lead_status;
      }
    }

    if (!leadId) {
      return Response.json({ error: 'Missing leadId' }, { status: 400 });
    }

    // Get the lead
    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // If newStatus wasn't in payload, use lead's current status
    if (!newStatus) {
      newStatus = lead?.lead_status;
    }
    if (!newStatus) {
      return Response.json({ error: 'Missing newStatus' }, { status: 400 });
    }

    const updates = {};

    // If status becomes "Converted"
    if (newStatus === 'Converted') {
      updates.account_status = 'Real Deposit';

      // Set conversion owner to the user who made the change
      const conversionUser = await base44.asServiceRole.entities.User.get(userId);
      updates.conversion_owner = conversionUser?.full_name || lead.assigned_user;

      // Reassign lead to umair.u
      const umairUser = await base44.asServiceRole.entities.User.filter({ email: UMAIR_EMAIL });
      if (umairUser?.[0]) {
        updates.assigned_user_id = umairUser[0].id;
        updates.assigned_user = umairUser[0].full_name;

        // Send email notification
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: UMAIR_EMAIL,
            subject: `Lead Converted: ${lead.first_name} ${lead.last_name}`,
            body: `
              <h2>Lead Converted</h2>
              <p><strong>Lead:</strong> ${lead.first_name} ${lead.last_name}</p>
              <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
              <p><strong>Converted By:</strong> ${updates.conversion_owner}</p>
              <p><strong>Account Status:</strong> Real Deposit</p>
            `
          });
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }

        // Create in-app notification
        try {
          await base44.asServiceRole.entities.LeadNotification.create({
            lead_id: leadId,
            user_id: umairUser[0].id,
            lead_name: `${lead.first_name} ${lead.last_name}`,
            lead_phone: lead.phone || '',
            lead_status: 'Converted',
            scheduled_datetime: new Date().toISOString(),
            is_read: false,
            notification_key: `converted_${leadId}_${Date.now()}`,
            type: 'Priority',
            message: `Lead converted by ${updates.conversion_owner}`
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Lead.update(leadId, updates);
    }

    return Response.json({ success: true, updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});