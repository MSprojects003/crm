import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const callResults = ["Connected", "No Answer", "Busy", "Wrong Number", "Call Back Later"];

export default function CallLogModal({ lead, user, onClose, onLogged }) {
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDatetime, setFollowUpDatetime] = useState("");
  const [loading, setLoading] = useState(false);

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  };

  const handleSubmit = async () => {
    if (!result) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const agentName = user?.full_name || user?.email || "Agent";

      // Update lead
      const updateData = { last_call_datetime: now };

      if (result === "No Answer") {
        updateData.no_answer_times = (lead.no_answer_times || 0) + 1;
        if (updateData.no_answer_times > 7) {
          updateData.lead_status = "Cold Lead";
        }
      }

      if (followUpDatetime) {
        updateData.sales_follow_up_datetime = new Date(followUpDatetime).toISOString();
      }

      await base44.entities.Lead.update(lead.id, updateData);

      // Build structured call log notes
      const callNoteLines = [
        `Agent: ${agentName}`,
        `Call Result: ${result}`,
        notes ? `Notes: ${notes}` : null,
        `Time: ${formatDateTime(now)}`,
      ].filter(Boolean).join("\n");

      // Create WhatsApp call activity
      await base44.entities.Activity.create({
        lead_id: lead.id,
        user_id: user?.email || "",
        type: "Call",
        notes: callNoteLines,
        outcome: result,
      });

      // If follow-up set, create reminder + timeline entry
      if (followUpDatetime) {
        const followUpIso = new Date(followUpDatetime).toISOString();

        await base44.entities.Reminder.create({
          lead_id: lead.id,
          user_id: user?.email || "",
          type: "Call",
          status: "Pending",
          due_datetime: followUpIso,
          notes: "Follow-up scheduled from WhatsApp Call Log",
        });

        await base44.entities.Activity.create({
          lead_id: lead.id,
          user_id: user?.email || "",
          type: "Note",
          notes: `Follow Up Scheduled\nFollow Up Time: ${formatDateTime(followUpDatetime)}\nCreated By: ${agentName}`,
        });
      }

      onLogged({ result });
    } catch (error) {
      console.error("Failed to log call:", error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>WhatsApp Call Log</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium">Call Result *</Label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                {callResults.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Call Notes</Label>
            <Textarea
              placeholder="Notes about the call..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Follow-Up Date & Time (optional)</Label>
            <Input
              type="datetime-local"
              value={followUpDatetime}
              onChange={(e) => setFollowUpDatetime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!result || loading}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Log WhatsApp Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}