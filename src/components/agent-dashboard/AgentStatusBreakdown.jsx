import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { PieChart, Pie } from "recharts";
import { LayoutGrid } from "lucide-react";

const STATUS_COLORS = {
  "Priority": "#ef4444",
  "Follow Up": "#f97316",
  "Unassigned": "#6b7280",
  "No Answer": "#eab308",
  "User Busy": "#8b5cf6",
  "Unhandled": "#06b6d4",
  "Not Interested": "#64748b",
  "Won": "#22c55e",
  "Lost": "#dc2626",
  "Other": "#94a3b8",
};

function getColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS["Other"];
}

function AgentStatusPie({ agent }) {
  const entries = Object.entries(agent.statusBreakdown || {});
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const data = entries.map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="mb-3">
        <p className="font-semibold text-gray-800">{agent.agent.full_name}</p>
        <p className="text-xs text-gray-400">{total} leads total</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip formatter={(val, name) => [`${val} (${total > 0 ? ((val / total) * 100).toFixed(0) : 0}%)`, name]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function AllAgentsBar({ agents }) {
  // Gather all unique statuses
  const allStatuses = new Set();
  agents.forEach(a => Object.keys(a.statusBreakdown || {}).forEach(s => allStatuses.add(s)));
  const statuses = Array.from(allStatuses);

  const data = agents.map(a => ({
    name: a.agent.full_name.split(" ")[0], // first name only for brevity
    ...(a.statusBreakdown || {}),
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="font-semibold text-gray-800 mb-4">Lead Status Distribution — All Agents</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          {statuses.map(s => (
            <Bar key={s} dataKey={s} stackId="a" fill={getColor(s)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AgentStatusBreakdown({ agents, selectedAgent }) {
  const target = selectedAgent ? [selectedAgent] : agents;

  if (target.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-gray-400" />
        {selectedAgent ? `${selectedAgent.agent.full_name} — Lead Status Breakdown` : "Lead Status Breakdown"}
      </h2>

      {target.length === 1 ? (
        <AgentStatusPie agent={target[0]} />
      ) : (
        <>
          <AllAgentsBar agents={target} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {target.map(a => <AgentStatusPie key={a.agent.id} agent={a} />)}
          </div>
        </>
      )}
    </div>
  );
}