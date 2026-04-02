import { base44 } from "@/api/base44Client";

/**
 * Interpolate template variables with actual lead data
 */
function interpolateTemplate(template, lead) {
  let result = template;
  result = result.replace("{lead_name}", `${lead.first_name} ${lead.last_name}`.trim());
  result = result.replace("{lead_phone}", lead.phone || "N/A");
  result = result.replace("{lead_email}", lead.email || "N/A");
  return result;
}

/**
 * Process all follow-up sequences for a lead
 */
export async function processFollowUpsForLead(lead) {
  try {
    const sequences = await base44.entities.FollowUpSequence.list("-created_date", 100);
    const enabledSequences = sequences.filter(s => s.enabled);

    for (const seq of enabledSequences) {
      const shouldTrigger = checkTrigger(seq, lead);
      if (!shouldTrigger) continue;

      // Check if follow-up already sent for this sequence
      const existingLog = await base44.entities.FollowUpLog.filter({
        lead_id: lead.id,
        sequence_id: seq.id,
      });

      if (existingLog.length > 0) continue; // Already processed

      // Send initial follow-up
      await sendFollowUp(lead, seq, 1, seq.message_template, seq.subject);

      // Schedule subsequent follow-ups
      if (seq.follow_up_intervals && seq.follow_up_intervals.length > 0) {
        for (let i = 0; i < seq.follow_up_intervals.length; i++) {
          const interval = seq.follow_up_intervals[i];
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + interval.day);

          // Schedule as reminder for the agent
          if (lead.assigned_user_id) {
            await base44.entities.Reminder.create({
              lead_id: lead.id,
              user_id: lead.assigned_user_id,
              type: "Email",
              due_datetime: dueDate.toISOString(),
              reminder_before_minutes: 15,
              status: "Pending",
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error processing follow-ups:", err);
  }
}

/**
 * Check if a sequence trigger condition is met
 */
function checkTrigger(sequence, lead) {
  const { trigger_type, trigger_status, trigger_days } = sequence;

  if (trigger_type === "status_change") {
    return lead.status === trigger_status;
  }

  if (trigger_type === "time_based") {
    if (!lead.created_date) return false;
    const leadDate = new Date(lead.created_date);
    const now = new Date();
    const daysDiff = Math.floor((now - leadDate) / (1000 * 60 * 60 * 24));
    return daysDiff === trigger_days;
  }

  if (trigger_type === "no_contact") {
    // Last contact = most recent activity or reminder
    let lastContact = lead.created_date;
    if (lead.updated_date) {
      lastContact = new Date(lastContact) > new Date(lead.updated_date) ? lastContact : lead.updated_date;
    }
    if (!lastContact) return false;

    const lastDate = new Date(lastContact);
    const now = new Date();
    const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    return daysDiff >= trigger_days;
  }

  return false;
}

/**
 * Send a follow-up notification and log it
 */
export async function sendFollowUp(lead, sequence, followUpNumber, message, subject) {
  try {
    const interpolatedMessage = interpolateTemplate(message, lead);
    const interpolatedSubject = subject ? interpolateTemplate(subject, lead) : "Follow-up";

    // Log the follow-up
    await base44.entities.FollowUpLog.create({
      lead_id: lead.id,
      sequence_id: sequence.id,
      assigned_user_id: lead.assigned_user_id || "",
      notification_type: sequence.notification_type === "email" ? "email" : "in_app",
      sent_date: new Date().toISOString(),
      follow_up_number: followUpNumber,
      message_sent: interpolatedMessage,
      email_sent: false,
    });

    // Send email if configured
    if ((sequence.notification_type === "email" || sequence.notification_type === "both") && lead.assigned_user_id) {
      const agent = await base44.entities.User.filter({ id: lead.assigned_user_id }).then(r => r[0]);
      if (agent?.email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: agent.email,
            subject: interpolatedSubject,
            body: `Follow-up for lead: ${lead.first_name} ${lead.last_name}\n\n${interpolatedMessage}`,
          });

          // Update log to mark email as sent
          const logs = await base44.entities.FollowUpLog.filter({
            lead_id: lead.id,
            sequence_id: sequence.id,
            follow_up_number: followUpNumber,
          });
          if (logs.length > 0) {
            await base44.entities.FollowUpLog.update(logs[0].id, { email_sent: true });
          }
        } catch (emailErr) {
          console.error("Failed to send email:", emailErr);
        }
      }
    }

    // Create in-app reminder/notification
    if (sequence.notification_type === "in_app" || sequence.notification_type === "both") {
      if (lead.assigned_user_id) {
        await base44.entities.Reminder.create({
          lead_id: lead.id,
          user_id: lead.assigned_user_id,
          type: "Email",
          due_datetime: new Date().toISOString(),
          status: "Pending",
        });
      }
    }
  } catch (err) {
    console.error("Error sending follow-up:", err);
  }
}