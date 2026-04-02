import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Upload, CheckCircle2, AlertCircle, Loader2, X, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const CRM_FIELDS = [
  { key: "skip", label: "-- Skip --" },
  // Basic Info
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone (full)" },
  { key: "phone_number", label: "Phone Number (no code)" },
  { key: "country_code", label: "Country Code" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  // Lead Info
  { key: "lead_status", label: "Lead Status" },
  { key: "source", label: "Source" },
  { key: "campaign_name", label: "Campaign Name" },
  { key: "assigned_user", label: "Assigned User" },
  { key: "conversion_owner", label: "Conversion Owner" },
  { key: "notes", label: "Notes" },
  { key: "client_feedback", label: "Client Feedback" },
  { key: "sales_follow_up_datetime", label: "Sales Follow Up Date & Time" },
  // Account / Trading
  { key: "account_number", label: "Account Number" },
  { key: "investor_password", label: "Investor Password" },
  { key: "account_status", label: "Account Status" },
  { key: "account", label: "Account" },
  { key: "deposit_amount_usd", label: "Deposit Amount (USD)" },
  // FTD / Financials
  { key: "ftd_datetime", label: "FTD Date & Time" },
  { key: "ftd_amount", label: "FTD Amount" },
  { key: "last_deposit_date", label: "Last Deposit Date" },
  { key: "last_withdrawal_sl", label: "Last Withdrawal Date (SL)" },
  { key: "last_withdrawal_utc", label: "Last Withdrawal Date (UTC)" },
  { key: "last_withdrawal_amount", label: "Last Withdrawal Amount" },
  // Retention
  { key: "retention_status", label: "Retention Status" },
  { key: "retention_follow_up", label: "Retention Follow Up" },
  { key: "client_potential", label: "Client Potential" },
  { key: "client_deposit_potential", label: "Client Deposit Potential" },
];

const DATE_FIELDS = new Set([
  "sales_follow_up_datetime", "ftd_datetime", "last_call_datetime",
]);
const DATE_ONLY_FIELDS = new Set([
  "last_deposit_date", "last_withdrawal_sl", "last_withdrawal_utc",
]);
const NUMERIC_FIELDS = new Set([
  "deposit_amount_usd", "ftd_amount", "last_withdrawal_amount",
  "no_of_calls", "no_answer_times", "dial_attempts",
]);

function autoMap(headers) {
  const map = {};
  headers.forEach(h => {
    const lower = h.toLowerCase().replace(/[\s_\-().]/g, "");
    if (lower.includes("firstname") || lower === "first") map[h] = "first_name";
    else if (lower.includes("lastname") || lower === "last") map[h] = "last_name";
    else if (lower.includes("email")) map[h] = "email";
    else if (lower.includes("phonenumber") || lower.includes("phoneno")) map[h] = "phone_number";
    else if (lower.includes("phone")) map[h] = "phone";
    else if (lower.includes("countrycode")) map[h] = "country_code";
    else if (lower.includes("country")) map[h] = "country";
    else if (lower.includes("city")) map[h] = "city";
    else if (lower.includes("company")) map[h] = "company";
    else if (lower.includes("campaign")) map[h] = "campaign_name";
    else if (lower.includes("leadstatus") || lower.includes("status")) map[h] = "lead_status";
    else if (lower.includes("source")) map[h] = "source";
    else if (lower.includes("assigneduser") || lower.includes("agent")) map[h] = "assigned_user";
    else if (lower.includes("conversionowner")) map[h] = "conversion_owner";
    else if (lower.includes("clientfeedback")) map[h] = "client_feedback";
    else if (lower.includes("note")) map[h] = "notes";
    else if (lower.includes("salesfollowup") || lower.includes("followup")) map[h] = "sales_follow_up_datetime";
    else if (lower.includes("accountnumber") || lower.includes("acctno")) map[h] = "account_number";
    else if (lower.includes("investorpassword")) map[h] = "investor_password";
    else if (lower.includes("accountstatus")) map[h] = "account_status";
    else if (lower.includes("account")) map[h] = "account";
    else if (lower.includes("depositamount") || lower.includes("depositusd")) map[h] = "deposit_amount_usd";
    else if (lower.includes("ftddate") || lower.includes("ftddatetime")) map[h] = "ftd_datetime";
    else if (lower.includes("ftdamount")) map[h] = "ftd_amount";
    else if (lower.includes("lastdepositdate")) map[h] = "last_deposit_date";
    else if (lower.includes("lastwithdrawalsl") || lower.includes("withdrawalsl")) map[h] = "last_withdrawal_sl";
    else if (lower.includes("lastwithdrawalutc") || lower.includes("withdrawalutc")) map[h] = "last_withdrawal_utc";
    else if (lower.includes("lastwithdrawalamount") || lower.includes("withdrawalamount")) map[h] = "last_withdrawal_amount";
    else if (lower.includes("retentionstatus")) map[h] = "retention_status";
    else if (lower.includes("retentionfollowup")) map[h] = "retention_follow_up";
    else if (lower.includes("clientpotential") && lower.includes("deposit")) map[h] = "client_deposit_potential";
    else if (lower.includes("clientpotential")) map[h] = "client_potential";
    else map[h] = "skip";
  });
  return map;
}

export default function ExcelImportDialog({ open, onClose, onImport }) {
  const [step, setStep] = useState("upload"); // upload | mapping | preview | result
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setPreview([]);
    setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (data.length < 2) { toast.error("File has no data rows"); return; }
    const hdrs = data[0].map(String);
    const dataRows = data.slice(1).filter(r => r.some(c => c !== undefined && c !== ""));
    setHeaders(hdrs);
    setRows(dataRows);
    setMapping(autoMap(hdrs));
    setStep("mapping");
  };

  const buildPreview = () => {
    const mapped = rows.slice(0, 20).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const field = mapping[h];
        if (field && field !== "skip") obj[field] = row[i] != null ? String(row[i]).trim() : "";
      });
      return obj;
    });
    setPreview(mapped);
    setStep("preview");
  };

  const handleImport = async () => {
    setLoading(true);
    const allMapped = rows.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const field = mapping[h];
        if (field && field !== "skip") obj[field] = row[i] != null ? String(row[i]).trim() : "";
      });
      return obj;
    });

    // Fetch existing leads for dedup AND LeadStatuses for status_id lookup
    const [existingLeads, leadStatuses] = await Promise.all([
      base44.entities.Lead.list(),
      base44.entities.LeadStatus.filter({ is_active: true }),
    ]);
    const existingPhones = new Set(existingLeads.map(l => l.phone?.replace(/\s/g, "")));
    const existingEmails = new Set(existingLeads.map(l => l.email?.toLowerCase()));

    // Build a case-insensitive map: status name → status id
    const statusNameToId = {};
    leadStatuses.forEach(s => { statusNameToId[s.name.toLowerCase()] = s.id; });

    let created = 0, skipped = 0, errors = 0;
    const errorList = [];

    for (const row of allMapped) {
      if (!row.first_name && !row.last_name && !row.phone) { skipped++; continue; }

      // Dedup check
      const phone = row.phone?.replace(/\s/g, "");
      const email = row.email?.toLowerCase();
      if ((phone && existingPhones.has(phone)) || (email && existingEmails.has(email))) {
        skipped++;
        continue;
      }

      try {
        const leadData = { ...row };

        // Sync status_id from lead_status text so DB stays consistent
        if (leadData.lead_status) {
          const sid = statusNameToId[leadData.lead_status.toLowerCase()];
          if (sid) leadData.status_id = sid;
        }
        // Default to "Unassigned" if no status provided
        if (!leadData.lead_status || !leadData.status_id) {
          const unassignedId = statusNameToId["unassigned"];
          if (unassignedId) {
            leadData.status_id = unassignedId;
            leadData.lead_status = "Unassigned";
          }
        }

        // sales_follow_up_datetime: stored as naive SLT string (YYYY-MM-DDTHH:mm)
        // to match how datetime-local inputs save it. Do NOT convert to UTC.
        if (leadData.sales_follow_up_datetime) {
          const raw = leadData.sales_follow_up_datetime;
          // Normalize to YYYY-MM-DDTHH:mm naive format
          const d = new Date(raw);
          if (!isNaN(d)) {
            // Convert to naive SLT: treat parsed time as UTC, add SLT offset, strip seconds
            const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
            const slt = new Date(d.getTime() + SLT_OFFSET_MS);
            leadData.sales_follow_up_datetime = slt.toISOString().slice(0, 16);
          } else {
            delete leadData.sales_follow_up_datetime;
          }
        }

        // Parse other datetime fields (non-follow-up) → ISO UTC string
        const otherDateFields = [...DATE_FIELDS].filter(f => f !== "sales_follow_up_datetime");
        for (const field of otherDateFields) {
          if (leadData[field]) {
            const d = new Date(leadData[field]);
            if (!isNaN(d)) leadData[field] = d.toISOString();
            else delete leadData[field];
          }
        }

        // Parse date-only fields → YYYY-MM-DD
        for (const field of DATE_ONLY_FIELDS) {
          if (leadData[field]) {
            const d = new Date(leadData[field]);
            if (!isNaN(d)) leadData[field] = d.toISOString().split("T")[0];
            else delete leadData[field];
          }
        }

        // Parse numeric fields
        for (const field of NUMERIC_FIELDS) {
          if (leadData[field] !== undefined && leadData[field] !== "") {
            const n = parseFloat(String(leadData[field]).replace(/,/g, ""));
            if (!isNaN(n)) leadData[field] = n;
            else delete leadData[field];
          }
        }

        if (!leadData.first_name) leadData.first_name = "Unknown";
        if (!leadData.last_name) leadData.last_name = "-";
        
        // Always set account_status to "Lead" for imported leads
        leadData.account_status = "Lead";

        await base44.entities.Lead.create(leadData);
        if (phone) existingPhones.add(phone);
        if (email) existingEmails.add(email);
        created++;
      } catch (e) {
        errors++;
        errorList.push(`Row: ${JSON.stringify(row)} → ${e.message}`);
      }
    }

    setResult({ created, skipped, errors, errorList, total: allMapped.length });
    setStep("result");
    setLoading(false);
    if (created > 0) onImport();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Import Leads from Excel / CSV
          </DialogTitle>
        </DialogHeader>

        {/* STEP: UPLOAD */}
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center gap-4">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-700">Drop your Excel or CSV file here</p>
              <p className="text-sm text-gray-500 mt-1">Supports .xlsx, .xls, .csv</p>
            </div>
            <Button onClick={() => fileRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white">
              Choose File
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* STEP: MAPPING */}
        {step === "mapping" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{rows.length} data rows found. Map your columns to CRM fields:</p>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {headers.map(h => (
                <div key={h} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-48 flex-shrink-0 truncate" title={h}>{h}</span>
                  <span className="text-gray-400">→</span>
                  <Select value={mapping[h] || "skip"} onValueChange={v => setMapping(m => ({ ...m, [h]: v }))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRM_FIELDS.map(f => (
                        <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={buildPreview} className="bg-blue-600 hover:bg-blue-700 text-white">Preview Import</Button>
            </div>
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Preview of first {preview.length} records (out of {rows.length} total):</p>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="text-xs w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0] || {}).map(k => (
                      <th key={k} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-1.5 text-gray-700 max-w-[150px] truncate">{v || "-"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>Back</Button>
              <Button onClick={handleImport} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Import {rows.length} Records
              </Button>
            </div>
          </div>
        )}

        {/* STEP: RESULT */}
        {step === "result" && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700">{result.created}</p>
                <p className="text-sm text-green-600">Imported</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <X className="w-8 h-8 text-yellow-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
                <p className="text-sm text-yellow-600">Skipped (duplicates)</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-700">{result.errors}</p>
                <p className="text-sm text-red-600">Errors</p>
              </div>
            </div>
            {result.errorList.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
                {result.errorList.map((e, i) => (
                  <p key={i} className="text-xs text-red-700">{e}</p>
                ))}
              </div>
            )}
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}