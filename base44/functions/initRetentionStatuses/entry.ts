import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const DEFAULT_STATUSES = [
  "Work in progress",
  "Pending reactivation",
  "Washout",
  "Active trader",
  "Low activity",
  "Dormant"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if statuses already exist
    const existing = await base44.asServiceRole.entities.RetentionStatus.list();
    if (existing.length > 0) {
      return Response.json({ message: 'Retention statuses already initialized', count: existing.length });
    }

    // Create default statuses
    const statuses = await Promise.all(
      DEFAULT_STATUSES.map(name =>
        base44.asServiceRole.entities.RetentionStatus.create({ name, is_active: true })
      )
    );

    return Response.json({ message: 'Retention statuses initialized', count: statuses.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});