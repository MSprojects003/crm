import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, FileText, ArrowRightLeft, Clock, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { fmtSLT } from "@/components/utils/timezone";

const TYPE_CONFIG = {
  Call:          { icon: Phone,            color: "bg-blue-100 text-blue-700" },
  Email:         { icon: Mail,             color: "bg-purple-100 text-purple-700" },
  Note:          { icon: FileText,         color: "bg-yellow-100 text-yellow-700" },
  "Status Change": { icon: ArrowRightLeft, color: "bg-green-100 text-green-700" },
};

function formatDuration(secs) {
  if (!secs && secs !== 0) return "—";
  if (secs === 0) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />;
  return sort.dir === "asc"
    ? <ChevronUp className="w-3 h-3 text-blue-500" />
    : <ChevronDown className="w-3 h-3 text-blue-500" />;
}

export default function ActivityTable({ activities, users, leads, sort, setSort, onView }) {
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.full_name]));
  const leadMap = Object.fromEntries(
    leads.map((l) => [l.id, { name: `${l.first_name} ${l.last_name}`, status: l.status }])
  );

  const toggleSort = (col) =>
    setSort((s) => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const headers = [
    { key: "created_date", label: "Date & Time" },
    { key: "agent", label: "Agent" },
    { key: "lead", label: "Lead" },
    { key: "type", label: "Type" },
    { key: "duration", label: "Duration" },
    { key: "status", label: "Lead Status" },
    { key: "notes", label: "Notes" },
    { key: "actions", label: "" },
  ];

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
        No activities found.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${
                    ["created_date", "agent", "lead", "type"].includes(h.key) ? "cursor-pointer select-none hover:text-gray-700" : ""
                  }`}
                  onClick={() =>
                    ["created_date", "agent", "lead", "type"].includes(h.key) && toggleSort(h.key)
                  }
                >
                  <span className="flex items-center gap-1">
                    {h.label}
                    {["created_date", "agent", "lead", "type"].includes(h.key) && (
                      <SortIcon col={h.key} sort={sort} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activities.map((a) => {
              const cfg = TYPE_CONFIG[a.type] || { icon: FileText, color: "bg-gray-100 text-gray-700" };
              const Icon = cfg.icon;
              const lead = leadMap[a.lead_id];
              return (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {a.created_date ? fmtSLT(a.created_date) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                    {userMap[a.user_id] || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {lead?.name || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge className={`${cfg.color} flex items-center gap-1 w-fit`}>
                      <Icon className="w-3 h-3" />
                      {a.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {a.type === "Call" ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(a.duration)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {lead?.status ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {lead.status}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-gray-500">
                    {a.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => onView(a)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}