import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function useCRMRole(user) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const userRoles = await base44.entities.UserCRMRole.filter({
        user_id: user.email,
      });

      if (userRoles.length > 0) {
        const crmRole = await base44.entities.CRMRole.filter({
          id: userRoles[0].role_id,
        });
        setRole(crmRole[0] || null);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { role, loading };
}