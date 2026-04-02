import { useMemo } from "react";
import { Phone, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LeadDialHistorySection({ lead, users = [] }) {
  const totalAttempts = lead?.dial_attempts || 0;
  const agentHistory = lead?.agent_dial_history || [];

  const userMap = useMemo(() => {
    const map = {};
    users.forEach(u => map[u.id] = u.full_name || u.email);
    return map;
  }, [users]);

  if (totalAttempts === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Phone className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No dial attempts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Dials</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalAttempts}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agents</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">{agentHistory.length}</p>
        </div>
      </div>

      {/* Agent Dial History */}
      {agentHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Dial History by Agent</h3>
          <div className="space-y-2">
            {agentHistory.map((record, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {userMap[record.agent_id]?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{userMap[record.agent_id] || "Unknown Agent"}</p>
                    <p className="text-xs text-gray-500">{record.agent_id}</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 ml-2 flex-shrink-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {record.dial_count} call{record.dial_count !== 1 ? "s" : ""}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}