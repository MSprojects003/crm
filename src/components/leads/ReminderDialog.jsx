import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReminderDialog({ lead, user, open, onClose }) {
  const [type, setType] = useState("Call");
  const [datetime, setDatetime] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!datetime) return;
    setSaving(true);
    await base44.entities.Reminder.create({
      lead_id: lead.id,
      user_id: user.id,
      type,
      due_datetime: new Date(datetime).toISOString(),
      status: "Pending",
    });
    setSaving(false);
    setDatetime("");
    setType("Call");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Reminder — {lead?.first_name} {lead?.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Call">Call</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Date & Time</Label>
            <Input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !datetime} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Saving..." : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}