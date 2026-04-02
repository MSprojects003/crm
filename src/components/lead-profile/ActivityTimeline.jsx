import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, MessageSquare, Clock, RotateCw, Phone, Mail } from "lucide-react";
import { fmtSLT } from "@/components/utils/timezone";

const getActivityIcon = (type) => {
  switch (type) {
    case "Call":
      return <Phone className="w-4 h-4" />;
    case "Email":
      return <Mail className="w-4 h-4" />;
    case "SMS":
      return <MessageSquare className="w-4 h-4" />;
    case "Note":
      return <MessageSquare className="w-4 h-4" />;
    case "Meeting":
      return <Clock className="w-4 h-4" />;
    case "LeadImport":
      return <CheckCircle2 className="w-4 h-4" />;
    case "LeadReassigned":
      return <RotateCw className="w-4 h-4" />;
    case "DialAttempt":
      return <Phone className="w-4 h-4" />;
    case "StatusChange":
      return <RotateCw className="w-4 h-4" />;
    default:
      return <RotateCw className="w-4 h-4" />;
  }
};

const getActivityLabel = (type) => {
  const labels = {
    Call: "Call Logged",
    Email: "Email Sent",
    SMS: "SMS Sent",
    Note: "Note Added",
    Meeting: "Meeting Scheduled",
    LeadImport: "Lead Imported",
    LeadReassigned: "Lead Reassigned",
    DialAttempt: "Dial Attempt",
    StatusChange: "Status Changed",
  };
  return labels[type] || "Activity";
};

const getActivityColor = (type) => {
  const colors = {
    Call: "bg-blue-100 text-blue-700 border-blue-200",
    Email: "bg-purple-100 text-purple-700 border-purple-200",
    SMS: "bg-green-100 text-green-700 border-green-200",
    Note: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Meeting: "bg-indigo-100 text-indigo-700 border-indigo-200",
    LeadImport: "bg-emerald-100 text-emerald-700 border-emerald-200",
    LeadReassigned: "bg-orange-100 text-orange-700 border-orange-200",
    DialAttempt: "bg-cyan-100 text-cyan-700 border-cyan-200",
    StatusChange: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
};

export default function ActivityTimeline({ lead, user, refreshTrigger = 0 }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    if (!lead?.id) return;

    const loadTimeline = async () => {
      setLoading(true);
      try {
        // Fetch activities
        const activities = await base44.entities.Activity.filter(
          { lead_id: lead.id },
          "-created_date",
          100
        );

        // Build timeline
        const items = activities.map((activity) => ({
          id: activity.id,
          type: "activity",
          activityType: activity.type,
          timestamp: activity.created_date,
          userId: activity.user_id,
          content: activity.notes || getActivityLabel(activity.type),
          icon: getActivityIcon(activity.type),
          color: getActivityColor(activity.type),
          data: activity,
        }));

        // Load users to get names
        const users = await base44.entities.User.list();
        const usersByEmail = {};
        users.forEach((u) => {
          usersByEmail[u.email] = u.full_name;
        });
        setUserMap(usersByEmail);

        // Sort by timestamp (newest first)
        items.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        setTimeline(items);
      } catch (err) {
        console.error("Error loading timeline:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [lead?.id, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading timeline...
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No activity history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {timeline.map((item, index) => (
        <div key={item.id} className="relative">
          {/* Timeline line */}
          {index < timeline.length - 1 && (
            <div className="absolute left-4 top-12 h-6 w-0.5 bg-gray-200" />
          )}

          {/* Timeline item */}
          <div className="flex gap-4 pb-6">
            {/* Icon circle */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${item.color}`}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.activityType === "Note"
                      ? "Note Added"
                      : getActivityLabel(item.activityType)}
                  </p>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {fmtSLT(item.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-1">
                  by {userMap[item.userId] || item.userId || "System"}
                </p>

                {item.content && (
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words">
                    {item.content}
                  </p>
                )}

                {item.data.duration && (
                  <p className="text-xs text-gray-500 mt-2">
                    Duration: {item.data.duration} minutes
                  </p>
                )}

                {item.data.outcome && (
                   <p className="text-xs text-gray-600 mt-2">
                     <strong>Outcome:</strong> {item.data.outcome}
                   </p>
                 )}

                {item.data.previous_value && (
                   <p className="text-xs text-gray-600 mt-2">
                     <strong>From:</strong> {item.data.previous_value || "Unassigned"} → <strong>To:</strong> {item.data.new_value || "Unassigned"}
                   </p>
                 )}

                {item.data.source && (
                   <p className="text-xs text-gray-600 mt-2">
                     <strong>Source:</strong> {item.data.source}
                   </p>
                 )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}