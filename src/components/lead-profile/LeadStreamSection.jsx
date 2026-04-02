import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import StreamEntry from "@/components/lead-profile/StreamEntry";

export default function LeadStreamSection({ lead, user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!lead?.id) return;
    // For now, we'll fetch activities as stream entries
    // In a real implementation, you'd have a separate Stream entity
    base44.entities.Activity.filter({ lead_id: lead.id }, "-created_date", 50)
      .then(activities => {
        const streamEntries = activities.map(activity => ({
          id: activity.id,
          type: activity.type === "Note" ? "Note" : "Activity",
          content: activity.notes || `${activity.type} logged`,
          user_name: user?.full_name || "System",
          timestamp: activity.created_date,
          details: activity,
        }));
        setEntries(streamEntries);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [lead?.id, user]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setPosting(true);
    try {
      const newActivity = await base44.entities.Activity.create({
        lead_id: lead.id,
        user_id: user.id,
        type: "Note",
        notes: noteText,
      });

      const newEntry = {
        id: newActivity.id,
        type: "Note",
        content: noteText,
        user_name: user.full_name,
        timestamp: newActivity.created_date,
        details: newActivity,
      };

      setEntries(prev => [newEntry, ...prev]);
      setNoteText("");
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8 text-gray-400"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading stream...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Note */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">Add Note</label>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write your note here..."
          className="min-h-20 mb-3"
        />
        <Button
          onClick={handleAddNote}
          disabled={!noteText.trim() || posting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {posting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          Post Note
        </Button>
      </div>

      {/* Stream Entries */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Stream</h3>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No activity yet.</div>
        ) : (
          entries.map(entry => (
            <StreamEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}