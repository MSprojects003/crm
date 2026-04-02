import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STATUSES = ["Pending", "Confirmed", "Rejected", "Refunded"];

export default function DepositFilters({ filters, setFilters, users, leads, isAdmin }) {
  const clear = () => setFilters({ dateFrom: "", dateTo: "", agent: "", lead: "", status: "", minAmount: "", maxAmount: "" });
  const hasFilters = Object.values(filters).some(v => v !== "");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
      {/* Date From */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">From</span>
        <Input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="h-9 w-36" />
      </div>

      {/* Date To */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">To</span>
        <Input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="h-9 w-36" />
      </div>

      {/* Status */}
      <Select value={filters.status || "all"} onValueChange={v => setFilters(f => ({ ...f, status: v === "all" ? "" : v }))}>
        <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Agent — admin only */}
      {isAdmin && (
        <Select value={filters.agent || "all"} onValueChange={v => setFilters(f => ({ ...f, agent: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {/* Lead */}
      <Select value={filters.lead || "all"} onValueChange={v => setFilters(f => ({ ...f, lead: v === "all" ? "" : v }))}>
        <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Lead" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Leads</SelectItem>
          {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.first_name} {l.last_name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Min Amount */}
      <Input
        type="number" placeholder="Min $" value={filters.minAmount}
        onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value }))}
        className="h-9 w-24"
      />

      {/* Max Amount */}
      <Input
        type="number" placeholder="Max $" value={filters.maxAmount}
        onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value }))}
        className="h-9 w-24"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-9 text-gray-500">
          <X className="w-4 h-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}