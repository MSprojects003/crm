import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Bell, FileText, Eye, ChevronUp, ChevronDown, MoreHorizontal, Columns3, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getAvailableColumns } from "./columnConfig";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fmtSLT } from "@/components/utils/timezone";

const STATUS_COLORS = {
  New: "bg-gray-100 text-gray-700", Contacted: "bg-blue-100 text-blue-700",
  Qualified: "bg-indigo-100 text-indigo-700", Proposal: "bg-purple-100 text-purple-700",
  Negotiation: "bg-yellow-100 text-yellow-700", Won: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700", "No Answer": "bg-gray-100 text-gray-500", Callback: "bg-amber-100 text-amber-700",
};

const fmtDate = (val) => {
  if (!val) return "—";
  return fmtSLT(val) || "—";
};

const fmtDateOnly = (val) => {
  if (!val) return "—";
  return fmtSLT(val, true) || "—";
};

export default function LeadTableView({ leads, selected, setSelected, users, statuses = [], sources = [], onQuickCall, onScheduleReminder, onAddNote, onViewDetails, sort, setSort }) {
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const navigate = useNavigate();
  const usersMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));
  const statusesMap = Object.fromEntries((statuses || []).map(s => [s.id, s]));
  const sourcesMap = Object.fromEntries((sources || []).map(s => [s.id, s.name]));

  useEffect(() => {
    setAvailableColumns(getAvailableColumns());
  }, []);

  const allSelected = leads.length > 0 && leads.every(l => selected.includes(l.id));
  const toggleAll = () => setSelected(allSelected ? [] : leads.map(l => l.id));
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleSort = (col) => {
    if (setSort) {
      setSort(s => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
    }
  };

  const SortIcon = ({ col }) => {
    if (!sort || sort.col !== col) return <ChevronUp className="w-3 h-3 text-gray-300 inline ml-1" />;
    return sort.dir === "asc"
      ? <ChevronUp className="w-3 h-3 text-blue-500 inline ml-1" />
      : <ChevronDown className="w-3 h-3 text-blue-500 inline ml-1" />;
  };

  const clearSort = (e) => {
    e.stopPropagation();
    if (setSort) setSort({ col: "created_date", dir: "desc" });
  };

  const toggleColumn = (colId) => {
    setVisibleColumns(prev => prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]);
  };

  const renderOptionalColumn = (lead, colId) => {
    const col = availableColumns.find(c => c.id === colId);
    if (!col) return "—";

    const value = lead[colId];
    if (value === null || value === undefined || value === "") return "—";

    switch(col.type) {
      case "datetime":
        return fmtDate(value);
      case "date":
        return fmtDateOnly(value);
      case "number":
        return typeof value === "number" ? value.toString() : value;
      case "dropdown":
        if (colId === "lead_status") {
          const s = statusesMap[lead.status_id];
          return s ? <Badge className="border-0 text-xs text-white" style={{ backgroundColor: s.color || '#6b7280' }}>{s.name}</Badge> : "—";
        }
        if (colId === "source") {
          return sourcesMap[lead.source_id] || lead.source || "—";
        }
        return value;
      case "phone":
        return value;
      case "text":
      default:
        return value;
    }
  };

  const getColumnAlignment = (colId) => {
    const col = availableColumns.find(c => c.id === colId);
    if (!col) return "text-left";
    if (col.type === "number") return "text-right";
    return "text-left";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Columns3 className="w-4 h-4" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-600">Optional Columns</div>
            <DropdownMenuSeparator />
            <ScrollArea className="h-64">
              {availableColumns.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={visibleColumns.includes(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                  className="cursor-pointer"
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 px-4 py-3"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
              {[["Name","name"],["Phone","phone"],["Status","lead_status"],["Source","source"],["Assigned","assigned_user_id"]].map(([label, col]) => (
                <th key={col} className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer whitespace-nowrap" onClick={() => handleSort(col)}>
                  {label}<SortIcon col={col} />
                  {sort?.col === col && (
                    <button onClick={clearSort} className="ml-1 text-gray-400 hover:text-gray-600 inline-flex align-middle">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </th>
              ))}
              {visibleColumns.map(colId => {
                const col = availableColumns.find(c => c.id === colId);
                return col ? (
                  <th key={colId} className={`px-4 py-3 font-semibold text-gray-600 whitespace-nowrap ${getColumnAlignment(colId)}`}>
                    {col.label}
                  </th>
                ) : null;
              })}
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.length === 0 && (
            <tr><td colSpan={9 + visibleColumns.length} className="px-4 py-10 text-center text-gray-400">No leads found</td></tr>
          )}
          {leads.map(lead => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3"><Checkbox checked={selected.includes(lead.id)} onCheckedChange={() => toggle(lead.id)} /></td>
              <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                <button 
                  onClick={() => navigate(createPageUrl("LeadProfile") + `?id=${lead.id}&ids=${leads.map(l => l.id).join(",")}`)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {lead.first_name} {lead.last_name}
                </button>
              </td>
              <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
              <td className="px-4 py-3">
                {(() => {
                  const s = statusesMap[lead.status_id];
                  if (s) return <Badge className="border-0 text-xs text-white" style={{ backgroundColor: s.color || '#6b7280' }}>{s.name}</Badge>;
                  return <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">—</Badge>;
                })()}
              </td>
              <td className="px-4 py-3 text-gray-600">{sourcesMap[lead.source_id] || "—"}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{usersMap[lead.assigned_user_id] || "—"}</td>

              {visibleColumns.map(colId => {
                const col = availableColumns.find(c => c.id === colId);
                const isPhone = col?.type === "phone";
                const value = renderOptionalColumn(lead, colId);

                return (
                  <td key={colId} className={`px-4 py-3 text-gray-600 ${getColumnAlignment(colId)}`}>
                    {isPhone && value !== "—" ? (
                      <button 
                        onClick={() => {
                          onQuickCall(lead);
                          if (lead[colId]) {
                            setTimeout(() => window.location.href = `tel:${lead[colId]}`, 100);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {value}
                      </button>
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 px-2 text-green-700 border-green-300 hover:bg-green-50" 
                    onClick={() => {
                      onQuickCall(lead);
                      if (lead.phone) {
                        setTimeout(() => window.location.href = `tel:${lead.phone}`, 100);
                      }
                    }}
                  >
                    <Phone className="w-3.5 h-3.5 mr-1" /> Call
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-500">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onScheduleReminder(lead)}>
                        <Bell className="w-4 h-4 mr-2 text-blue-500" /> Schedule Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddNote(lead)}>
                        <FileText className="w-4 h-4 mr-2 text-yellow-500" /> Add Note
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewDetails(lead)}>
                        <Eye className="w-4 h-4 mr-2 text-gray-500" /> View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
        </div>
        </div>
        );
        }