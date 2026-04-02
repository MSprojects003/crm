import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const ACTIVITY_TYPES = ["Call", "Email", "Status Change", "Note"];

export default function ActivityFilters({ filters, setFilters, users, isAdmin }) {
  const clear = () =>
    setFilters({ search: "", type: "", agent: "", dateFrom: "", dateTo: "" });

  const hasFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search lead name..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="pl-9 h-9"
        />
      </div>

      {/* Activity Type */}
      <Select
        value={filters.type || "all"}
        onValueChange={(v) => setFilters((f) => ({ ...f, type: v === "all" ? "" : v }))}
      >
        <SelectTrigger className="w-44 h-9">
          <SelectValue placeholder="Activity Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {ACTIVITY_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Agent filter — admin only */}
      {isAdmin && (
        <Select
          value={filters.agent || "all"}
          onValueChange={(v) => setFilters((f) => ({ ...f, agent: v === "all" ? "" : v }))}
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Date From */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 leading-none">From</span>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          className="h-9 w-36"
        />
      </div>

      {/* Date To */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 leading-none">To</span>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
          className="h-9 w-36"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-9 text-gray-500">
          <X className="w-4 h-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}