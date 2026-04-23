import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { can, isAdmin } from "@/components/auth/auth";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => base44.auth.redirectToLogin(window.location.origin))
      .finally(() => setLoading(false));
  }, []);

  return {
    user,
    loading,
    isAdmin: isAdmin(user),
    can: (permission) => can(user, permission),
  };
}