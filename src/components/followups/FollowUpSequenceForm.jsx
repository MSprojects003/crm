import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

const LEAD_STATUSES = ["Unassigned", "Unhandled", "No Answer", "Not Interested", "Follow Up", "Priority", "User Busy", "Wrong Number", "Converted", "Other Language", "Duplicate", "Delete", "Dormant", "Sleeper Cell"];

export default function FollowUpSequenceForm({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(initialData || {
    name: "",
    enabled: true,
    trigger_type: "status_change",
    trigger_status: "",
    trigger_days: 1,
    notification_type: "in_app",
    subject: "",
    message_template: "",
    follow_up_intervals: [],
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.message_template.trim()) {
      alert("Please fill in name and message template");
      return;
    }
    onSave(form);
  };

  const addInterval = () => {
    setForm(f => ({
      ...f,
      follow_up_intervals: [...f.follow_up_intervals, { day: 1, message: "" }],
    }));
  };

  const updateInterval = (idx, field, val) => {
    setForm(f => ({
      ...f,
      follow_up_intervals: f.follow_up_intervals.map((interval, i) => 
        i === idx ? { ...interval, [field]: val } : interval
      ),
    }));
  };

  const removeInterval = (idx) => {
    setForm(f => ({
      ...f,
      follow_up_intervals: f.follow_up_intervals.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Follow-Up Sequence</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div>
            <Label className="text-xs mb-1.5 block">Sequence Name</Label>
            <Input
              placeholder="e.g., Follow Up Cold Leads"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="enabled"
              checked={form.enabled}
              onCheckedChange={checked => setForm({ ...form, enabled: checked })}
            />
            <Label htmlFor="enabled" className="text-sm cursor-pointer">Active</Label>
          </div>

          {/* Trigger Type */}
          <div>
            <Label className="text-xs mb-1.5 block">Trigger Type</Label>
            <Select value={form.trigger_type} onValueChange={val => setForm({ ...form, trigger_type: val })}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status_change">When Status Changes To</SelectItem>
                <SelectItem value="time_based">After X Days (from creation)</SelectItem>
                <SelectItem value="no_contact">No Contact for X Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trigger Config */}
          {form.trigger_type === "status_change" && (
            <div>
              <Label className="text-xs mb-1.5 block">Target Status</Label>
              <Select value={form.trigger_status || ""} onValueChange={val => setForm({ ...form, trigger_status: val })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(form.trigger_type === "time_based" || form.trigger_type === "no_contact") && (
            <div>
              <Label className="text-xs mb-1.5 block">Days</Label>
              <Input
                type="number"
                min="1"
                value={form.trigger_days}
                onChange={e => setForm({ ...form, trigger_days: parseInt(e.target.value) || 1 })}
              />
            </div>
          )}

          {/* Notification Type */}
          <div>
            <Label className="text-xs mb-1.5 block">Notification Type</Label>
            <Select value={form.notification_type} onValueChange={val => setForm({ ...form, notification_type: val })}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">In-App Only</SelectItem>
                <SelectItem value="email">Email Only</SelectItem>
                <SelectItem value="both">Email + In-App</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email Subject */}
          {(form.notification_type === "email" || form.notification_type === "both") && (
            <div>
              <Label className="text-xs mb-1.5 block">Email Subject</Label>
              <Input
                placeholder="e.g., Follow-up: {lead_name}"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
              />
            </div>
          )}

          {/* Message Template */}
          <div>
            <Label className="text-xs mb-1.5 block">Message Template</Label>
            <Textarea
              placeholder="Message content. Use {lead_name}, {lead_phone}, {lead_email} for dynamic values"
              value={form.message_template}
              onChange={e => setForm({ ...form, message_template: e.target.value })}
              className="h-24"
            />
            <p className="text-xs text-gray-500 mt-1">Variables: {'{lead_name}'}, {'{lead_phone}'}, {'{lead_email}'}</p>
          </div>

          {/* Follow-Up Intervals */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">Additional Follow-Ups</Label>
              <Button size="sm" variant="outline" onClick={addInterval} className="gap-1">
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
            {form.follow_up_intervals.map((interval, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-end">
                <div className="flex-shrink-0">
                  <Label className="text-xs mb-1 block">Days After</Label>
                  <Input
                    type="number"
                    min="1"
                    value={interval.day}
                    onChange={e => updateInterval(idx, "day", parseInt(e.target.value) || 1)}
                    className="w-20 h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">Message</Label>
                  <Input
                    placeholder="Follow-up message"
                    value={interval.message}
                    onChange={e => updateInterval(idx, "message", e.target.value)}
                    className="h-8"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeInterval(idx)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Sequence</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}