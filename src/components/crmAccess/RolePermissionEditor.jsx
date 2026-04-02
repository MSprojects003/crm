import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

const RESOURCES = ["Lead", "Deal", "Contact", "Task", "Report"];
const ACTIONS = ["View", "Create", "Edit", "Delete"];

export default function RolePermissionEditor({ onRefresh }) {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      const data = await base44.entities.CRMRole.list();
      setRoles(data);
      if (data.length > 0) {
        setSelectedRole(data[0]);
        setPermissions(data[0].permissions || []);
      }
    };
    fetchRoles();
  }, [onRefresh]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setPermissions(role.permissions || []);
  };

  const addPermission = (resource, action) => {
    if (!permissions.find((p) => p.resource === resource && p.action === action)) {
      setPermissions([...permissions, { resource, action }]);
    }
  };

  const removePermission = (resource, action) => {
    setPermissions(
      permissions.filter((p) => !(p.resource === resource && p.action === action))
    );
  };

  const savePermissions = async () => {
    if (selectedRole) {
      await base44.entities.CRMRole.update(selectedRole.id, {
        permissions,
      });
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {roles.map((role) => (
          <Button
            key={role.id}
            variant={selectedRole?.id === role.id ? "default" : "outline"}
            onClick={() => handleRoleChange(role)}
          >
            {role.name}
          </Button>
        ))}
      </div>

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Permissions for {selectedRole.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {RESOURCES.map((resource) =>
                ACTIONS.map((action) => {
                  const isChecked = permissions.some(
                    (p) => p.resource === resource && p.action === action
                  );
                  return (
                    <label
                      key={`${resource}-${action}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addPermission(resource, action);
                          } else {
                            removePermission(resource, action);
                          }
                        }}
                      />
                      <span className="text-sm">
                        {action} {resource}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <Button onClick={savePermissions} className="bg-indigo-600 w-full">
              Save Permissions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}