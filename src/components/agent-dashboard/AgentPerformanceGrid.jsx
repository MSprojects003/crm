import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";

function ConvBadge({ rate }) {
  const r = parseFloat(rate);
  if (r >= 20) return <Badge className="bg-green-100 text-green-700 border-0 gap-1"><TrendingUp className="w-3 h-3" />{rate}%</Badge>;
  if (r >= 10) return <Badge className="bg-yellow-100 text-yellow-700 border-0 gap-1"><Minus className="w-3 h-3" />{rate}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-0 gap-1"><TrendingDown className="w-3 h-3" />{rate}%</Badge>;
}

function ProgressBar({ value, max, color = "bg-blue-500" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[48px]">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  );
}

function RateBadge({ rate }) {
  const r = parseFloat(rate);
  if (r >= 20) return <Badge className="bg-green-100 text-green-700 border-0">{rate}%</Badge>;
  if (r >= 10) return <Badge className="bg-yellow-100 text-yellow-700 border-0">{rate}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-0">{rate}%</Badge>;
}

export default function AgentPerformanceGrid({ agents, selectedAgent, onSelectAgent }) {
  const maxLeads = Math.max(...agents.map(a => a.totalAssignedLeads), 1);

  const sorted = [...agents].sort((a, b) => b.totalAssignedLeads - a.totalAssignedLeads);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Per-Agent Breakdown</h2>
        {selectedAgent && (
          <button onClick={() => onSelectAgent(null)} className="text-xs text-blue-600 hover:underline">
            Clear filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Agent", "Assigned Leads", "Assigned CR", "Fresh Leads", "Fresh Leads CR", "Conversions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No agent data available.</td></tr>
            )}
            {sorted.map(row => {
              const isSelected = selectedAgent?.agent?.id === row.agent.id;
              return (
                <tr
                  key={row.agent.id}
                  onClick={() => onSelectAgent(isSelected ? null : row)}
                  className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${isSelected ? "bg-blue-50 border-l-2 border-blue-500" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{row.agent.full_name}</div>
                    <div className="text-xs text-gray-400">{row.agent.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar value={row.totalAssignedLeads} max={maxLeads} color="bg-purple-400" />
                  </td>
                  <td className="px-4 py-3"><RateBadge rate={row.assignedConversionRate ?? '0.0'} /></td>
                  <td className="px-4 py-3">
                    <ProgressBar value={row.freshLeadsCount ?? 0} max={Math.max(...sorted.map(a => a.freshLeadsCount ?? 0), 1)} color="bg-green-400" />
                  </td>
                  <td className="px-4 py-3"><RateBadge rate={row.freshLeadsConversionRate ?? '0.0'} /></td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{row.convertedLeads}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${isSelected ? "rotate-90 text-blue-500" : ""}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}