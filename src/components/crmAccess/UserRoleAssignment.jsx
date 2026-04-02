import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

export default function UserRoleAssignment({ onRefresh }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ user_id: "", role_id: "" });

  useEffect(() => {
    const fetchData = async () => {
      const rolesData = await base44.entities.CRMRole.list();
      setRoles(rolesData);

      const assignmentsData = await base44.entities.UserCRMRole.list();
      setAssignments(assignmentsData);

      const usersData = await base44.entities.User.list();
      setUsers(usersData);
    };
    fetchData();
  }, [onRefresh]);

  const handleAssign = async () => {
    if (newAssignment.user_id && newAssignment.role_id) {
      const currentUser = await base44.auth.me();
      await base44.entities.UserCRMRole.create({
        user_id: newAssignment.user_id,
        role_id: newAssignment.role_id,
        assigned_by: currentUser.email,
      });
      setNewAssignment({ user_id: "", role_id: "" });
      onRefresh();
    }
  };

  const handleRemove = async (id) => {
    await base44.entities.UserCRMRole.delete(id);
    onRefresh();
  };

  const getRoleName = (roleId) => {
    return roles.find((r) => r.id === roleId)?.name || "Unknown";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Assign Role to User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={newAssignment.user_id}
            onChange={(e) =>
              setNewAssignment({ ...newAssignment, user_id: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.email}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>

          <select
            value={newAssignment.role_id}
            onChange={(e) =>
              setNewAssignment({ ...newAssignment, role_id: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <Button onClick={handleAssign} className="bg-indigo-600 w-full">
            <Plus className="w-4 h-4 mr-2" /> Assign Role
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardContent className="flex justify-between items-center pt-6">
              <div>
                <h3 className="font-semibold">{assignment.user_id}</h3>
                <p className="text-sm text-gray-600">
                  {getRoleName(assignment.role_id)}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(assignment.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}