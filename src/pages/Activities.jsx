import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { fmtSLT } from "@/components/utils/timezone";
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Download, Phone, Activity } from "lucide-react";
import ActivityFilters from "@/components/activities/ActivityFilters";
import ActivityTable from "@/components/activities/ActivityTable";
import ActivityDetailModal from "@/components/activities/ActivityDetailModal";

const PAGE_SIZE = 15;
const DEFAULT_FILTERS = { search: "", type: "", agent: "", dateFrom: "", dateTo: "" };

function exportCSV(activities, users, leads) {
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.full_name]));
  const leadMap = Object.fromEntries(leads.map((l) => [l.id, `${l.first_name} ${l.last_name}`]));
  const rows = [
    ["Date", "Agent", "Lead", "Type", "Duration (s)", "Notes"],
    ...activities.map((a) => [
      a.created_date ? fmtSLT(a.created_date) : "",
      userMap[a.user_id] || "",
      leadMap[a.lead_id] || "",
      a.type,
      a.type === "Call" ? (a.duration || 0) : "",
      (a.notes || "").replace(/,/g, ";"),
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "activities.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Activities() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState({ col: "created_date", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchWithRetry = async (attempt = 1) => {
      try {
        const usersPromise = isAdmin
          ? base44.entities.User.list().catch(() => [])
          : Promise.resolve([]);

        const [response, lds, usrs] = await Promise.all([
          base44.functions.invoke('getActivitiesByRole', {}),
          base44.entities.Lead.list("-created_date", 500),
          usersPromise,
        ]);
        
        setActivities(response.data.activities || []);
        setLeads(lds);
        setUsers(usrs.length ? usrs : [user]);
        setLoading(false);
      } catch (err) {
        // Fallback to direct entity query if backend function fails
        if (err.response?.status === 500 && attempt === 1) {
          try {
            const usersPromise = isAdmin ? base44.entities.User.list().catch(() => []) : Promise.resolve([]);
            const [lds, usrs] = await Promise.all([
              base44.entities.Lead.list("-created_date", 500),
              usersPromise,
            ]);
            
            let acts = [];
            if (isAdmin) {
              acts = await base44.entities.Activity.list("-created_date", 10000);
            } else {
              acts = await base44.entities.Activity.filter({ user_id: user.id }, "-created_date", 10000);
            }
            
            setActivities(acts);
            setLeads(lds);
            setUsers(usrs.length ? usrs : [user]);
            setLoading(false);
            return;
          } catch (fallbackErr) {
            console.error("Fallback query failed:", fallbackErr);
          }
        }
        
        if (attempt < 3) {
          setTimeout(() => fetchWithRetry(attempt + 1), 1000 * attempt);
        } else {
          setLoading(false);
        }
      }
    };
    
    fetchWithRetry();
  }, [user?.id, user?.role]);

  const filtered = useMemo(() => {
    let result = [...activities];
    const q = filters.search.toLowerCase();

    if (q) {
      const leadMap = Object.fromEntries(
        leads.map((l) => [l.id, `${l.first_name} ${l.last_name}`.toLowerCase()])
      );
      result = result.filter((a) => (leadMap[a.lead_id] || "").includes(q));
    }
    if (filters.type) result = result.filter((a) => a.type === filters.type);
    if (filters.agent) result = result.filter((a) => a.user_id === filters.agent);
    if (filters.dateFrom)
      result = result.filter((a) => a.created_date && new Date(a.created_date) >= new Date(filters.dateFrom));
    if (filters.dateTo)
      result = result.filter(
        (a) => a.created_date && new Date(a.created_date) <= new Date(filters.dateTo + "T23:59:59")
      );

    result.sort((a, b) => {
      let va, vb;
      if (sort.col === "created_date") { va = a.created_date || ""; vb = b.created_date || ""; }
      else if (sort.col === "type")   { va = a.type || ""; vb = b.type || ""; }
      else if (sort.col === "agent")  { va = a.user_id || ""; vb = b.user_id || ""; }
      else if (sort.col === "lead")   { va = a.lead_id || ""; vb = b.lead_id || ""; }
      else                            { va = ""; vb = ""; }
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [activities, filters, sort, leads]);

  const totalCalls = filtered.filter((a) => a.type === "Call").length;
  const totalCallDuration = filtered
    .filter((a) => a.type === "Call")
    .reduce((sum, a) => sum + (a.duration || 0), 0);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (updater) => {
    setFilters(updater);
    setPage(1);
  };

  if (authLoading || loading)
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading activities...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} activities</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
          onClick={() => exportCSV(filtered, users, leads)}
        >
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Total Activities
          </p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3" /> Total Calls
          </p>
          <p className="text-2xl font-bold text-gray-900">{totalCalls}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3" /> Call Duration
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {Math.floor(totalCallDuration / 60)}m {totalCallDuration % 60}s
          </p>
        </div>
      </div>

      {/* Filters */}
      <ActivityFilters
        filters={filters}
        setFilters={handleFilterChange}
        users={users}
        isAdmin={isAdmin}
      />

      {/* Table */}
      <ActivityTable
        activities={paginated}
        users={users}
        leads={leads}
        sort={sort}
        setSort={setSort}
        onView={setSelected}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <ActivityDetailModal
        activity={selected}
        users={users}
        leads={leads}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}