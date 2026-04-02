import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Play, Pause } from "lucide-react";
import FollowUpSequenceForm from "./FollowUpSequenceForm";

export default function FollowUpSequenceManager() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    try {
      const data = await base44.entities.FollowUpSequence.list("-created_date", 100);
      setSequences(data);
    } catch (err) {
      console.error("Failed to load sequences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      if (editingSequence) {
        await base44.entities.FollowUpSequence.update(editingSequence.id, form);
      } else {
        await base44.entities.FollowUpSequence.create(form);
      }
      loadSequences();
      setShowForm(false);
      setEditingSequence(null);
    } catch (err) {
      console.error("Failed to save sequence:", err);
      alert("Error saving sequence");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sequence?")) return;
    try {
      await base44.entities.FollowUpSequence.delete(id);
      loadSequences();
    } catch (err) {
      console.error("Failed to delete sequence:", err);
      alert("Error deleting sequence");
    }
  };

  const toggleEnabled = async (seq) => {
    try {
      await base44.entities.FollowUpSequence.update(seq.id, { enabled: !seq.enabled });
      loadSequences();
    } catch (err) {
      console.error("Failed to toggle sequence:", err);
    }
  };

  const getTriggerLabel = (seq) => {
    if (seq.trigger_type === "status_change") return `When status = ${seq.trigger_status}`;
    if (seq.trigger_type === "time_based") return `After ${seq.trigger_days} days`;
    if (seq.trigger_type === "no_contact") return `No contact for ${seq.trigger_days} days`;
    return "Unknown trigger";
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading sequences...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Follow-Up Sequences</h3>
        <Button onClick={() => { setEditingSequence(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1" /> New Sequence
        </Button>
      </div>

      {sequences.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No follow-up sequences yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sequences.map(seq => (
            <Card key={seq.id} className="p-4 border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{seq.name}</h4>
                    <Badge className={seq.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {seq.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{getTriggerLabel(seq)}</p>
                  <div className="text-xs text-gray-500">
                    <p>Notify via: <span className="font-medium capitalize">{seq.notification_type}</span></p>
                    {seq.follow_up_intervals && seq.follow_up_intervals.length > 0 && (
                      <p className="mt-1">{seq.follow_up_intervals.length} additional follow-ups scheduled</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleEnabled(seq)}
                    className="gap-1 text-xs"
                  >
                    {seq.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditingSequence(seq); setShowForm(true); }}
                    className="gap-1 text-xs"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(seq.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <FollowUpSequenceForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingSequence(null); }}
        onSave={handleSave}
        initialData={editingSequence}
      />
    </div>
  );
}