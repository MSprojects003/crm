import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import useAuth from "@/components/auth/useAuth";
import ReportsFilters from "@/components/reports/ReportsFilters";
import CallPerformanceSection from "@/components/reports/CallPerformanceSection";
import RevenuePerformanceSection from "@/components/reports/RevenuePerformanceSection";
import LeadFunnelSection from "@/components/reports/LeadFunnelSection";
import AgentLeaderboard from "@/components/reports/AgentLeaderboard";
import MonthlyComparisonChart from "@/components/reports/MonthlyComparisonChart";
import LeadDialAttemptsSection from "@/components/reports/LeadDialAttemptsSection";

const DEFAULT_FILTERS = { dateFrom: "", dateTo: "", agent: "" };

function applyDateFilter(items, filters, dateKey = "created_date") {
  let r = [...items];
  if (filters.dateFrom) r = r.filter(x => x[dateKey] && new Date(x[dateKey]) >= new Date(filters.dateFrom));
  if (filters.dateTo)   r = r.filter(x => x[dateKey] && new Date(x[dateKey]) <= new Date(filters.dateTo + "T23:59:59"));
  return r;
}

export default function Reports() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    if (!user) return;
    const usersPromise = isAdmin
      ? base44.entities.User.list().catch(() => [user])
      : Promise.resolve([user]);

    Promise.all([
      isAdmin
        ? base44.entities.Activity.list("-created_date", 2000)
        : base44.entities.Activity.filter({ user_id: user.id }, "-created_date", 2000),
      base44.entities.Lead.list("-created_date", 2000),
      isAdmin
        ? base44.entities.Deposit.list("-date", 2000)
        : base44.entities.Deposit.filter({ user_id: user.id }, "-date", 2000),
      usersPromise,
    ]).then(([acts, lds, deps, usrs]) => {
      setActivities(acts);
      setLeads(lds);
      setDeposits(deps);
      setUsers(usrs);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user?.id, user?.role]);

  // Apply filters
  const filteredActivities = useMemo(() => {
    let r = applyDateFilter(activities, filters);
    if (filters.agent) r = r.filter(a => a.user_id === filters.agent);
    return r;
  }, [activities, filters]);

  const filteredDeposits = useMemo(() => {
    let r = applyDateFilter(deposits, filters, "date");
    if (filters.agent) r = r.filter(d => d.user_id === filters.agent);
    return r;
  }, [deposits, filters]);

  const filteredLeads = useMemo(() => {
    let r = applyDateFilter(leads, filters);
    if (filters.agent) r = r.filter(l => l.assigned_user_id === filters.agent);
    return r;
  }, [leads, filters]);

  if (authLoading || loading)
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading reports...</div>;

  // Only admins can access reports
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <p className="font-semibold">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance analytics across your team</p>
        </div>
      </div>

      {/* Global Filters */}
      <ReportsFilters
        filters={filters}
        setFilters={setFilters}
        users={users.filter(u => u.role === "Agent")}
        isAdmin={isAdmin}
      />

      {/* 1. Call Performance */}
      <CallPerformanceSection activities={filteredActivities} leads={filteredLeads} />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 2. Revenue Performance */}
      <RevenuePerformanceSection
        deposits={filteredDeposits}
        activities={filteredActivities}
        leads={filteredLeads}
        users={users}
      />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 3. Lead Funnel */}
      <LeadFunnelSection leads={filteredLeads} />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 4. Agent Leaderboard — admin only */}
      {isAdmin && (
        <>
          <AgentLeaderboard
            users={users}
            activities={filteredActivities}
            leads={filteredLeads}
            deposits={filteredDeposits}
          />
          <div className="border-t border-gray-100" />
        </>
      )}

      {/* 5. Lead Dial Attempts */}
      <LeadDialAttemptsSection leads={filteredLeads} users={users} />

      <div className="border-t border-gray-100" />

      {/* 6. Monthly Comparison */}
      <MonthlyComparisonChart
        activities={activities}
        deposits={deposits}
        leads={leads}
      />
      </div>
      );
      }