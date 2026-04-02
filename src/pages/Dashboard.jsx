import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useAuth from "@/components/auth/useAuth";

import AgentDashboard from "@/components/reports/AgentDashboard";
import AdminDashboard from "@/components/reports/AdminDashboard";

export default function Dashboard() {
  const { user, loading, isAdmin } = useAuth();

  const [data, setData] = useState({ activities: [], leads: [], deposits: [], reminders: [], agents: [] });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const base = [
          base44.entities.Activity.list("-created_date", 100),
          base44.entities.Lead.list("-created_date", 100),
          base44.entities.Deposit.list("-date", 100),
          base44.entities.Reminder.list("-created_date", 50),
        ];
        const agentsPromise = isAdmin ? base44.entities.User.list() : Promise.resolve([]);
        const [activities, leads, deposits, reminders, agents] = await Promise.all([...base, agentsPromise]);
        setData({ activities, leads, deposits, reminders, agents });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setData({ activities: [], leads: [], deposits: [], reminders: [], agents: [] });
      } finally {
        setDataLoading(false);
      }
    };
    fetch();
  }, [user, isAdmin]);

  if (loading || dataLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;
  }

  // Calculate metrics
  const leadsThisWeek = data.leads.filter(l => {
    const leadDate = new Date(l.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return leadDate >= weekAgo;
  }).length;

  const convertedLeads = data.leads.filter(l => {
    // Check if lead has a "Converted" status in the database
    return l.status_id !== undefined || l.status_id !== null;
  }).length;
  const conversionRate = data.leads.length > 0 ? ((convertedLeads / data.leads.length) * 100).toFixed(1) : 0;

  const totalDeposits = data.deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? "Admin Dashboard" : "My Performance"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.full_name}</p>
        </div>
      </div>



      {isAdmin ? (
        <AdminDashboard
          agents={data.agents}
          activities={data.activities}
          leads={data.leads}
          deposits={data.deposits}
        />
      ) : (
        <AgentDashboard
          user={user}
          activities={data.activities}
          leads={data.leads}
          deposits={data.deposits}
          reminders={data.reminders}
        />
      )}
    </div>
  );
}