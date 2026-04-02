import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import useAuth from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, Clock, BarChart2 } from "lucide-react";
import { fmtSLT } from "@/components/utils/timezone";
import DepositFilters from "@/components/deposits/DepositFilters";
import AddDepositModal from "@/components/deposits/AddDepositModal";

const PAGE_SIZE = 15;
const DEFAULT_FILTERS = { dateFrom: "", dateTo: "", agent: "", lead: "", status: "", minAmount: "", maxAmount: "" };

const STATUS_COLORS = {
  Confirmed: "bg-green-100 text-green-700",
  Pending:   "bg-yellow-100 text-yellow-700",
  Rejected:  "bg-red-100 text-red-700",
  Refunded:  "bg-gray-100 text-gray-500",
};

export default function Deposits() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchWithRetry = async (attempt = 1) => {
      try {
        const usersPromise = isAdmin
          ? base44.entities.User.list().catch(() => [])
          : Promise.resolve([]);

        const [response, lds, usrs] = await Promise.all([
          base44.functions.invoke('getDepositsByRole', {}),
          base44.entities.Lead.list("-created_date", 500),
          usersPromise,
        ]);
        
        setDeposits(response.data.deposits || []);
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
            
            let deps = [];
            if (isAdmin) {
              deps = await base44.entities.Deposit.list("-created_date", 10000);
            } else {
              deps = await base44.entities.Deposit.filter({ user_id: user.id }, "-created_date", 10000);
            }
            
            setDeposits(deps);
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

  const leadMap  = useMemo(() => Object.fromEntries(leads.map(l => [l.id, l])), [leads]);
  const userMap  = useMemo(() => Object.fromEntries(users.map(u => [u.id, u.full_name])), [users]);

  const filtered = useMemo(() => {
    let r = [...deposits];
    if (filters.status)    r = r.filter(d => d.status === filters.status);
    if (filters.agent)     r = r.filter(d => d.user_id === filters.agent);
    if (filters.lead)      r = r.filter(d => d.lead_id === filters.lead);
    if (filters.dateFrom)  r = r.filter(d => d.date && d.date >= filters.dateFrom);
    if (filters.dateTo)    r = r.filter(d => d.date && d.date <= filters.dateTo);
    if (filters.minAmount) r = r.filter(d => d.amount >= parseFloat(filters.minAmount));
    if (filters.maxAmount) r = r.filter(d => d.amount <= parseFloat(filters.maxAmount));
    return r;
  }, [deposits, filters]);

  // Stats
  const totalRevenue    = filtered.reduce((s, d) => s + (d.amount || 0), 0);
  const approvedRevenue = filtered.filter(d => d.status === "Confirmed").reduce((s, d) => s + (d.amount || 0), 0);
  const pendingRevenue  = filtered.filter(d => d.status === "Pending").reduce((s, d) => s + (d.amount || 0), 0);
  const avgDeposit      = filtered.length ? totalRevenue / filtered.length : 0;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (updater) => { setFilters(updater); setPage(1); };

  const CONVERTED_STATUS_ID = "69a8a202e7eabef6a2a5f37a";

  const handleAddDeposit = async (form) => {
    const newDeposit = await base44.entities.Deposit.create({ ...form, user_id: user.id });
    setDeposits(ds => [newDeposit, ...ds]);
    // Mark lead as Converted
    if (form.lead_id) {
      await base44.entities.Lead.update(form.lead_id, { status_id: CONVERTED_STATUS_ID });
      setLeads(ls => ls.map(l => l.id === form.lead_id ? { ...l, status_id: CONVERTED_STATUS_ID } : l));
    }
  };

  const fmt = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (authLoading || loading)
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading deposits...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deposits</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} deposits</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9">
          <Plus className="w-4 h-4 mr-1" /> Add Deposit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue",    value: fmt(totalRevenue),    icon: DollarSign, color: "text-gray-700" },
          { label: "Approved Revenue", value: fmt(approvedRevenue), icon: TrendingUp,  color: "text-green-600" },
          { label: "Pending Revenue",  value: fmt(pendingRevenue),  icon: Clock,       color: "text-yellow-600" },
          { label: "Avg Deposit",      value: fmt(avgDeposit),      icon: BarChart2,   color: "text-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Icon className={`w-3 h-3 ${color}`} /> {label}
            </p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <DepositFilters
        filters={filters}
        setFilters={handleFilterChange}
        users={users}
        leads={leads}
        isAdmin={isAdmin}
      />

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No deposits found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Date", "Lead", "Agent", "Amount", "Status", "Payment Method", "Notes"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(d => {
                  const lead = leadMap[d.lead_id];
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{d.date ? fmtSLT(d.date, true) : "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                        {lead ? `${lead.first_name} ${lead.last_name}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{userMap[d.user_id] || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">{fmt(d.amount || 0)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-500"} border-0`}>
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{d.payment_method || "—"}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-gray-500">{d.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <AddDepositModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAddDeposit}
        leads={leads}
      />
    </div>
  );
}