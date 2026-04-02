import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource, resourceId, requiredRole } = await req.json();

    // Admin has full access
    if (user.role === 'admin') {
      return Response.json({ hasAccess: true });
    }

    // Check resource-specific access
    if (resource === 'lead' && resourceId) {
      const lead = await base44.entities.Lead.list({ id: resourceId });
      if (lead && lead.length > 0) {
        const leadRecord = lead[0];
        // User can access if they created it
        if (leadRecord.created_by === user.email) {
          return Response.json({ hasAccess: true });
        }
      }
      return Response.json({ hasAccess: false });
    }

    // Default: deny access
    return Response.json({ hasAccess: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});