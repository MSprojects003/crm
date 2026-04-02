import StatCard from "./StatCard";
import { Phone, Clock, Timer, TrendingUp } from "lucide-react";

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m ${s}s`;
}

export default function CallPerformanceSection({ activities, leads }) {
  const calls = activities.filter(a => a.type === "Call");
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((s, a) => s + (a.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  const uniqueLeadsContacted = new Set(calls.map(a => a.lead_id)).size;
  const wonLeads = leads.filter(l => l.status === "Won").length;
  const convRate = uniqueLeadsContacted > 0 ? ((wonLeads / uniqueLeadsContacted) * 100).toFixed(1) : "0.0";

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Phone className="w-4 h-4 text-blue-500" /> Call Performance
      </h2>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Phone}    label="Total Calls"         value={totalCalls}              color="blue" />
        <StatCard icon={Clock}    label="Avg Call Duration"   value={fmtDuration(avgDuration)} color="purple" />
        <StatCard icon={Timer}    label="Total Call Time"     value={fmtDuration(totalDuration)} color="orange" />
        <StatCard icon={TrendingUp} label="Conversion Rate"  value={`${convRate}%`}           color="green" />
      </div>
    </section>
  );
}