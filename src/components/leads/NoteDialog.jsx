import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function NoteDialog({ lead, user, open, onClose }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    await base44.entities.Activity.create({ lead_id: lead.id, user_id: user.id, type: "Note", notes: note.trim() });
    setSaving(false);
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note — {lead?.first_name} {lead?.last_name}</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Write your note here..."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="min-h-[120px]"
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !note.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}