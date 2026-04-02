import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, LayoutList, Columns, Zap, Upload, ChevronDown, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useAuth from "@/components/auth/useAuth";
import { toast } from "sonner";
import LeadFilters from "@/components/leads/LeadFilters";
import LeadTableView from "@/components/leads/LeadTableView";
import LeadKanbanView from "@/components/leads/LeadKanbanView";
import BulkActionsBar from "@/components/leads/BulkActionsBar";
import LeadFormDialog from "@/components/leads/LeadFormDialog";
import LeadImportPanel from "@/components/leads/LeadImportPanel";
import ExportCSVButton from "@/components/leads/ExportCSVButton";
import LeadDetailDrawer from "@/components/leads/LeadDetailDrawer";
import NoteDialog from "@/components/leads/NoteDialog";
import ReminderDialog from "@/components/leads/ReminderDialog";
import LiveCallScreen from "@/components/call/LiveCallScreen";
import DispositionModal from "@/components/call/DispositionModal";
import { AssignToAgentModal, RoundRobinModal } from "@/components/leads/BulkAssignModal";

const PAGE_SIZE = 20;
const DEFAULT_FILTERS = { status_id: "", assigned_user_id: "", source_id: "", dateFrom: "", dateTo: "", search: "", language_id: "", advancedFilters: { logic: "AND", rows: [] } };
const FILTERS_KEY = "leads_filters_v2";

function loadFromSession(key, fallback) {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export default function Leads() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [users, setUsers] = useState([]);

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(null); // filtered total
  const [totalAll, setTotalAll] = useState(null); // unfiltered total
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0); // 0-indexed
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("table");
  const [filters, setFilters] = useState(() => loadFromSession(FILTERS_KEY, DEFAULT_FILTERS));
  const [selected, setSelected] = useState([]);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [disposition, setDisposition] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [noteLead, setNoteLead] = useState(null);
  const [reminderLead, setReminderLead] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRoundRobinModal, setShowRoundRobinModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRef = useRef(0); // track latest fetch to avoid stale updates

  const fetchLeads = useCallback(async (currentPage, currentFilters, usersCache) => {
    const fetchId = ++fetchRef.current;
    setLoading(true);

    const skip = currentPage * PAGE_SIZE;
    const payload = {
      limit: PAGE_SIZE,
      skip,
      ...( currentFilters.status_id        ? { status_id:         currentFilters.status_id }        : {} ),
      ...( currentFilters.source_id        ? { source_id:         currentFilters.source_id }        : {} ),
      ...( currentFilters.language_id      ? { language_id:       currentFilters.language_id }      : {} ),
      ...( currentFilters.assigned_user_id ? { assigned_user_id:  currentFilters.assigned_user_id } : {} ),
      ...( currentFilters.search           ? { search:            currentFilters.search }           : {} ),
      ...( currentFilters.dateFrom         ? { dateFrom:          currentFilters.dateFrom }         : {} ),
      ...( currentFilters.dateTo           ? { dateTo:            currentFilters.dateTo }           : {} ),
      ...( currentFilters.advancedFilters?.rows?.length ? { advancedFilters: currentFilters.advancedFilters } : {} ),
    };

    try {
      const res = await base44.functions.invoke('getLeadsByRole', payload);
      if (fetchId !== fetchRef.current) return; // stale response

      if (res.data?.error && !res.data?.leads?.length) {
        toast.error("Failed to load leads: " + res.data.error);
        setLoading(false);
        return;
      }

      setLeads(res.data?.leads || []);
      setTotal(res.data?.total ?? null);
      setHasMore(res.data?.hasMore ?? false);

      if (res.data?.users?.length && !usersCache?.length) {
        setUsers(res.data.users);
      }
    } catch (err) {
      if (fetchId !== fetchRef.current) return;
      toast.error("Failed to load leads.");
      console.error(err);
    } finally {
      if (fetchId === fetchRef.current) setLoading(false);
    }
  }, []);

  // Initial metadata load + background total count
  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.LeadStatus.filter({ is_active: true }),
      base44.entities.LeadSource.filter({ is_active: true }),
    ]).then(([statusesData, sourcesData]) => {
      setStatuses(statusesData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setSources(sourcesData);
    });
    // Background load total unfiltered count (role-aware)
    base44.functions.invoke('getLeadsCount', {}).then(res => {
      if (res.data?.count != null) setTotalAll(res.data.count);
    }).catch(() => {});
  }, [user?.id]);

  // Fetch leads when page or filters change
  useEffect(() => {
    if (!user) return;
    fetchLeads(page, filters, users);
  }, [user?.id, page, filters]);

  // Persist filters, reset to page 0
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
    setSelected([]);
    try { sessionStorage.setItem(FILTERS_KEY, JSON.stringify(newFilters)); } catch {}
  };

  const refreshLeads = () => fetchLeads(page, filters, users);

  const canBulkAssign = isAdmin || user?.role === "Manager";
  const activeAgents = users.filter(u => u.role !== "admin");

  const updateLocalLeads = (updater) => setLeads(ls => ls.map(updater));

  const batchUpdate = async (ids, data, batchSize = 3) => {
    for (let i = 0; i < ids.length; i += batchSize) {
      await Promise.all(ids.slice(i, i + batchSize).map(id => base44.entities.Lead.update(id, data)));
      if (i + batchSize < ids.length) await new Promise(r => setTimeout(r, 300));
    }
  };

  const handleBulkAssign = async (userId) => {
    setActionLoading(true);
    await batchUpdate(selected, { assigned_user_id: userId });
    updateLocalLeads(l => selected.includes(l.id) ? { ...l, assigned_user_id: userId } : l);
    toast.success(`${selected.length} lead(s) assigned`);
    setSelected([]);
    setActionLoading(false);
  };

  const handleBulkStatus = async (statusId) => {
    setActionLoading(true);
    await batchUpdate(selected, { status_id: statusId });
    updateLocalLeads(l => selected.includes(l.id) ? { ...l, status_id: statusId } : l);
    toast.success(`Status updated for ${selected.length} lead(s)`);
    setSelected([]);
    setActionLoading(false);
  };

  const handleBulkSource = async (sourceId) => {
    setActionLoading(true);
    await batchUpdate(selected, { source_id: sourceId });
    updateLocalLeads(l => selected.includes(l.id) ? { ...l, source_id: sourceId } : l);
    toast.success(`Source updated for ${selected.length} lead(s)`);
    setSelected([]);
    setActionLoading(false);
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      const CHUNK = 50;
      let totalDeleted = 0;
      for (let i = 0; i < selected.length; i += CHUNK) {
        const chunk = selected.slice(i, i + CHUNK);
        try {
          const res = await base44.functions.invoke('bulkDeleteLeads', { ids: chunk });
          totalDeleted += res.data?.deletedCount || 0;
        } catch {
          for (const id of chunk) {
            try { await base44.entities.Lead.delete(id); totalDeleted++; } catch {}
          }
        }
      }
      setLeads(ls => ls.filter(l => !selected.includes(l.id)));
      toast.success(`${totalDeleted} lead(s) deleted`);
      setSelected([]);
    } catch (err) {
      toast.error("Failed to delete leads");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateLead = async (form) => {
    const newLead = await base44.entities.Lead.create({
      ...form,
      account_status: "Lead",
      potential_value: form.potential_value ? parseFloat(form.potential_value) : undefined,
      assigned_user_id: form.assigned_user_id === "none" ? undefined : form.assigned_user_id,
    });
    setLeads(ls => [newLead, ...ls]);
    toast.success("Lead created successfully");
  };

  const rowActions = {
    onQuickCall: (lead) => setActiveCall(lead),
    onScheduleReminder: (lead) => setReminderLead(lead),
    onAddNote: (lead) => setNoteLead(lead),
    onViewDetails: (lead) => setDetailLead(lead),
  };

  const totalPages = total !== null ? Math.ceil(total / PAGE_SIZE) : null;
  const showingFrom = page * PAGE_SIZE + 1;
  const showingTo = page * PAGE_SIZE + leads.length;

  if (authLoading) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading..." : (() => {
              const hasFilters = filters.status_id || filters.source_id || filters.language_id ||
                filters.assigned_user_id || filters.search || filters.dateFrom || filters.dateTo ||
                filters.advancedFilters?.rows?.length > 0;
              if (hasFilters && total != null) {
                return (
                  <>
                    {totalAll != null && <span>{totalAll.toLocaleString()} total · </span>}
                    <span className="text-blue-600 font-medium">{total.toLocaleString()} matching filters</span>
                  </>
                );
              }
              return <span>{(totalAll ?? total ?? 0).toLocaleString()} leads</span>;
            })()}
            {selected.length > 0 && <span className="ml-2 font-semibold text-blue-600">{selected.length} selected</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={async () => {
              const payload = filters.source_id ? { source_id: filters.source_id } : {};
              const res = await base44.functions.invoke('getNextCaller', payload);
              if (res.data?.leadId) window.location.href = `/LeadProfile?id=${res.data.leadId}`;
              else toast.info('No next caller available');
            }}
            variant="outline"
            className="h-9 gap-1.5 border-green-600 text-green-700 hover:bg-green-50"
          >
            <Zap className="w-4 h-4" /> Show Next Caller
          </Button>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView("table")} className={`p-1.5 rounded-md transition-colors ${view === "table" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setView("kanban")} className={`p-1.5 rounded-md transition-colors ${view === "kanban" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
              <Columns className="w-4 h-4" />
            </button>
          </div>

          {canBulkAssign && selected.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Users className="w-4 h-4" /> Bulk Assign <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowAssignModal(true)}>Assign to Specific Agent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowRoundRobinModal(true)}>Auto Assign (Round Robin)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="h-9 text-gray-500" onClick={() => setSelected([])}>
              Clear Selection
            </Button>
          )}

          {isAdmin && (
            <>
              <Button onClick={() => setShowImport(true)} variant="outline" className="h-9 gap-1.5">
                <Upload className="w-4 h-4" /> Import CSV
              </Button>
              <ExportCSVButton selectedIds={selected} allFilteredLeads={leads} leads={leads} />
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9">
                <Plus className="w-4 h-4 mr-1" /> Add Lead
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <LeadFilters
        onFilterChange={handleFilterChange}
        users={users}
        statuses={statuses}
        sources={sources}
        isAdmin={isAdmin}
        initialFilters={filters}
      />

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <BulkActionsBar
          count={selected.length}
          users={users}
          statuses={statuses}
          sources={sources}
          onAssign={handleBulkAssign}
          onChangeStatus={handleBulkStatus}
          onChangeSource={handleBulkSource}
          onDelete={handleBulkDelete}
          onClear={() => setSelected([])}
        />
      )}

      {/* Loading overlay */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading leads...</span>
          </div>
        </div>
      ) : (
        <>
          {view === "table" ? (
            <LeadTableView
              leads={leads}
              selected={selected}
              setSelected={setSelected}
              users={users}
              statuses={statuses}
              sources={sources}
              sort={{ col: "updated_date", dir: "desc" }}
              setSort={() => {}}
              {...rowActions}
            />
          ) : (
            <LeadKanbanView leads={leads} users={users} statuses={statuses} {...rowActions} />
          )}

          {/* Pagination */}
          {(totalPages > 1 || hasMore) && (
            <div className="flex items-center justify-between pt-2 pb-4 flex-wrap gap-2">
              <p className="text-sm text-gray-500">
                {leads.length > 0 ? `Showing ${showingFrom}–${showingTo}${total !== null ? ` of ${total.toLocaleString()}` : ''}` : 'No results'}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => { setPage(0); setSelected([]); }} disabled={page === 0}>
                  <ChevronLeft className="w-3 h-3" /><ChevronLeft className="w-3 h-3 -ml-2" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setPage(p => p - 1); setSelected([]); }} disabled={page === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {(() => {
                  const pages = [];
                  const total_p = totalPages || (hasMore ? page + 5 : page + 1);
                  let start = Math.max(0, page - 2);
                  let end = Math.min(total_p - 1, start + 4);
                  if (end - start < 4) start = Math.max(0, end - 4);
                  if (start > 0) {
                    pages.push(<Button key={0} variant={page === 0 ? 'default' : 'outline'} size="sm" className="min-w-[36px]" onClick={() => { setPage(0); setSelected([]); }}>1</Button>);
                    if (start > 1) pages.push(<span key="e1" className="px-1 text-gray-400">…</span>);
                  }
                  for (let i = start; i <= end; i++) {
                    pages.push(<Button key={i} variant={page === i ? 'default' : 'outline'} size="sm" className="min-w-[36px]" onClick={() => { setPage(i); setSelected([]); }}>{i + 1}</Button>);
                  }
                  if (totalPages && end < totalPages - 1) {
                    if (end < totalPages - 2) pages.push(<span key="e2" className="px-1 text-gray-400">…</span>);
                    pages.push(<Button key={totalPages - 1} variant={page === totalPages - 1 ? 'default' : 'outline'} size="sm" className="min-w-[36px]" onClick={() => { setPage(totalPages - 1); setSelected([]); }}>{totalPages}</Button>);
                  }
                  return pages;
                })()}
                <Button variant="outline" size="sm" onClick={() => { setPage(p => p + 1); setSelected([]); }} disabled={!hasMore}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {totalPages && (
                  <Button variant="outline" size="sm" onClick={() => { setPage(totalPages - 1); setSelected([]); }} disabled={page === totalPages - 1}>
                    <ChevronRight className="w-3 h-3" /><ChevronRight className="w-3 h-3 -ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}
          {totalPages === 1 && leads.length > 0 && (
            <p className="text-sm text-gray-500 pt-2 pb-4">
              Showing {showingFrom}–{showingTo} of {total?.toLocaleString()}
            </p>
          )}
        </>
      )}

      {/* Modals */}
      <AssignToAgentModal open={showAssignModal} onClose={() => setShowAssignModal(false)} selectedLeads={selected} agents={activeAgents} leads={leads} onDone={() => { refreshLeads(); setSelected([]); }} />
      <RoundRobinModal open={showRoundRobinModal} onClose={() => setShowRoundRobinModal(false)} selectedLeads={selected} agents={activeAgents} leads={leads} onDone={() => { refreshLeads(); setSelected([]); }} />
      <LeadFormDialog open={showForm} onClose={() => setShowForm(false)} onSave={handleCreateLead} users={users} isAdmin={isAdmin} />
      <LeadImportPanel open={showImport} onClose={() => setShowImport(false)} onImport={refreshLeads} />
      <LeadDetailDrawer lead={detailLead} users={users} open={!!detailLead} onClose={() => setDetailLead(null)} />
      {noteLead && <NoteDialog lead={noteLead} user={user} open={!!noteLead} onClose={() => setNoteLead(null)} />}
      {reminderLead && <ReminderDialog lead={reminderLead} user={user} open={!!reminderLead} onClose={() => setReminderLead(null)} />}
      {activeCall && (
        <LiveCallScreen lead={activeCall} user={user}
          onEndCall={(callData) => { setDisposition({ lead: activeCall, callData }); setActiveCall(null); }}
          onClose={() => setActiveCall(null)}
        />
      )}
      {disposition && (
        <DispositionModal lead={disposition.lead} user={user} callData={disposition.callData}
          onDone={() => { refreshLeads(); setDisposition(null); }}
        />
      )}
    </div>
  );
}