import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, FileText, ArrowRightLeft, Clock, User, Calendar } from "lucide-react";
import { fmtSLT } from "@/components/utils/timezone";

const TYPE_CONFIG = {
  Call:          { icon: Phone,          color: "bg-blue-100 text-blue-700" },
  Email:         { icon: Mail,           color: "bg-purple-100 text-purple-700" },
  Note:          { icon: FileText,       color: "bg-yellow-100 text-yellow-700" },
  "Status Change": { icon: ArrowRightLeft, color: "bg-green-100 text-green-700" },
};

function formatDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function ActivityDetailModal({ activity, users, leads, open, onClose }) {
  if (!activity) return null;

  const cfg = TYPE_CONFIG[activity.type] || { icon: FileText, color: "bg-gray-100 text-gray-700" };
  const Icon = cfg.icon;
  const agent = users.find((u) => u.id === activity.user_id);
  const lead = leads.find((l) => l.id === activity.lead_id);
  const leadName = lead ? `${lead.first_name} ${lead.last_name}` : "Unknown Lead";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${cfg.color}`}>
              <Icon className="w-4 h-4" />
            </span>
            Activity Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date & Time</p>
              <p className="text-sm font-medium text-gray-800">
                {activity.created_date ? fmtSLT(activity.created_date) : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Agent</p>
              <p className="text-sm font-medium text-gray-800">{agent?.full_name || "Unknown"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Lead</p>
              <p className="text-sm font-medium text-gray-800">{leadName}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Type</p>
              <Badge className={cfg.color}>{activity.type}</Badge>
            </div>
            {activity.type === "Call" && activity.duration != null && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</p>
                <p className="text-sm font-medium text-gray-800">{formatDuration(activity.duration)}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {activity.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{activity.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}