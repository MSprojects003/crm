import StatCard from "./StatCard";
import { DollarSign, TrendingUp, BarChart2, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fmt = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export default function RevenuePerformanceSection({ deposits, activities, leads, users }) {
  const confirmed = deposits.filter(d => d.status === "Confirmed");
  const totalRevenue = confirmed.reduce((s, d) => s + (d.amount || 0), 0);
  const avgDeposit = confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0;

  // Conversion to deposit %
  const uniqueLeads = new Set(activities.map(a => a.lead_id)).size;
  const leadsWithDeposit = new Set(confirmed.map(d => d.lead_id)).size;
  const convPct = uniqueLeads > 0 ? ((leadsWithDeposit / uniqueLeads) * 100).toFixed(1) : "0.0";

  // Revenue per agent
  const userMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));
  const agentRevenue = Object.entries(
    confirmed.reduce((acc, d) => {
      acc[d.user_id] = (acc[d.user_id] || 0) + (d.amount || 0);
      return acc;
    }, {})
  ).map(([uid, revenue]) => ({ name: (userMap[uid] || "Unknown").split(" ")[0], revenue }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-500" /> Revenue Performance
      </h2>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard icon={DollarSign}  label="Total Revenue"           value={fmt(totalRevenue)}   color="green" />
        <StatCard icon={BarChart2}   label="Average Deposit"         value={fmt(avgDeposit)}     color="blue" />
        <StatCard icon={Percent}     label="Conversion to Deposit"   value={`${convPct}%`}       color="purple" />
        <StatCard icon={TrendingUp}  label="Confirmed Deposits"      value={confirmed.length}    color="orange" />
      </div>

      {agentRevenue.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Revenue Per Agent</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agentRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {agentRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}