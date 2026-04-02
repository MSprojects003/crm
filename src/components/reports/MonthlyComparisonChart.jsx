import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BarChart2 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

function getMonthData(label, start, end, activities, deposits, leads) {
  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  const calls = activities.filter(a => a.type === "Call" && inRange(a.created_date)).length;
  const revenue = deposits
    .filter(d => d.status === "Confirmed" && inRange(d.date))
    .reduce((s, d) => s + (d.amount || 0), 0);
  const newLeads = leads.filter(l => inRange(l.created_date)).length;
  const won = leads.filter(l => l.status === "Won" && inRange(l.updated_date)).length;

  return { month: label, Calls: calls, Revenue: Math.round(revenue), "New Leads": newLeads, Conversions: won };
}

export default function MonthlyComparisonChart({ activities, deposits, leads }) {
  const now = new Date();
  const curStart = startOfMonth(now);
  const curEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const currentLabel = format(now, "MMM yyyy");
  const prevLabel = format(subMonths(now, 1), "MMM yyyy");

  const current = getMonthData(currentLabel, curStart, curEnd, activities, deposits, leads);
  const previous = getMonthData(prevLabel, prevStart, prevEnd, activities, deposits, leads);

  const chartData = [
    { name: "Calls",       [prevLabel]: previous.Calls,       [currentLabel]: current.Calls },
    { name: "New Leads",   [prevLabel]: previous["New Leads"], [currentLabel]: current["New Leads"] },
    { name: "Conversions", [prevLabel]: previous.Conversions,  [currentLabel]: current.Conversions },
  ];

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-blue-500" /> Monthly Comparison
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Comparison */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Calls / Leads / Conversions</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={prevLabel}    fill="#cbd5e1" radius={[3,3,0,0]} />
              <Bar dataKey={currentLabel} fill="#3b82f6" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Comparison */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Revenue (Confirmed Deposits)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[{ name: "Revenue", [prevLabel]: previous.Revenue, [currentLabel]: current.Revenue }]}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, ""]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={prevLabel}    fill="#cbd5e1" radius={[3,3,0,0]} />
              <Bar dataKey={currentLabel} fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}