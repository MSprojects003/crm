import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarRange, X } from "lucide-react";

export default function ReportsFilters({ filters, setFilters, users, isAdmin }) {
  const hasFilters = filters.dateFrom || filters.dateTo || filters.agent;
  const clear = () => setFilters({ dateFrom: "", dateTo: "", agent: "" });

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-end gap-3">
      <CalendarRange className="w-4 h-4 text-gray-400 self-center" />

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">From</span>
        <Input type="date" value={filters.dateFrom}
          onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
          className="h-9 w-36" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">To</span>
        <Input type="date" value={filters.dateTo}
          onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
          className="h-9 w-36" />
      </div>

      {isAdmin && (
        <Select value={filters.agent || "all"} onValueChange={v => setFilters(f => ({ ...f, agent: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Agents" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-9 text-gray-500">
          <X className="w-4 h-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}