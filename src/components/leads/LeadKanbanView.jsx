import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Bell, FileText, Eye } from "lucide-react";

export default function LeadKanbanView({ leads, users, statuses = [], onQuickCall, onScheduleReminder, onAddNote, onViewDetails }) {
  const usersMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));
  const activeStatuses = statuses.length > 0 ? statuses : [];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {activeStatuses.map(status => {
        const col = leads.filter(l => l.status_id === status.id);
        return (
          <div key={status.id} className="flex-shrink-0 w-60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{status.name}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{col.length}</span>
            </div>
            <div className="space-y-2 min-h-[120px] bg-gray-50 rounded-xl p-2 border-t-4" style={{ borderTopColor: status.color || '#9ca3af' }}>
              {col.map(lead => (
                <div key={lead.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-medium text-gray-800 text-sm truncate">{lead.first_name} {lead.last_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{lead.phone}</div>
                  {lead.assigned_user_id && (
                    <div className="text-xs text-gray-400 mt-1 truncate">👤 {usersMap[lead.assigned_user_id] || "—"}</div>
                  )}
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50 flex-1" onClick={() => onQuickCall(lead)}>
                      <Phone className="w-3 h-3 mr-1" /> Call
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-500" title="Reminder" onClick={() => onScheduleReminder(lead)}>
                      <Bell className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-yellow-500" title="Note" onClick={() => onAddNote(lead)}>
                      <FileText className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-500" title="Details" onClick={() => onViewDetails(lead)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}