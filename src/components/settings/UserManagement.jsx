import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Target, Users, Loader2 } from "lucide-react";

export default function UserManagement({ users, onRefresh }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Agent");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [targets, setTargets] = useState({});
  const [savingTarget, setSavingTarget] = useState(null);

  const agents = users.filter(u => u.role === "user");

  const handleInvite = async () => {
     if (!inviteEmail.trim()) return;
     setInviting(true);
     setInviteMsg("");
     const baseRole = inviteRole === "Admin" ? "admin" : "user";
     await base44.users.inviteUser(inviteEmail.trim(), baseRole);
     setInviteMsg(`Invite sent to ${inviteEmail}`);
     setInviteEmail("");
     setInviting(false);
     setTimeout(() => setInviteMsg(""), 4000);
   };

  const handleSaveTarget = async (userId) => {
    const val = targets[userId];
    if (!val) return;
    setSavingTarget(userId);
    await base44.entities.User.update ? 
      base44.entities.User.update(userId, { daily_call_target: parseInt(val) }) :
      null;
    setSavingTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Invite Agent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-4 h-4 text-blue-600" /> Invite User
          </CardTitle>
          <CardDescription>Send an invitation to a new agent or admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs mb-1 block text-gray-600">Email address</Label>
              <Input
                type="email"
                placeholder="agent@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-gray-600">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="h-9 bg-blue-600 hover:bg-blue-700 text-white">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
              </Button>
            </div>
          </div>
          {inviteMsg && <p className="text-sm text-green-600">{inviteMsg}</p>}
        </CardContent>
      </Card>

      {/* Agent List + Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-indigo-600" /> Agents
          </CardTitle>
          <CardDescription>View agents and set their daily call targets</CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No agents yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-4 py-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{agent.full_name}</p>
                    <p className="text-xs text-gray-400">{agent.email}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">Active</Badge>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      placeholder={agent.daily_call_target || "20"}
                      value={targets[agent.id] ?? agent.daily_call_target ?? ""}
                      onChange={e => setTargets(t => ({ ...t, [agent.id]: e.target.value }))}
                      className="h-8 w-20 text-xs"
                    />
                    <span className="text-xs text-gray-500">calls/day</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleSaveTarget(agent.id)}
                      disabled={savingTarget === agent.id}
                    >
                      {savingTarget === agent.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}