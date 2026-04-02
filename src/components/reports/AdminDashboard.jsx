import { useMemo } from "react";
import { Phone, TrendingUp, DollarSign, Users, Star, UserPlus } from "lucide-react";
import StatCard from "./StatCard";
import { isToday } from "date-fns";

export default function AdminDashboard({ agents = [], activities = [], leads = [], deposits = [] }) {
  const stats = useMemo(() => {
    const callsToday = activities.filter(a => a.type === "Call" && isToday(new Date(a.created_date))).length;

    const won = leads.filter(l => l.status === "Won").length;
    const convRate = leads.length > 0 ? Math.round((won / leads.length) * 100) : 0;

    const revenueToday = deposits
      .filter(d => d.status === "Confirmed" && isToday(new Date(d.date)))
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const activeAgents = agents.filter(a => a.role === "Agent").length;
    const leadsAddedToday = leads.filter(l => isToday(new Date(l.created_date))).length;

    return { callsToday, convRate, revenueToday, activeAgents, leadsAddedToday };
  }, [activities, leads, deposits, agents]);

  const topAgent = useMemo(() => {
    if (!agents.length) return null;
    const scored = agents.map(agent => {
      const revenue = deposits
        .filter(d => d.user_id === agent.id && d.status === "Confirmed")
        .reduce((sum, d) => sum + (d.amount || 0), 0);
      const agentLeads = leads.filter(l => l.assigned_user_id === agent.id);
      const won = agentLeads.filter(l => l.status === "Won").length;
      return { agent, revenue, won };
    }).sort((a, b) => b.revenue - a.revenue);
    return scored[0];
  }, [agents, deposits, leads]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Phone} label="Calls Today" value={stats.callsToday} color="blue" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${stats.convRate}%`} color="green" />
        <StatCard icon={DollarSign} label="Revenue Today" value={`$${stats.revenueToday.toLocaleString()}`} color="purple" />
        <StatCard icon={Users} label="Active Agents" value={stats.activeAgents} color="orange" />
        <StatCard icon={UserPlus} label="Leads Today" value={stats.leadsAddedToday} color="blue" />
        {topAgent && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col gap-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-yellow-700">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold uppercase tracking-wide">Top Agent</span>
            </div>
            <p className="text-sm font-bold text-gray-800 truncate">{topAgent.agent.full_name}</p>
            <p className="text-xs text-gray-500">{topAgent.won} won · ${topAgent.revenue.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}