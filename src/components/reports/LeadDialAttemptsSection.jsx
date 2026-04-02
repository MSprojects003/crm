import { useMemo } from "react";
import { Phone, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LeadDialAttemptsSection({ leads = [], users = [] }) {
  const userMap = useMemo(() => {
    const map = {};
    users.forEach(u => map[u.id] = u.full_name || u.email);
    return map;
  }, [users]);

  const stats = useMemo(() => {
    const leadsWithDials = leads.filter(l => (l.dial_attempts || 0) > 0);
    const totalDials = leadsWithDials.reduce((sum, l) => sum + (l.dial_attempts || 0), 0);
    const avgDials = leadsWithDials.length > 0 ? (totalDials / leadsWithDials.length).toFixed(1) : 0;
    const unassignedLeads = leads.filter(l => !l.assigned_user_id && (l.dial_attempts || 0) > 0).length;

    return {
      leadsWithDials: leadsWithDials.length,
      totalDials,
      avgDials,
      unassignedLeads,
      topLeads: leadsWithDials.sort((a, b) => (b.dial_attempts || 0) - (a.dial_attempts || 0)).slice(0, 10)
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Lead Dial Attempts
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Leads Contacted</p>
          <p className="text-3xl font-bold text-blue-600">{stats.leadsWithDials}</p>
          <p className="text-xs text-gray-400 mt-1">{Math.round((stats.leadsWithDials / leads.length) * 100)}% of total</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Dials</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalDials}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.avgDials} avg per lead</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Unassigned</p>
          <p className="text-3xl font-bold text-red-600">{stats.unassignedLeads}</p>
          <p className="text-xs text-gray-400 mt-1">Reached dial limit</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Most Contacted</p>
          <p className="text-3xl font-bold text-purple-600">{stats.topLeads[0]?.dial_attempts || 0}</p>
          <p className="text-xs text-gray-400 mt-1">max dials on a lead</p>
        </div>
      </div>

      {/* Top Contacted Leads */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Top 10 Most Contacted Leads</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Lead Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Dial Attempts</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Current Agent</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.topLeads.map((lead, idx) => (
                <tr key={lead.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-blue-100 text-blue-800">{lead.dial_attempts}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {lead.assigned_user_id ? userMap[lead.assigned_user_id] || "Unknown" : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {!lead.assigned_user_id ? (
                      <div className="flex items-center gap-1 text-orange-600 text-xs font-semibold">
                        <AlertCircle className="w-3 h-3" /> Unassigned
                      </div>
                    ) : (
                      <span className="text-green-600 text-xs font-semibold">Assigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}