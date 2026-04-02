import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AgentPerformanceWidget({ agents, activities, leads }) {
  const agentStats = agents.map(agent => {
    const agentLeads = leads.filter(l => l.assigned_user_id === agent.id);
    const agentActivities = activities.filter(a => a.user_id === agent.id);
    const convertedLeads = agentLeads.filter(l => l.status === "Converted").length;
    const conversionRate = agentLeads.length > 0 ? ((convertedLeads / agentLeads.length) * 100).toFixed(1) : 0;

    return {
      name: agent.full_name,
      leadsAssigned: agentLeads.length,
      activities: agentActivities.length,
      conversionRate: parseFloat(conversionRate),
      converted: convertedLeads,
    };
  }).sort((a, b) => b.conversionRate - a.conversionRate);

  return (
    <Card className="p-4 border-gray-200 bg-white">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Agent Performance</h3>
      {agentStats.length > 0 ? (
        <div className="space-y-3">
          {agentStats.slice(0, 5).map((agent) => (
            <div key={agent.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                <p className="text-xs text-gray-500">
                  {agent.leadsAssigned} leads • {agent.converted} converted
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap ml-2">
                {agent.conversionRate}%
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-4">No agent data available</p>
      )}
    </Card>
  );
}