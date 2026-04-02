import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Globe, User, Calendar, DollarSign } from "lucide-react";

const STATUS_COLORS = {
  New: "bg-gray-100 text-gray-700", Contacted: "bg-blue-100 text-blue-700",
  Qualified: "bg-indigo-100 text-indigo-700", Proposal: "bg-purple-100 text-purple-700",
  Negotiation: "bg-yellow-100 text-yellow-700", Won: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700", "No Answer": "bg-gray-100 text-gray-500", Callback: "bg-amber-100 text-amber-700",
};

export default function LeadDetailDrawer({ lead, users, open, onClose }) {
  const [activities, setActivities] = useState([]);

  const usersMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));

  useEffect(() => {
    if (!lead?.id || !open) return;
    base44.entities.Activity.filter({ lead_id: lead.id }, "-created_date", 20).then(setActivities);
  }, [lead?.id, open]);

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{lead.first_name} {lead.last_name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={`${STATUS_COLORS[lead.status] || "bg-gray-100"} border-0`}>{lead.status}</Badge>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            {[
              { icon: Phone, label: "Phone", value: lead.phone },
              { icon: Mail, label: "Email", value: lead.email },
              { icon: MapPin, label: "City", value: lead.city },
              { icon: Globe, label: "Language", value: lead.language },
              { icon: Globe, label: "Source", value: lead.source },
              { icon: User, label: "Assigned", value: usersMap[lead.assigned_user_id] },
              { icon: DollarSign, label: "Potential Value", value: lead.potential_value ? `$${lead.potential_value.toLocaleString()}` : null },
              { icon: Calendar, label: "Created", value: lead.created_date ? new Date(lead.created_date).toLocaleDateString() : null },
            ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-24 flex-shrink-0">{label}</span>
                <span className="text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Activity Log */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Activity Log</h4>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400">No activities yet.</p>
            ) : (
              <div className="space-y-2">
                {activities.map(a => (
                  <div key={a.id} className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{a.type}</span>
                      <span className="text-xs text-gray-400">{a.created_date ? new Date(a.created_date).toLocaleString() : ""}</span>
                    </div>
                    {a.notes && <p className="text-gray-500 mt-0.5 text-xs">{a.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}