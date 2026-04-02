import { base44 } from "@/api/base44Client";

export async function getCurrentUser() {
  return await base44.auth.me();
}

export const isAdmin = (user) => user?.role?.toLowerCase() === "admin";

// Role-based permissions
export const PERMISSIONS = {
  VIEW_ALL_LEADS: (user) => isAdmin(user),
  VIEW_ASSIGNED_LEADS: (user) => true,
  ASSIGN_LEADS: (user) => isAdmin(user),
  DELETE_LEADS: (user) => isAdmin(user),
  VIEW_ALL_ACTIVITIES: (user) => isAdmin(user),
  ADD_ACTIVITY: (user) => true,
  SCHEDULE_REMINDER: (user) => true,
  VIEW_ALL_REPORTS: (user) => isAdmin(user),
  VIEW_OWN_PERFORMANCE: (user) => true,
  MANAGE_SETTINGS: (user) => isAdmin(user),
  MANAGE_ACCESS_CONTROL: (user) => isAdmin(user),
  VIEW_DEPOSITS: (user) => true,
  ADD_DEPOSIT: (user) => true,
};

export function can(user, permission) {
  const check = PERMISSIONS[permission];
  return check ? check(user) : false;
}