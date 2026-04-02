import { Users, UserCheck, Phone, Trophy, XCircle } from "lucide-react";
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from "recharts";

export default function LeadFunnelSection({ leads }) {
  const total = leads.length;
  const contacted = leads.filter(l => ["Contacted", "Qualified", "Proposal", "Negotiation", "Won"].includes(l.status)).length;
  const followUp = leads.filter(l => ["Callback", "No Answer"].includes(l.status)).length;
  const converted = leads.filter(l => l.status === "Won").length;
  const lost = leads.filter(l => l.status === "Lost").length;

  const steps = [
    { name: "Total Leads",   value: total,     fill: "#3b82f6", icon: Users },
    { name: "Contacted",     value: contacted, fill: "#6366f1", icon: Phone },
    { name: "Follow-Up",     value: followUp,  fill: "#f59e0b", icon: UserCheck },
    { name: "Converted",     value: converted, fill: "#10b981", icon: Trophy },
    { name: "Lost",          value: lost,      fill: "#ef4444", icon: XCircle },
  ];

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-indigo-500" /> Lead Funnel
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {steps.map(({ name, value, fill, icon: Icon }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={name} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: fill + "20" }}>
                <Icon className="w-5 h-5" style={{ color: fill }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{name}</p>
              {name !== "Total Leads" && (
                <p className="text-xs font-medium mt-1" style={{ color: fill }}>{pct}%</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}