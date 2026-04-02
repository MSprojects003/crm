import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reminders = await base44.entities.Reminder.list('-due_datetime', 500);
    const now = new Date();

    // Only get user's reminders
    const userReminders = reminders.filter(r => r.user_id === user.id);

    // Auto-mark overdue as "Missed"
    for (const reminder of userReminders) {
      if (reminder.status === 'Pending' && new Date(reminder.due_datetime) < now) {
        await base44.entities.Reminder.update(reminder.id, { status: 'Missed' });
      }
    }

    // Fetch updated list
    const updatedReminders = await base44.entities.Reminder.list('-due_datetime', 500);
    const filtered = updatedReminders.filter(r => r.user_id === user.id);

    return Response.json({ reminders: filtered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});