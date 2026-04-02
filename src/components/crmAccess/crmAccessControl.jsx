import { base44 } from "@/api/base44Client";

export async function initializeCRMRoles() {
  const existing = await base44.entities.CrmRoles.list();
  if (existing.length > 0) return;

  const roles = [
    { name: "SuperAdmin", description: "Full system access", hierarchy_level: 3 },
    { name: "Admin", description: "Administration access", hierarchy_level: 2 },
    { name: "Agent", description: "Agent access", hierarchy_level: 1 },
  ];

  const created = await base44.entities.CrmRoles.bulkCreate(roles);
  return created;
}

export async function getUserCRMRole(userId) {
  const assignments = await base44.entities.CrmUserRoles.filter({ user_id: userId });
  if (assignments.length === 0) return null;
  const roleId = assignments[0].role_id;
  const roles = await base44.entities.CrmRoles.filter({ id: roleId });
  return roles.length > 0 ? roles[0] : null;
}

export async function getRolePermissions(roleId) {
  return await base44.entities.CrmPermissions.filter({ role_id: roleId });
}

export async function hasPermission(user, module, action) {
  if (!user) return false;
  const roles = await base44.entities.CrmUserRoles.filter({ user_id: user.id });
  if (roles.length === 0) return false;

  const roleId = roles[0].role_id;
  const permissions = await base44.entities.CrmPermissions.filter({
    role_id: roleId,
    module: module,
    action: action,
  });

  return permissions.length > 0 && permissions[0].allowed;
}

export async function assignUserRole(userId, roleId) {
  const existing = await base44.entities.CrmUserRoles.filter({ user_id: userId });
  if (existing.length > 0) {
    await base44.entities.CrmUserRoles.update(existing[0].id, { role_id: roleId });
  } else {
    await base44.entities.CrmUserRoles.create({ user_id: userId, role_id: roleId });
  }
}

export function isAccessDenied(error) {
  return error?.response?.status === 403;
}