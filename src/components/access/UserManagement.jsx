import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingCallLimit, setEditingCallLimit] = useState({});
  const [editingName, setEditingName] = useState({ first_name: "", last_name: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  };

  const adminCount = users.filter((u) => u.role === "admin").length;

  const handleCallLimitChange = async (userId, value) => {
    const limit = value === "" ? null : parseInt(value);
    await base44.entities.User.update(userId, { daily_call_limit: limit });
    setEditingCallLimit(prev => ({ ...prev, [userId]: undefined }));
    setMessage("Daily call limit updated");
    setTimeout(() => setMessage(""), 3000);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    const user = users.find((u) => u.id === userId);

    if (user.role === "admin" && adminCount === 1) {
      setMessage("Cannot remove the last Admin user.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    await base44.entities.User.update(userId, { role: newRole });
    setEditingUserId(null);
    setMessage(`Role updated successfully`);
    setTimeout(() => setMessage(""), 3000);
    fetchUsers();
  };

  if (loading) return <div className="p-4">Loading users...</div>;

  return (
    <div className="space-y-4">
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Daily Call Limit</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {editingUserId === user.id ? (
                      <Input
                        className="h-8 w-32 text-xs"
                        value={editingName.first_name}
                        onChange={(e) => setEditingName(n => ({ ...n, first_name: e.target.value }))}
                        placeholder="First name"
                      />
                    ) : (user.first_name || user.full_name?.split(" ")[0] || "—")}
                  </TableCell>
                  <TableCell>
                    {editingUserId === user.id ? (
                      <Input
                        className="h-8 w-32 text-xs"
                        value={editingName.last_name}
                        onChange={(e) => setEditingName(n => ({ ...n, last_name: e.target.value }))}
                        placeholder="Last name"
                      />
                    ) : (user.last_name || user.full_name?.split(" ").slice(1).join(" ") || "—")}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Unlimited"
                        className="h-8 w-28 text-xs"
                        value={editingCallLimit[user.id] !== undefined ? editingCallLimit[user.id] : (user.daily_call_limit ?? "")}
                        onChange={(e) => setEditingCallLimit(prev => ({ ...prev, [user.id]: e.target.value }))}
                        onBlur={(e) => {
                          if (editingCallLimit[user.id] !== undefined) {
                            handleCallLimitChange(user.id, e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCallLimitChange(user.id, e.target.value);
                        }}
                      />
                      <span className="text-xs text-gray-400">{!user.daily_call_limit ? "∞" : `/ day`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingUserId === user.id ? (
                      <div className="flex gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await base44.entities.User.update(user.id, { first_name: editingName.first_name, last_name: editingName.last_name });
                            setEditingUserId(null);
                            setMessage("User updated successfully");
                            setTimeout(() => setMessage(""), 3000);
                            fetchUsers();
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingUserId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUserId(user.id);
                          setEditingName({ first_name: user.first_name || "", last_name: user.last_name || "" });
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {adminCount === 1 && (
        <div className="flex gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            There is only one Admin. Ensure at least one Admin remains in the system.
          </p>
        </div>
      )}
    </div>
  );
}