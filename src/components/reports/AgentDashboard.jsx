import { useMemo } from "react";
import { Phone, Bell, CheckCircle, DollarSign, Target } from "lucide-react";
import StatCard from "./StatCard";
import { isToday } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AgentDashboard({ user, activities = [], leads = [], deposits = [], reminders = [] }) {
  const today = useMemo(() => {
    const callsToday = activities.filter(a =>
      a.user_id === user.id && a.type === "Call" && isToday(new Date(a.created_date))
    ).length;

    const followupsToday = reminders.filter(r =>
      r.user_id === user.id && r.status === "Pending" && isToday(new Date(r.due_datetime))
    ).length;

    const myLeads = leads.filter(l => l.assigned_user_id === user.id);
    const conversionsToday = myLeads.filter(l => l.status === "Won" && isToday(new Date(l.updated_date))).length;

    const revenueToday = deposits
      .filter(d => d.user_id === user.id && d.status === "Confirmed" && isToday(new Date(d.date)))
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    return { callsToday, followupsToday, conversionsToday, revenueToday };
  }, [activities, leads, deposits, reminders, user]);

  const callTarget = 20;
  const targetProgress = Math.min(100, Math.round((today.callsToday / callTarget) * 100));

  const top5Leads = useMemo(() =>
    leads
      .filter(l => l.assigned_user_id === user.id && !["Won", "Lost"].includes(l.status))
      .slice(0, 5),
    [leads, user]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Phone} label="Calls Today" value={today.callsToday} color="blue" />
        <StatCard icon={Bell} label="Follow-ups Today" value={today.followupsToday} color="orange" />
        <StatCard icon={CheckCircle} label="Conversions Today" value={today.conversionsToday} color="green" />
        <StatCard icon={DollarSign} label="Revenue Today" value={`$${today.revenueToday.toLocaleString()}`} color="purple" />
      </div>

      {/* Target Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-800">Daily Call Target</h3>
          </div>
          <span className={`text-sm font-bold ${targetProgress >= 100 ? "text-green-600" : "text-blue-600"}`}>
            {today.callsToday}/{callTarget}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${targetProgress >= 100 ? "bg-green-500" : "bg-blue-500"}`}
            style={{ width: `${targetProgress}%` }}
          />
        </div>
        {targetProgress >= 100 && <p className="text-xs text-green-600 font-medium mt-2">🎉 Target achieved!</p>}
      </div>

      {/* Top 5 Leads */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Top 5 Leads to Call</h3>
          <Link to={createPageUrl("Leads")} className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {top5Leads.length === 0 && (
            <p className="text-sm text-gray-400 px-5 py-4">No active leads assigned.</p>
          )}
          {top5Leads.map(lead => (
            <div key={lead.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">{lead.first_name} {lead.last_name}</p>
                <p className="text-xs text-gray-400">{lead.phone}</p>
              </div>
              <span className="text-xs text-gray-500">{lead.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}