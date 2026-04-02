import { createClientFromRequest } from "npm:@base44/sdk@0.8.20";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if roles already exist
    const existingRoles = await base44.entities.CrmRoles.list();
    if (existingRoles.length > 0) {
      return Response.json({ message: "CRM system already initialized" });
    }

    // Create default roles
    const roles = await base44.entities.CrmRoles.bulkCreate([
      { name: "SuperAdmin", description: "Full system access", hierarchy_level: 3 },
      { name: "Admin", description: "Administration access", hierarchy_level: 2 },
      { name: "Agent", description: "Agent access", hierarchy_level: 1 },
    ]);

    const superAdminRole = roles.find(r => r.hierarchy_level === 3);
    const adminRole = roles.find(r => r.hierarchy_level === 2);

    // Assign current user to SuperAdmin
    await base44.entities.CrmUserRoles.create({
      user_id: user.id,
      role_id: superAdminRole.id,
    });

    // Create default permissions for each role
    const defaultPermissions = [
      // SuperAdmin - full access
      ...generatePermissions(superAdminRole.id, true),
      // Admin - limited access
      ...generatePermissions(adminRole.id, false, ["Settings:Manage CRM Roles"]),
    ];

    if (defaultPermissions.length > 0) {
      await base44.entities.CrmPermissions.bulkCreate(defaultPermissions);
    }

    return Response.json({
      message: "CRM system initialized successfully",
      roles: roles.length,
    });
  } catch (error) {
    console.error("Init error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generatePermissions(roleId, isFullAccess, exclude = []) {
  const actions = [
    { module: "Leads", action: "View" },
    { module: "Leads", action: "Create" },
    { module: "Leads", action: "Edit" },
    { module: "Leads", action: "Delete" },
    { module: "Leads", action: "Assign" },
    { module: "Activities", action: "View All" },
    { module: "Activities", action: "View Own" },
    { module: "Activities", action: "Create" },
    { module: "Reminders", action: "View" },
    { module: "Reminders", action: "Create" },
    { module: "Reminders", action: "Complete" },
    { module: "Deposits", action: "View" },
    { module: "Deposits", action: "Create" },
    { module: "Deposits", action: "Approve" },
    { module: "Reports", action: "View Own" },
    { module: "Reports", action: "View All" },
    { module: "Settings", action: "Manage Users" },
    { module: "Settings", action: "Manage CRM Roles" },
    { module: "Settings", action: "Manage System Config" },
  ];

  return actions
    .filter(({ module, action }) => !exclude.includes(`${module}:${action}`))
    .map(({ module, action }) => ({
      role_id: roleId,
      module,
      action,
      allowed: isFullAccess,
    }));
}