import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function QuickNoteCard({ lead, user, onNotePosted }) {
  const [noteText, setNoteText] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!noteText.trim()) return;
    setPosting(true);
    await base44.entities.Activity.create({
      lead_id: lead.id,
      user_id: user.id,
      type: "Note",
      notes: noteText,
    });
    setNoteText("");
    toast.success("Note posted");
    onNotePosted?.();
    setPosting(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Quick Note</h3>
      <Textarea
        placeholder="Add a quick note..."
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        className="text-sm resize-none"
        rows={2}
      />
      <Button
        onClick={handlePost}
        disabled={!noteText.trim() || posting}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 gap-1.5"
      >
        {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Post Note
      </Button>
    </div>
  );
}