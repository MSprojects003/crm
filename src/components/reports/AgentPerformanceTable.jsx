import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function AgentPerformanceTable({ agents = [], activities = [], leads = [], deposits = [] }) {
  const stats = agents.map(agent => {
    const agentActivities = activities.filter(a => a.user_id === agent.id);
    const calls = agentActivities.filter(a => a.type === "Call").length;
    const agentLeads = leads.filter(l => l.assigned_user_id === agent.id);
    const won = agentLeads.filter(l => l.status === "Won").length;
    const revenue = deposits
      .filter(d => d.user_id === agent.id && d.status === "Confirmed")
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    const convRate = agentLeads.length > 0 ? Math.round((won / agentLeads.length) * 100) : 0;

    return { agent, calls, won, revenue, convRate, totalLeads: agentLeads.length };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Agent Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-5 py-3">Agent</th>
              <th className="text-center px-4 py-3">Calls</th>
              <th className="text-center px-4 py-3">Leads</th>
              <th className="text-center px-4 py-3">Won</th>
              <th className="text-center px-4 py-3">Conv. Rate</th>
              <th className="text-right px-5 py-3">Revenue</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.map(({ agent, calls, won, revenue, convRate, totalLeads }) => {
              const isTop = convRate >= 30;
              const isUnder = convRate < 10 && totalLeads > 2;
              return (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800">{agent.full_name}</div>
                    <div className="text-xs text-gray-400">{agent.email}</div>
                  </td>
                  <td className="text-center px-4 py-3 text-gray-700">{calls}</td>
                  <td className="text-center px-4 py-3 text-gray-700">{totalLeads}</td>
                  <td className="text-center px-4 py-3 text-gray-700">{won}</td>
                  <td className="text-center px-4 py-3">
                    <span className={`font-semibold ${convRate >= 20 ? "text-green-600" : convRate >= 10 ? "text-yellow-600" : "text-red-500"}`}>
                      {convRate}%
                    </span>
                  </td>
                  <td className="text-right px-5 py-3 font-semibold text-gray-800">
                    ${revenue.toLocaleString()}
                  </td>
                  <td className="text-center px-4 py-3">
                    {isTop && <Badge className="bg-green-100 text-green-700 border-0 gap-1"><TrendingUp className="w-3 h-3" /> Top</Badge>}
                    {isUnder && <Badge className="bg-red-100 text-red-700 border-0 gap-1"><TrendingDown className="w-3 h-3" /> Low</Badge>}
                    {!isTop && !isUnder && <Badge className="bg-gray-100 text-gray-500 border-0 gap-1"><Minus className="w-3 h-3" /> Avg</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {stats.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No agent data for this period.</div>
        )}
      </div>
    </div>
  );
}