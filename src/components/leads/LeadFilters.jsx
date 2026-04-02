import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import AdvancedFilterBuilder from "./AdvancedFilterBuilder";

const EMPTY_ADVANCED = { logic: "AND", rows: [] };

export default function LeadFilters({ onFilterChange, users = [], statuses = [], sources = [], isAdmin = false, initialFilters = {} }) {
  const [search, setSearch]         = useState(initialFilters.search || "");
  const [statusId, setStatusId]     = useState(initialFilters.status_id || "");
  const [sourceId, setSourceId]     = useState(initialFilters.source_id || "");
  const [assigned, setAssigned]     = useState(initialFilters.assigned_user_id || "");
  const [languageId, setLanguageId] = useState(initialFilters.language_id || "");
  const [languages, setLanguages]   = useState([]);
  const [showAdvanced, setShowAdvanced]         = useState(!!(initialFilters.advancedFilters?.rows?.length));
  const [advancedFilters, setAdvancedFilters]   = useState(initialFilters.advancedFilters || EMPTY_ADVANCED);
  const [advancedKey, setAdvancedKey]           = useState(0); // force-remount on reset

  useEffect(() => {
    base44.entities.LeadLanguage.filter({ is_active: true }).then(setLanguages).catch(() => {});
  }, []);

  const emit = (overrides = {}) => {
    onFilterChange({
      search, status_id: statusId, source_id: sourceId,
      language_id: languageId, assigned_user_id: assigned, advancedFilters,
      ...overrides,
    });
  };

  const handleReset = () => {
    setSearch(""); setStatusId(""); setSourceId("");
    setLanguageId(""); setAssigned(""); setAdvancedFilters(EMPTY_ADVANCED);
    setAdvancedKey(k => k + 1);
    onFilterChange({ search: "", status_id: "", source_id: "", language_id: "", assigned_user_id: "", advancedFilters: EMPTY_ADVANCED });
  };

  const hasAnyFilter = !!(search || statusId || sourceId || languageId || assigned || advancedFilters.rows?.length);

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3 items-end p-4">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); emit({ search: e.target.value }); }}
            placeholder="Name, email, phone..."
            className="h-8 mt-1"
          />
        </div>

        <div className="min-w-36">
          <label className="text-xs font-medium text-gray-600">Status</label>
          <Select value={statusId} onValueChange={(v) => { setStatusId(v); emit({ status_id: v }); }}>
            <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-36">
          <label className="text-xs font-medium text-gray-600">Source</label>
          <Select value={sourceId} onValueChange={(v) => { setSourceId(v); emit({ source_id: v }); }}>
            <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="All sources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Sources</SelectItem>
              {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Assigned User — Admin only */}
        {isAdmin && (
          <div className="min-w-36">
            <label className="text-xs font-medium text-gray-600">Assigned To</label>
            <Select value={assigned} onValueChange={(v) => { setAssigned(v); emit({ assigned: v }); }}>
              <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="All users" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Users</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="min-w-36">
          <label className="text-xs font-medium text-gray-600">Language</label>
          <Select value={languageId} onValueChange={(v) => { setLanguageId(v); emit({ language_id: v }); }}>
            <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="All languages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Languages</SelectItem>
              {languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-end">
          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(s => !s)}
            className="h-8 gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Advanced
            {advancedFilters.rows?.length > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full min-w-4 h-4 px-1 flex items-center justify-center leading-none">
                {advancedFilters.rows.length}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>

          {hasAnyFilter && (
            <Button variant="outline" size="sm" onClick={handleReset} className="h-8">
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filter Builder Panel */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Advanced Filters
          </p>
          <AdvancedFilterBuilder
            key={advancedKey}
            statuses={statuses}
            sources={sources}
            users={users}
            languages={languages}
            isAdmin={isAdmin}
            onChange={(af) => {
              setAdvancedFilters(af);
              emit({ advancedFilters: af });
            }}
          />
        </div>
      )}
    </div>
  );
}