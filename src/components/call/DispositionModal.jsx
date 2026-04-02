import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

const REMINDER_TYPES = ["Call", "Email", "SMS"];

export default function DispositionModal({ lead, user, callData, onDone }) {
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [status, setStatus] = useState(lead.status_id || "");
  const [notes, setNotes] = useState(callData.notes || "");
  const [description, setDescription] = useState("");
  const [clientFeedback, setClientFeedback] = useState("");
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpType, setFollowUpType] = useState("Call");

  useEffect(() => {
    base44.entities.LeadStatus.list().then(setStatuses);
  }, []);

  const handleSave = async () => {
    setSaving(true);

    // 1. Update lead status
    await base44.entities.Lead.update(lead.id, { status_id: status });

    // 2. Log activity
    await base44.entities.Activity.create({
      lead_id: lead.id,
      user_id: user.id,
      type: "Call",
      duration: callData.duration,
      notes,
    });

    // 2b. Update lead with description and feedback
    if (description || clientFeedback) {
      await base44.entities.Lead.update(lead.id, {
        notes: description || lead.notes,
        client_feedback: clientFeedback || lead.client_feedback,
      });
    }

    // 3. Schedule follow-up reminder if requested
    if (scheduleFollowUp && followUpDate) {
      await base44.entities.Reminder.create({
        lead_id: lead.id,
        user_id: user.id,
        type: followUpType,
        due_datetime: new Date(followUpDate).toISOString(),
        status: "Pending",
      });
    }



    setSaving(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4">
          <h2 className="text-white font-bold text-lg">Call Disposition</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {lead.first_name} {lead.last_name} · {Math.floor(callData.duration / 60)}m {callData.duration % 60}s
          </p>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Status */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Lead Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Call Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Call summary..."
              className="h-20 resize-none text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Lead description and background..."
              className="h-20 resize-none text-sm"
            />
          </div>

          {/* Client Feedback */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Client Feedback</Label>
            <Textarea
              value={clientFeedback}
              onChange={e => setClientFeedback(e.target.value)}
              placeholder="Client's feedback and response..."
              className="h-20 resize-none text-sm"
            />
          </div>

          {/* Schedule Follow-up */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-semibold text-gray-700 cursor-pointer">Schedule Follow-up</Label>
              </div>
              <Switch checked={scheduleFollowUp} onCheckedChange={setScheduleFollowUp} />
            </div>
            {scheduleFollowUp && (
              <div className="space-y-2 pt-1">
                <Select value={followUpType} onValueChange={setFollowUpType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>


        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onDone} disabled={saving}>Skip</Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save & Close
          </Button>
        </div>
      </div>
    </div>
  );
}