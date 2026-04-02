import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Loader2 } from "lucide-react";

export function AssignToAgentModal({ open, onClose, selectedLeads, agents, leads, onDone }) {
  const [agentId, setAgentId] = useState("");
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const handleAssign = async () => {
    if (!agentId) return;
    setSaving(true);

    const targetLeads = leads.filter(l => selectedLeads.includes(l.id));
    let assigned = 0, skipped = 0;

    for (const lead of targetLeads) {
      if (!overrideExisting && lead.assigned_user_id) {
        skipped++;
        continue;
      }
      const oldUserId = lead.assigned_user_id;
      await base44.entities.Lead.update(lead.id, { assigned_user_id: agentId });
      
      // Trigger reassignment notification if lead is Converted
      if (lead.lead_status === 'Converted' && oldUserId !== agentId) {
        try {
          await base44.functions.invoke('notifyLeadReassignment', {
            leadId: lead.id,
            newUserId: agentId,
            oldUserId: oldUserId
          });
        } catch (err) {
          console.error('Failed to send reassignment notification:', err);
        }
      }
      
      assigned++;
    }

    const agent = agents.find(a => a.id === agentId);
    setResult({
      selected: selectedLeads.length,
      assigned,
      skipped,
      agents: [agent?.full_name || agent?.email || "Unknown"],
    });
    setSaving(false);
  };

  const handleDone = () => {
    onDone();
    setAgentId("");
    setOverrideExisting(false);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => { if (!saving) { setResult(null); setAgentId(""); setOverrideExisting(false); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to Specific Agent</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">{selectedLeads.length} leads selected</p>
            <div>
              <Label className="text-xs mb-1 block">Select Agent</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger><SelectValue placeholder="Choose agent..." /></SelectTrigger>
                <SelectContent>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name || a.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="override-existing" checked={overrideExisting} onCheckedChange={setOverrideExisting} />
              <Label htmlFor="override-existing" className="text-sm cursor-pointer text-gray-700">
                Override existing assignments
              </Label>
            </div>
            {!overrideExisting && (
              <p className="text-xs text-gray-400">Leads already assigned to an agent will be skipped.</p>
            )}
          </div>
        ) : (
          <ResultSummary result={result} />
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!agentId || saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Assigning...</> : "Assign"}
              </Button>
            </>
          ) : (
            <Button onClick={handleDone} className="bg-green-600 hover:bg-green-700 text-white">Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RoundRobinModal({ open, onClose, selectedLeads, agents, leads, onDone }) {
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const toggleAgent = (id) => {
    setSelectedAgentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAssign = async () => {
    if (selectedAgentIds.length === 0) return;
    setSaving(true);

    const targetLeads = leads.filter(l => selectedLeads.includes(l.id));
    const selectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));
    let index = 0;
    let assigned = 0, skipped = 0;

    for (const lead of targetLeads) {
      if (!overrideExisting && lead.assigned_user_id) {
        skipped++;
        continue;
      }
      const agent = selectedAgents[index % selectedAgents.length];
      const oldUserId = lead.assigned_user_id;
      await base44.entities.Lead.update(lead.id, { assigned_user_id: agent.id });
      
      // Trigger reassignment notification if lead is Converted
      if (lead.lead_status === 'Converted' && oldUserId !== agent.id) {
        try {
          await base44.functions.invoke('notifyLeadReassignment', {
            leadId: lead.id,
            newUserId: agent.id,
            oldUserId: oldUserId
          });
        } catch (err) {
          console.error('Failed to send reassignment notification:', err);
        }
      }
      
      index++;
      assigned++;
    }

    setResult({
      selected: selectedLeads.length,
      assigned,
      skipped,
      agents: selectedAgents.map(a => a.full_name || a.email),
    });
    setSaving(false);
  };

  const handleDone = () => {
    onDone();
    setSelectedAgentIds([]);
    setOverrideExisting(false);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => { if (!saving) { setResult(null); setSelectedAgentIds([]); setOverrideExisting(false); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Round Robin Assignment</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">{selectedLeads.length} leads will be distributed.</p>
            <div>
              <Label className="text-xs mb-2 block font-semibold text-gray-700">
                Select Agents for Distribution <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-3">
                {agents.length === 0 && <p className="text-xs text-gray-400">No active agents found.</p>}
                {agents.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`rr-${a.id}`}
                      checked={selectedAgentIds.includes(a.id)}
                      onCheckedChange={() => toggleAgent(a.id)}
                    />
                    <Label htmlFor={`rr-${a.id}`} className="text-sm cursor-pointer">{a.full_name || a.email}</Label>
                  </div>
                ))}
              </div>
              {selectedAgentIds.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">{selectedAgentIds.length} agent(s) selected</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="rr-override" checked={overrideExisting} onCheckedChange={setOverrideExisting} />
              <Label htmlFor="rr-override" className="text-sm cursor-pointer text-gray-700">
                Override existing assignments
              </Label>
            </div>
            {!overrideExisting && (
              <p className="text-xs text-gray-400">Leads already assigned to an agent will be skipped.</p>
            )}
          </div>
        ) : (
          <ResultSummary result={result} />
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleAssign} disabled={selectedAgentIds.length === 0 || saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Assigning...</> : "Confirm & Assign"}
              </Button>
            </>
          ) : (
            <Button onClick={handleDone} className="bg-green-600 hover:bg-green-700 text-white">Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultSummary({ result }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="font-semibold text-green-900">Assignment Complete</span>
      </div>
      {[
        ["Leads Selected", result.selected],
        ["Leads Assigned", result.assigned],
        ["Leads Skipped", result.skipped],
      ].map(([label, val]) => (
        <div key={label} className="flex justify-between text-sm text-green-900">
          <span>{label}:</span><span className="font-semibold">{val}</span>
        </div>
      ))}
      <div className="pt-2 border-t border-green-200">
        <p className="text-sm text-green-900 mb-1">Agents Used:</p>
        <ul className="space-y-0.5">
          {result.agents.map(name => (
            <li key={name} className="text-sm font-semibold text-green-800 ml-2">• {name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}