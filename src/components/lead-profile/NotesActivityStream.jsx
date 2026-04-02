import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { fmtSLT } from "@/components/utils/timezone";
import { Send, Loader2 } from "lucide-react";
import MentionTextarea from "./MentionTextarea";

const activityTypeConfig = {
  Note:               { label: "Note",             color: "bg-blue-100 text-blue-700" },
  Call:               { label: "WhatsApp Call",    color: "bg-green-100 text-green-700" },
  "Call Logged":      { label: "WhatsApp Call",    color: "bg-green-100 text-green-700" },
  "Status Updated":   { label: "Status Updated",  color: "bg-purple-100 text-purple-700" },
  "Deposit Recorded": { label: "Deposit Recorded", color: "bg-amber-100 text-amber-700" },
  Meeting:            { label: "Meeting",          color: "bg-yellow-100 text-yellow-700" },
  LeadImport:         { label: "Lead Import",      color: "bg-gray-100 text-gray-700" },
  LeadReassigned:     { label: "Reassigned",       color: "bg-orange-100 text-orange-700" },
  StatusChange:       { label: "Status Change",    color: "bg-purple-100 text-purple-700" },
  DialAttempt:        { label: "Dial Attempt",     color: "bg-cyan-100 text-cyan-700" },
  SMS:                { label: "SMS",              color: "bg-sky-100 text-sky-700" },
  Email:              { label: "Email",            color: "bg-indigo-100 text-indigo-700" },
};

// Extract @mentioned names from text
function extractMentions(text) {
  const matches = text.match(/@([A-Za-z][A-Za-z0-9 ]+?)(?=\s|$|[^a-zA-Z0-9 ])/g) || [];
  return matches.map(m => m.slice(1).trim());
}

export default function NotesActivityStream({ lead, user, refreshTrigger, onActivityAdded, users = [] }) {
  const [activities, setActivities] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!lead?.id) return;
    setLoading(true);
    base44.entities.Activity.filter({ lead_id: lead.id }, "-created_date", 50)
      .then((data) => { setActivities(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lead?.id, refreshTrigger]);

  const handlePostNote = async () => {
    if (!noteText.trim()) return;
    setPosting(true);

    await base44.entities.Activity.create({
      lead_id: lead.id,
      user_id: user.id,
      type: "Note",
      notes: noteText,
    });

    // Handle @mentions → create notifications
    const mentionedNames = extractMentions(noteText);
    if (mentionedNames.length > 0 && users.length > 0) {
      const leadName = `${lead.first_name} ${lead.last_name}`;
      const mentionerName = user.full_name || user.email;
      for (const name of mentionedNames) {
        const mentionedUser = users.find(u =>
          u.full_name?.toLowerCase() === name.toLowerCase() ||
          u.email?.toLowerCase() === name.toLowerCase()
        );
        if (mentionedUser && mentionedUser.id !== user.id) {
          const key = `mention_${lead.id}_${mentionedUser.id}_${Date.now()}`;
          base44.entities.LeadNotification.create({
            lead_id: lead.id,
            user_id: mentionedUser.id,
            lead_name: leadName,
            lead_phone: lead.phone || "",
            lead_status: lead.lead_status || "",
            is_read: false,
            notification_key: key,
            type: "Mention",
            mentioned_by: mentionerName,
            message: `${mentionerName} mentioned you in a note on "${leadName}"`,
          }).catch(() => {});
        }
      }
    }

    setNoteText("");
    onActivityAdded();
    setPosting(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Notes & Activity</h2>

      {/* Note Input with @mention support */}
      <div className="border-b border-gray-200 pb-4 space-y-3">
        <MentionTextarea
          value={noteText}
          onChange={setNoteText}
          users={users}
          placeholder="Add a note… type @ to mention a user"
          rows={3}
        />
        <div className="flex justify-start">
          <Button
            onClick={handlePostNote}
            disabled={!noteText.trim() || posting}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post Note
          </Button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No activities yet</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                  {activity.created_by?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{activity.created_by || "Unknown"}</span>
                  {activityTypeConfig[activity.type] && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${activityTypeConfig[activity.type].color}`}>
                      {activityTypeConfig[activity.type].label}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {activity.created_date ? fmtSLT(activity.created_date) : ""}
                  </span>
                </div>
                {(activity.previous_value || activity.new_value) && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                    {activity.previous_value && <span className="bg-gray-100 px-1.5 py-0.5 rounded line-through">{activity.previous_value}</span>}
                    {activity.previous_value && activity.new_value && <span>→</span>}
                    {activity.new_value && <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">{activity.new_value}</span>}
                  </div>
                )}
                {activity.notes && (
                  <p className="text-sm text-gray-700 mt-2 break-words whitespace-pre-line">
                    {activity.notes.split(/(@[A-Za-z][A-Za-z0-9 ]+?)(?=\s|$)/).map((part, i) =>
                      part.startsWith("@")
                        ? <span key={i} className="text-blue-600 font-medium">{part}</span>
                        : part
                    )}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}