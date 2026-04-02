import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import ActivityCard from "@/components/lead-profile/ActivityCard";
import ActivityFormDialog from "@/components/lead-profile/ActivityFormDialog";

export default function LeadActivitiesSection({ lead, user, refreshTrigger = 0 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!lead?.id) return;
    setLoading(true);
    base44.entities.Activity.filter({ lead_id: lead.id }, "-created_date", 100)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [lead?.id, refreshTrigger]);

  const handleAddActivity = async (activityData) => {
    const newActivity = await base44.entities.Activity.create({
      ...activityData,
      lead_id: lead.id,
      user_id: user.id,
    });
    setActivities(prev => [newActivity, ...prev]);
    setShowForm(false);
  };

  const handleDeleteActivity = async (activityId) => {
    await base44.entities.Activity.delete(activityId);
    setActivities(prev => prev.filter(a => a.id !== activityId));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8 text-gray-400"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
        <Button onClick={() => setShowForm(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1" /> Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No activities yet. Create one to get started.</div>
      ) : (
        <div className="space-y-2">
          {activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} onDelete={() => handleDeleteActivity(activity.id)} />
          ))}
        </div>
      )}

      <ActivityFormDialog open={showForm} onClose={() => setShowForm(false)} onSave={handleAddActivity} />
    </div>
  );
}