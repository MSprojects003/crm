import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = ["Pending", "Confirmed", "Rejected", "Refunded"];
const PAYMENT_METHODS = ["Credit Card", "Bank Transfer", "Crypto", "Cash", "Other"];

const EMPTY = { lead_id: "", amount: "", status: "Pending", payment_method: "", notes: "", date: new Date().toISOString().split("T")[0] };

export default function AddDepositModal({ open, onClose, onSave, leads }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.lead_id || !form.amount || !form.date) return;
    setSaving(true);
    await onSave({ ...form, amount: parseFloat(form.amount) });
    setForm(EMPTY);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Deposit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Lead */}
          <div className="space-y-1">
            <Label>Lead *</Label>
            <Select value={form.lead_id} onValueChange={v => set("lead_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
              <SelectContent>
                {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.first_name} {l.last_name} · {l.phone}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount (USD) *</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
          </div>

          {/* Status + Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes..." value={form.notes} onChange={e => set("notes", e.target.value)} className="h-20" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.lead_id || !form.amount} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Saving..." : "Add Deposit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}