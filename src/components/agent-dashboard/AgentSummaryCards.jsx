import { Phone, Users, TrendingUp, DollarSign, AlertCircle, MessageSquare } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  // Icon is passed as prop and used via variable
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    teal: "bg-teal-50 text-teal-600",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AgentSummaryCards({ agents }) {
  const totalCalls = agents.reduce((s, a) => s + a.totalCalls, 0);
  const totalLeads = agents.reduce((s, a) => s + a.totalAssignedLeads, 0);
  const totalConverted = agents.reduce((s, a) => s + a.convertedLeads, 0);
  const totalRevenue = agents.reduce((s, a) => s + a.totalRevenue, 0);
  const totalOverdue = agents.reduce((s, a) => s + a.overdueFollowUps, 0);
  const totalNotes = agents.reduce((s, a) => s + a.notes + a.whatsapp, 0);
  const overallConv = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard icon={Phone} label="Total Calls" value={totalCalls.toLocaleString()} color="blue" />
      <StatCard icon={Users} label="Assigned Leads" value={totalLeads.toLocaleString()} color="purple" />
      <StatCard icon={TrendingUp} label="Conversions" value={totalConverted} sub={`${overallConv}% rate`} color="green" />
      <StatCard icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} color="teal" />
      <StatCard icon={AlertCircle} label="Overdue Follow-Ups" value={totalOverdue} color="red" />
      <StatCard icon={MessageSquare} label="Notes & Messages" value={totalNotes} color="orange" />
    </div>
  );
}