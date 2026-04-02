import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function scoreAgent({ calls, conversions, revenue, totalRevenue, totalCalls }) {
  const callScore   = totalCalls    > 0 ? (calls / totalCalls) * 40       : 0;
  const convScore   = calls         > 0 ? (conversions / calls) * 35       : 0;
  const revScore    = totalRevenue  > 0 ? (revenue / totalRevenue) * 25    : 0;
  return Math.round(callScore + convScore + revScore);
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function AgentLeaderboard({ users, activities, leads, deposits }) {
  const data = users.filter(u => u.role === "Agent" || u.role === "agent").map(agent => {
    const agentActivities = activities.filter(a => a.user_id === agent.id);
    const calls = agentActivities.filter(a => a.type === "Call").length;
    const agentLeads = leads.filter(l => l.assigned_user_id === agent.id);
    const conversions = agentLeads.filter(l => l.status === "Won").length;
    const revenue = deposits
      .filter(d => d.user_id === agent.id && d.status === "Confirmed")
      .reduce((s, d) => s + (d.amount || 0), 0);
    const convRate = calls > 0 ? ((conversions / calls) * 100).toFixed(1) : "0.0";
    return { agent, calls, conversions, revenue, convRate };
  });

  const totalCalls = data.reduce((s, r) => s + r.calls, 0);
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);

  const ranked = data
    .map(r => ({ ...r, score: scoreAgent({ ...r, totalRevenue, totalCalls }) }))
    .sort((a, b) => b.score - a.score);

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" /> Agent Leaderboard
      </h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {ranked.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No agent data available.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Rank", "Agent", "Calls", "Conversions", "Revenue", "Conv. Rate", "Score"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranked.map((row, i) => (
                <tr key={row.agent.id} className={`hover:bg-gray-50 transition-colors ${i === 0 ? "bg-yellow-50/30" : ""}`}>
                  <td className="px-4 py-3 text-center text-lg w-12">
                    {MEDAL[i] || <span className="text-sm text-gray-400 font-medium">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{row.agent.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.calls}</td>
                  <td className="px-4 py-3 text-gray-600">{row.conversions}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">${row.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge className={`border-0 ${parseFloat(row.convRate) >= 20 ? "bg-green-100 text-green-700" : parseFloat(row.convRate) >= 10 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                      {row.convRate}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(row.score, 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-6">{row.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}