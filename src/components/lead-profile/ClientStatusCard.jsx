import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import SaveIndicator from "./SaveIndicator";
import { useAutoSave } from "./useAutoSave";
import { fmtSLT } from "@/components/utils/timezone";

const fmtDate = (val) => fmtSLT(val);

const toSLInputValue = (val) => {
  if (!val) return "";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: SL_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(date);
    const p = {};
    parts.forEach(({ type, value }) => { p[type] = value; });
    const h = p.hour === '24' ? '00' : p.hour;
    return `${p.year}-${p.month}-${p.day}T${h}:${p.minute}`;
  } catch { return ""; }
};

const fromSLInputValue = (val) => {
  if (!val) return "";
  try {
    const [datePart, timePart] = val.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours - 5, minutes - 30)).toISOString();
  } catch { return val; }
};

export default function ClientStatusCard({ lead, changes, onFieldChange }) {
  const [saveStatus, setSaveStatus] = useState({});
  const [retentionStatuses, setRetentionStatuses] = useState([]);
  const [localValues, setLocalValues] = useState({});
  const { autoSave } = useAutoSave(lead.id);

  useEffect(() => {
    base44.entities.RetentionStatus.filter({ is_active: true }).then(data =>
      setRetentionStatuses(data.sort((a, b) => a.name.localeCompare(b.name)))
    );
  }, []);

  const handleBlur = (field, value) => {
    autoSave(field, value, (f, status) => {
      setSaveStatus((prev) => ({ ...prev, [f]: status }));
    });
  };

  const handleDateChange = (field, value) => {
    const utcValue = fromSLInputValue(value);
    onFieldChange(field, utcValue);
    autoSave(field, utcValue, (f, status) => {
      setSaveStatus((prev) => ({ ...prev, [f]: status }));
    });
  };

  const getFieldValue = (field) => {
    if (localValues[field] !== undefined) return localValues[field];
    if (changes[field] !== undefined) return changes[field];
    return lead[field] || "";
  };

  const clientPotentialOptions = ["Low potential", "Mid potential", "High potential"];
  const depositPotentialOptions = ["0-1000", "1001-5000", "5001-10,000", "10,001-20,000", "20,001-40,000", "40,001-Above"];

  const fields = [
    // CRM / Retention fields
    { label: "Retention Status", field: "retention_status", readonly: true },
    { label: "Trading Status", field: "trading_status", isSelectDropdown: true, options: ["Yes", "No"] },
    { label: "Retention Follow Up", field: "retention_follow_up", type: "datetime-local" },
    { label: "Last Call Date & Time", field: "last_call_datetime", readonly: true, render: () => fmtDate(lead.last_call_datetime) },
    { label: "Client Potential", field: "client_potential", isSelectDropdown: true, options: clientPotentialOptions },
    { label: "Client Deposit Potential", field: "client_deposit_potential", isSelectDropdown: true, options: depositPotentialOptions },
    // Account fields
    { label: "Update Timestamp", field: "updated_date", readonly: true, render: () => fmtDate(lead.updated_date) },
    { label: "Balance", field: "balance", readonly: true },
    { label: "Equity", field: "equity", readonly: true },
    // Deposit fields
    { label: "FTD Date & Time", field: "ftd_datetime", readonly: true, render: () => fmtDate(lead.ftd_datetime) },
    { label: "FTD Amount", field: "ftd_amount", readonly: true },
    { label: "Last Deposit Date", field: "last_deposit_date", readonly: true, render: () => fmtDate(lead.last_deposit_date) },
    { label: "Last Deposit Amount", field: "last_deposit_amount", readonly: true },
    // Withdrawal fields
    { label: "Last Withdrawal Date (SL)", field: "last_withdrawal_sl", readonly: true, render: () => fmtDate(lead.last_withdrawal_sl) },
    { label: "Last Withdrawal Date (UTC)", field: "last_withdrawal_utc", readonly: true, render: () => fmtDate(lead.last_withdrawal_utc) },
    { label: "Last Withdrawal Amount", field: "last_withdrawal_amount", readonly: true },
    { label: "Account", field: "account", readonly: true },
    // Account Type removed as requested
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Client Status</h2>

      <div className="space-y-3">
         {fields.map((fieldConfig) => (
           <div key={fieldConfig.field} className="flex items-center gap-4">
             <Label className="text-sm text-gray-600 font-medium w-40 flex-shrink-0">{fieldConfig.label}</Label>
             {fieldConfig.readonly ? (
               <p className="text-sm text-gray-900 font-medium flex-1">
                 {fieldConfig.render
                   ? fieldConfig.render()
                   : (changes[fieldConfig.field] != null && changes[fieldConfig.field] !== ""
                       ? changes[fieldConfig.field]
                       : (lead[fieldConfig.field] != null && lead[fieldConfig.field] !== ""
                           ? lead[fieldConfig.field]
                           : "-"))}
               </p>
             ) : fieldConfig.isDropdown ? (
               <div className="flex-1 flex items-center gap-2">
                 <Select
                   value={getFieldValue(fieldConfig.field) || ""}
                   onValueChange={(value) => {
                     setLocalValues(prev => ({ ...prev, [fieldConfig.field]: value }));
                     onFieldChange(fieldConfig.field, value);
                     autoSave(fieldConfig.field, value, (f, status) => {
                       setSaveStatus((prev) => ({ ...prev, [f]: status }));
                     });
                     // Also update the denormalized name field
                     const selectedStatus = retentionStatuses.find(s => s.id === value);
                     if (selectedStatus) {
                       setLocalValues(prev => ({ ...prev, retention_status: selectedStatus.name }));
                       onFieldChange("retention_status", selectedStatus.name);
                       autoSave("retention_status", selectedStatus.name, () => {});
                     }
                   }}
                 >
                   <SelectTrigger className="flex-1">
                     <SelectValue placeholder="Select status..." />
                   </SelectTrigger>
                   <SelectContent>
                     {retentionStatuses.map((status) => (
                       <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <SaveIndicator status={saveStatus[fieldConfig.field]} />
               </div>
             ) : fieldConfig.isSelectDropdown ? (
               <div className="flex-1 flex items-center gap-2">
                 <Select
                   value={getFieldValue(fieldConfig.field) || ""}
                   onValueChange={(value) => {
                     setLocalValues(prev => ({ ...prev, [fieldConfig.field]: value }));
                     onFieldChange(fieldConfig.field, value);
                     autoSave(fieldConfig.field, value, (f, status) => {
                       setSaveStatus((prev) => ({ ...prev, [f]: status }));
                     });
                   }}
                 >
                   <SelectTrigger className="flex-1">
                     <SelectValue placeholder="Select option..." />
                   </SelectTrigger>
                   <SelectContent>
                     {fieldConfig.options.map((opt) => (
                       <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <SaveIndicator status={saveStatus[fieldConfig.field]} />
               </div>
             ) : (
               <div className="flex-1 flex items-center gap-2">
                 <Input
                   type={fieldConfig.type || "text"}
                   value={fieldConfig.type === "datetime-local" ? toSLInputValue(getFieldValue(fieldConfig.field)) : getFieldValue(fieldConfig.field)}
                   onChange={(e) => {
                     const value = e.target.value;
                     onFieldChange(fieldConfig.field, value);
                     if (fieldConfig.type === "datetime-local") {
                       handleDateChange(fieldConfig.field, value);
                     }
                   }}
                   onBlur={(e) => {
                     if (fieldConfig.type !== "datetime-local") {
                       handleBlur(fieldConfig.field, e.target.value);
                     }
                   }}
                   className="text-sm flex-1"
                 />
                 <SaveIndicator status={saveStatus[fieldConfig.field]} />
               </div>
             )}
           </div>
         ))}
       </div>
    </div>
  );
}