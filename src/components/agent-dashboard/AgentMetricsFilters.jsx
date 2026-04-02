import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

export default function AgentMetricsFilters({ filters, setFilters, agents }) {
  const update = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const reset = () => setFilters({ dateFrom: "", dateTo: "", agent: "" });
  const hasFilters = filters.dateFrom || filters.dateTo || filters.agent;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
      <Filter className="w-4 h-4 text-gray-400 self-center" />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">From</label>
        <Input type="date" value={filters.dateFrom} onChange={e => update("dateFrom", e.target.value)} className="h-9 text-sm w-36" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">To</label>
        <Input type="date" value={filters.dateTo} onChange={e => update("dateTo", e.target.value)} className="h-9 text-sm w-36" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Agent</label>
        <Select value={filters.agent || "all"} onValueChange={v => update("agent", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 text-sm w-44">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-9 gap-1.5 text-gray-500 self-end">
          <X className="w-3.5 h-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}