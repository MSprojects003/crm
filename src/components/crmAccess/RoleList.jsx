import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

export default function RoleList({ onRefresh }) {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ name: "", hierarchy_level: 1 });

  useEffect(() => {
    const fetchRoles = async () => {
      const data = await base44.entities.CRMRole.list();
      setRoles(data);
    };
    fetchRoles();
  }, [onRefresh]);

  const handleCreate = async () => {
    if (newRole.name) {
      await base44.entities.CRMRole.create({
        name: newRole.name,
        hierarchy_level: parseInt(newRole.hierarchy_level),
        permissions: [],
      });
      setNewRole({ name: "", hierarchy_level: 1 });
      onRefresh();
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.CRMRole.delete(id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Role name"
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
          />
          <select
            value={newRole.hierarchy_level}
            onChange={(e) =>
              setNewRole({ ...newRole, hierarchy_level: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value={0}>User (Level 0)</option>
            <option value={1}>Manager (Level 1)</option>
            <option value={2}>Admin (Level 2)</option>
            <option value={3}>SuperAdmin (Level 3)</option>
          </select>
          <Button onClick={handleCreate} className="bg-indigo-600 w-full">
            <Plus className="w-4 h-4 mr-2" /> Create Role
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardContent className="flex justify-between items-center pt-6">
              <div>
                <h3 className="font-semibold">{role.name}</h3>
                <p className="text-sm text-gray-600">
                  Level {role.hierarchy_level}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(role.id)}
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