import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useRole() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return {
    user,
    loading,
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user",
  };
}

export function canViewLeads(user) {
  return ["admin", "user"].includes(user?.role);
}

export function canEditLeads(user) {
  return ["admin", "user"].includes(user?.role);
}

export function canAddActivities(user) {
  return ["admin", "user"].includes(user?.role);
}

export function canManageUsers(user) {
  return user?.role === "admin";
}

export function canAccessSettings(user) {
  return user?.role === "admin";
}

export function canViewReports(user) {
  return user?.role === "admin";
}