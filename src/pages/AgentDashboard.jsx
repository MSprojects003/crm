import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import useAuth from "@/components/auth/useAuth";
import AgentMetricsFilters from "@/components/agent-dashboard/AgentMetricsFilters";
import AgentPerformanceGrid from "@/components/agent-dashboard/AgentPerformanceGrid";
import AgentStatusBreakdown from "@/components/agent-dashboard/AgentStatusBreakdown";
import { Loader2 } from "lucide-react";



function computeAgentStats(agents, allLeads, allActivities, filters) {
  const { dateFrom, dateTo } = filters;

  const inRange = (dateStr) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  };

  const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const nowSLT = new Date(Date.now() + SLT_OFFSET_MS);
  const todaySLT = nowSLT.toISOString().slice(0, 10);
  const isTodaySLT = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(new Date(dateStr).getTime() + SLT_OFFSET_MS);
    return d.toISOString().slice(0, 10) === todaySLT;
  };

  // Group by agent
  const leadsByAgent = {};
  for (const lead of allLeads) {
    const aid = lead.assigned_user_id;
    if (!aid) continue;
    if (!leadsByAgent[aid]) leadsByAgent[aid] = [];
    leadsByAgent[aid].push(lead);
  }

  const activitiesByAgent = {};
  for (const act of allActivities) {
    const aid = act.user_id;
    if (!aid) continue;
    if (!activitiesByAgent[aid]) activitiesByAgent[aid] = [];
    activitiesByAgent[aid].push(act);
  }

  return agents.map((agent) => {
    const agentLeads = leadsByAgent[agent.id] || [];
    const agentActivities = activitiesByAgent[agent.id] || [];

    const filteredActivities = agentActivities.filter(a => inRange(a.created_date));
    const totalCalls = filteredActivities.filter(a => a.type === 'Call').length;
    const totalAssignedLeads = agentLeads.length;
    const convertedLeads = agentLeads.filter(l => l.lead_status === 'Converted').length;
    const assignedConversionRate = totalAssignedLeads > 0
      ? ((convertedLeads / totalAssignedLeads) * 100).toFixed(1) : '0.0';

    const freshLeads = agentLeads.filter(l => isTodaySLT(l.created_date));
    const freshLeadsCount = freshLeads.length;
    const freshLeadsConverted = freshLeads.filter(l => l.lead_status === 'Converted').length;
    const freshLeadsConversionRate = freshLeadsCount > 0
      ? ((freshLeadsConverted / freshLeadsCount) * 100).toFixed(1) : '0.0';

    const statusBreakdown = {};
    agentLeads.forEach(l => {
      const s = l.lead_status || 'Unassigned';
      statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
    });

    return {
      agent: { id: agent.id, full_name: agent.full_name, email: agent.email, role: agent.role },
      totalCalls,
      totalAssignedLeads,
      convertedLeads,
      assignedConversionRate,
      freshLeadsCount,
      freshLeadsConverted,
      freshLeadsConversionRate,
      statusBreakdown,
    };
  });
}

export default function AgentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", agent: "" });
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      base44.entities.User.list('-created_date', 200),
      base44.entities.Lead.list('-updated_date', 2000),
      base44.entities.Activity.filter({ type: 'Call' }, '-created_date', 2000),
    ]).then(([users, leads, activities]) => {
      setAllUsers(users);
      setAllLeads(leads);
      setAllActivities(activities);
    }).catch(err => {
      console.error("AgentDashboard load error:", err);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const agents = useMemo(() => allUsers.filter(u => u.role === 'user'), [allUsers]);

  const agentStats = useMemo(() => {
    if (!agents.length) return [];
    return computeAgentStats(agents, allLeads, allActivities, filters);
  }, [agents, allLeads, allActivities, filters]);

  const filteredAgentStats = useMemo(() => {
    if (filters.agent) return agentStats.filter(a => a.agent.id === filters.agent);
    return agentStats;
  }, [agentStats, filters.agent]);

  if (authLoading) return null;
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Performance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track calls, conversions, and lead activity per agent</p>
        </div>
      </div>

      <AgentMetricsFilters
        filters={filters}
        setFilters={setFilters}
        agents={agents}
      />

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <AgentPerformanceGrid
            agents={filteredAgentStats}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
          />
          <AgentStatusBreakdown agents={filteredAgentStats} selectedAgent={selectedAgent} />
        </>
      )}
    </div>
  );
}