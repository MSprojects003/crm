import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activities = await base44.entities.Activity.list('-created_date', 1000);

    // Filter based on role
    const filtered = user.role === 'admin' 
      ? activities 
      : activities.filter(a => a.user_id === user.id);

    return Response.json({ activities: filtered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});