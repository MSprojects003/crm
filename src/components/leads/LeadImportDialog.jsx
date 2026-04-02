import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, AlertCircle, Check, Settings2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cleanPhone } from "@/components/phoneUtils";
import { getActiveAgents } from "@/components/roundRobinAssignment";
import SaveTemplateDialog from "@/components/leads/SaveTemplateDialog";
import ManageTemplatesDialog from "@/components/leads/ManageTemplatesDialog";

const FIELD_OPTIONS = [
  { value: "name", label: "Full Name (splits into first & last)" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "country_code", label: "Country Code" },
  { value: "phone_number", label: "Phone Number (without code)" },
  { value: "language", label: "Language" },
  { value: "source", label: "Source" },
  { value: "campaign_name", label: "Campaign Name" },
  { value: "status", label: "Status" },
  { value: "potential_value", label: "Potential Value" },
  { value: "account_name", label: "Account Name" },
  { value: "account_type", label: "Account Type" },
  { value: "server", label: "Server" },
  { value: "equity", label: "Equity" },
  { value: "balance", label: "Balance" },
  { value: "deposit_amount_usd", label: "Deposit Amount (USD)" },
  { value: "no_of_calls", label: "No Of Calls" },
  { value: "client_feedback", label: "Client Feedback" },
  { value: "account", label: "Account in Client Status" },
  { value: "account_number", label: "Account Number" },
  { value: "account_name", label: "Account Name" },
  { value: "account_type", label: "Account Type" },
  { value: "server", label: "Server" },
  { value: "equity", label: "Equity" },
  { value: "balance", label: "Balance" },
  { value: "investor_password", label: "Investor Password" },
  { value: "client_feedback", label: "Client Feedback" },
  { value: "ftd_datetime", label: "FTD Date & Time" },
  { value: "ftd_amount", label: "FTD Amount" },
  { value: "last_deposit_date", label: "Last Deposit Date (dd/mm/yyyy)" },
  { value: "last_withdrawal_sl", label: "Last Withdrawal Date SL (dd/mm/yyyy)" },
  { value: "last_withdrawal_utc", label: "Last Withdrawal Date UTC (dd/mm/yyyy)" },
  { value: "last_withdrawal_amount", label: "Last Withdrawal Amount" },
  { value: "retention_status", label: "Retention Status" },
  { value: "retention_follow_up", label: "Retention Follow Up Notes" },
  { value: "client_potential", label: "Client Potential" },
  { value: "client_deposit_potential", label: "Client Deposit Potential" },
  { value: "conversion_owner", label: "Conversion Owner" },
  { value: "registration_date", label: "Registration Date" },
  { value: "assigned_user_id", label: "Assigned User ID" },
];

const DATE_FIELDS = ["last_deposit_date", "last_withdrawal_sl", "last_withdrawal_utc", "registration_date"];
const DATETIME_FIELDS = ["ftd_datetime", "sales_follow_up_datetime"];
const NUMERIC_FIELDS = ["deposit_amount_usd", "no_of_calls", "last_withdrawal_amount", "potential_value", "ftd_amount", "equity", "balance"];

// Parse dd/mm/yyyy → ISO date string
const parseDDMMYYYY = (val) => {
  if (!val) return null;
  const m = val.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(`${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`);
  return isNaN(date) ? null : date.toISOString().split("T")[0];
};

const INITIAL_STATE = {
  columns: [],
  mapping: {},
  csvData: [],
  step: "upload", // upload → mapping → settings → classification → duplicates → summary
  summary: null,
  selectedTemplateId: "",
  loading: false,
  error: "",
  // Global import settings
  importStatus: "",
  importSource: "",
  importSourceCustom: "",
  assignmentMode: "none", // none | specific | roundrobin
  specificAgentId: "",
  rrAgentIds: [],
  // Classification results
  validLeads: [],
  blankNumbers: [],
  invalidNumbers: [],
  duplicateLeads: [],
  duplicateMode: "keep", // keep | replace | update | review
  duplicateResolutions: {}, // Map of duplicate lead ID to action
};

export default function LeadImportDialog({ open, onClose, onImport }) {
  const [state, setState] = useState(INITIAL_STATE);
  const [templates, setTemplates] = useState([]);
  const [agents, setAgents] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [existingSources, setExistingSources] = useState([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showManageTemplates, setShowManageTemplates] = useState(false);
  const [user, setUser] = useState(null);

  const set = (patch) => setState(s => ({ ...s, ...patch }));

  useEffect(() => {
    if (open) {
      loadTemplates();
      base44.auth.me().then(setUser);
      getActiveAgents().then(setAgents);
      // Load statuses and sources from their respective entities
      base44.entities.LeadStatus.list("sort_order", 100).then(statuses => {
        setLeadStatuses(statuses.filter(s => s.is_active !== false));
      });
      base44.entities.LeadSource.list("name", 100).then(sources => {
        setExistingSources(sources.filter(s => s.is_active !== false));
      });
    }
  }, [open]);

  const loadTemplates = async () => {
    const list = await base44.entities.ImportTemplate.list();
    setTemplates(list);
  };

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    set({ error: "" });

    const text = await f.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { set({ error: "CSV must have header and data rows" }); return; }

    const rawHeaders = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map(line => {
      const cols = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ""; }
        else { cur += ch; }
      }
      cols.push(cur.trim());
      return cols;
    });

    const selectedTemplate = templates.find(t => t.id === state.selectedTemplateId);
    let newMapping = {};
    let templatePatch = {};

    if (selectedTemplate) {
      const invertedMap = {};
      Object.entries(selectedTemplate.mapping || {}).forEach(([csvCol, crmField]) => {
        if (!Array.isArray(crmField)) invertedMap[csvCol] = crmField;
      });
      rawHeaders.forEach(col => {
        const normalized = col.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        newMapping[col] = invertedMap[col] || invertedMap[normalized] || "";
      });
      // Pre-fill settings from template defaults (user can override)
      const d = selectedTemplate.defaults || {};
      templatePatch = {
        importSource: d.source || "",
        importStatus: d.stage || "",
        assignmentMode: selectedTemplate.round_robin_enabled ? "roundrobin" : "none",
      };
    } else {
      rawHeaders.forEach(col => {
        const normalized = col.toLowerCase().replace(/\s+/g, "_");
        const match = FIELD_OPTIONS.find(f => f.value === normalized);
        newMapping[col] = match ? match.value : "";
      });
    }

    set({ columns: rawHeaders, csvData: rows, mapping: newMapping, step: "mapping", ...templatePatch });
  };

  const validateE164 = (phone) => /^\+[1-9]\d{5,14}$/.test(phone);

  const classifyRows = async () => {
    const { mapping, columns, csvData, importStatus, importSource } = state;

    // Check if status or source is mapped from CSV
    const statusIsMapped = Object.values(mapping).includes("status");
    const sourceIsMapped = Object.values(mapping).includes("source");

    // Only require manual status selection if status is NOT mapped from CSV
    if (!statusIsMapped && !importStatus) {
      set({ error: "Please select a Lead Status (Stage) before importing." });
      return;
    }

    // Build case-insensitive name→id lookups
    const statusNameMap = new Map(
      leadStatuses.map(s => [s.name.toLowerCase().trim(), s.id])
    );
    let sourceNameMap = new Map(
      existingSources.map(s => [s.name.toLowerCase().trim(), s.id])
    );

    set({ loading: true, error: "" });

    try {
      const existingLeads = await base44.entities.Lead.list("-created_date", 500).catch(() => []);
      const existingPhoneMap = new Map(existingLeads.map(l => [l.phone, l]));

      const validLeads = [], blankNumbers = [], invalidNumbers = [], duplicateLeads = [];

      for (const [rowNum, row] of csvData.entries()) {
        const lead = {};
        let csvSourceValue = null;
        let csvStatusValue = null;

        columns.forEach((col, idx) => {
          const field = mapping[col];
          if (field) {
            let value = (row[idx] || "").replace(/^"|"$/g, "").trim();
            if (field === "name") {
              const parts = value.trim().split(/\s+/);
              lead.first_name = parts[0] || "";
              lead.last_name = parts.slice(1).join(" ") || parts[0] || "";
              return;
            }
            if (field === "source") { csvSourceValue = value; return; }
            if (field === "status") { csvStatusValue = value; return; }
            if (NUMERIC_FIELDS.includes(field)) { lead[field] = value ? parseFloat(String(value).replace(/,/g, "")) : null; return; }
            if (DATE_FIELDS.includes(field)) { lead[field] = parseDDMMYYYY(value) || (value || null); return; }
            if (DATETIME_FIELDS.includes(field)) {
              if (value) { const d = new Date(value); lead[field] = !isNaN(d) ? d.toISOString() : null; }
              return;
            }
            lead[field] = value;
          }
        });

        // Resolve status_id AND lead_status (denormalized)
        if (csvStatusValue) {
          const csvStatusKey = csvStatusValue.toLowerCase().trim();
          const resolvedStatusId = statusNameMap.get(csvStatusKey) || null;
          lead.status_id = resolvedStatusId;
          // Set the denormalized lead_status from the matching LeadStatus name
          const matchedStatus = leadStatuses.find(s => s.id === resolvedStatusId);
          lead.lead_status = matchedStatus?.name || csvStatusValue || null;
        } else if (importStatus) {
          lead.status_id = importStatus;
          const matchedStatus = leadStatuses.find(s => s.id === importStatus);
          lead.lead_status = matchedStatus?.name || null;
        }

        // Resolve source_id: auto-create if CSV value not found
        if (csvSourceValue) {
          const key = csvSourceValue.toLowerCase().trim();
          let resolvedSourceId = sourceNameMap.get(key);
          if (!resolvedSourceId) {
            const newSource = await base44.entities.LeadSource.create({ name: csvSourceValue, is_active: true }).catch(() => null);
            if (newSource) { resolvedSourceId = newSource.id; sourceNameMap.set(key, newSource.id); }
          }
          lead.source_id = resolvedSourceId || importSource || null;
        } else if (importSource) {
          lead.source_id = importSource;
        }

        const originalPhone = lead.phone || "";
        if (lead.phone) lead.phone = cleanPhone(lead.phone) || lead.phone;

        if (!lead.phone || lead.phone.trim() === "") {
          blankNumbers.push({ ...lead, originalPhone, rowNumber: rowNum + 2 });
        } else if (!validateE164(lead.phone)) {
          invalidNumbers.push({ ...lead, originalPhone, processedPhone: lead.phone, rowNumber: rowNum + 2 });
        } else if (existingPhoneMap.has(lead.phone)) {
          const existing = existingPhoneMap.get(lead.phone);
          duplicateLeads.push({
            ...lead,
            existingLeadId: existing.id,
            existingLeadName: `${existing.first_name} ${existing.last_name}`,
            existingOwner: existing.assigned_user_id || "Unassigned",
            rowNumber: rowNum + 2
          });
        } else {
          validLeads.push(lead);
          existingPhoneMap.set(lead.phone, { id: "new_" + validLeads.length, ...lead });
        }
      }

      set({
        loading: false,
        validLeads,
        blankNumbers,
        invalidNumbers,
        duplicateLeads,
        step: duplicateLeads.length > 0 ? "duplicates" : "duplicates"
      });
    } catch (err) {
      console.error("Classification error:", err);
      set({ loading: false, error: `Error classifying rows: ${err.message}` });
    }
  };

  const handleImport = async () => {
    await classifyRows();
  };

  const downloadCSV = (data, columns, filename) => {
    const csv = [columns.join(","), ...data.map(row => columns.map(col => `"${(row[col] || "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBlank = () => {
    downloadCSV(state.blankNumbers, ["full_name", "original phone", "email", "reason"], "blank_numbers.csv");
  };

  const handleExportInvalid = () => {
    downloadCSV(state.invalidNumbers, ["full_name", "original phone", "processed phone", "email", "reason"], "invalid_numbers.csv");
  };

  const handleExportDuplicates = () => {
    downloadCSV(state.duplicateLeads.map(d => ({ ...d, reason: "Phone Already Exists" })), 
      ["full_name", "phone", "email", "existingLeadId", "existingOwner", "reason"], "duplicate_leads.csv");
  };

  const resolveDuplicates = async () => {
    const { validLeads, duplicateLeads, duplicateMode, duplicateResolutions, importStatus, assignmentMode, specificAgentId, rrAgentIds } = state;

    if (duplicateMode === "keep") {
      proceedWithImport(validLeads, []);
    } else if (duplicateMode === "replace") {
      await Promise.all(duplicateLeads.map(d => base44.entities.Lead.delete(d.existingLeadId)));
      proceedWithImport([...validLeads, ...duplicateLeads], []);
    } else if (duplicateMode === "update") {
      await Promise.all(duplicateLeads.map(d => 
        base44.entities.Lead.update(d.existingLeadId, { email: d.email, source: d.source, status: d.status })
      ));
      proceedWithImport(validLeads, []);
    } else if (duplicateMode === "review") {
      const resolved = duplicateLeads.filter(d => {
        const action = duplicateResolutions[d.existingLeadId];
        if (action === "keep") return false;
        if (action === "replace") return true;
        if (action === "update") return false;
        return false;
      });
      await Promise.all(Object.entries(duplicateResolutions).map(([id, action]) => {
        if (action === "replace") return base44.entities.Lead.delete(id);
      }));
      proceedWithImport([...validLeads, ...resolved], []);
    }
  };

  const proceedWithImport = async (leadsToCreate, leadsToUpdate) => {
    const { importStatus, importSource, assignmentMode, specificAgentId, rrAgentIds } = state;
    set({ loading: true });

    let createdCount = 0, updatedCount = 0, assignedCount = 0, failedCount = 0;
    const errors = [];

    // Embed assigned_user_id directly in lead data for "specific" mode (ensures 100% assignment)
    let leadsWithAssignment = leadsToCreate;
    if (assignmentMode === "specific" && specificAgentId) {
      leadsWithAssignment = leadsToCreate.map(lead => ({
        ...lead,
        assigned_user_id: lead.assigned_user_id || specificAgentId,
      }));
    }

    // Create leads in batches
    if (leadsWithAssignment.length > 0) {
      try {
        // Generate current timestamp for all leads (SLT will be stored as UTC internally by the system)
        const importTimestamp = new Date().toISOString();
        const leadsWithTimestamp = leadsWithAssignment.map(lead => ({
          ...lead,
          created_date: importTimestamp,
        }));
        
        const createdLeads = await base44.entities.Lead.bulkCreate(leadsWithTimestamp).catch(err => {
          console.error("bulkCreate error:", err);
          errors.push(`Bulk create failed: ${err.message}`);
          return [];
        });

        createdCount = createdLeads.length;
        failedCount = leadsWithAssignment.length - createdLeads.length;

        if (createdLeads.length > 0) {
          if (assignmentMode === "roundrobin") {
            const selectedAgents = agents.filter(a => rrAgentIds.includes(a.id));
            const result = await assignLeadsRoundRobinBatch(createdLeads, selectedAgents);
            assignedCount = result.assigned;
          } else if (assignmentMode === "specific" && specificAgentId) {
            assignedCount = createdLeads.length;
          }
        }
      } catch (err) {
        console.error("Import error:", err);
        errors.push(`Failed to create leads: ${err.message}`);
      }
    }

    updatedCount = leadsToUpdate.length;

    const assignmentLabel = assignmentMode === "roundrobin" ? "Round Robin (Selected Agents)" :
      assignmentMode === "specific" ? "Specific Agent" : "Not Assigned";

    const finalSource = importSource;

    // Save import session
    await saveImportSession(createdCount, updatedCount, failedCount, errors, assignmentLabel, finalSource);

    set({
      loading: false,
      summary: {
        total: state.csvData.length,
        created: createdCount,
        updated: updatedCount,
        replaced: 0,
        skipped: state.blankNumbers.length + state.invalidNumbers.length + (state.duplicateMode === "keep" ? state.duplicateLeads.length : 0),
        failed: failedCount,
        blank: state.blankNumbers.length,
        invalid: state.invalidNumbers.length,
        duplicatesResolved: state.duplicateLeads.length,
        assigned: assignedCount,
        assignmentMode: assignmentLabel,
        stageApplied: leadStatuses.find(s => s.id === importStatus)?.name || importStatus || "—",
        sourceApplied: existingSources.find(s => s.id === finalSource)?.name || finalSource || "—",
        errors: errors.length > 0 ? errors : null,
      },
      step: "summary",
    });
  };

  const saveImportSession = async (createdCount, updatedCount, failedCount, errors, assignmentLabel, finalSource) => {
    if (!user) return;
    try {
      const importId = `IMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const status = failedCount > 0 ? "Partial" : createdCount === 0 && updatedCount === 0 ? "Failed" : "Success";

      await base44.entities.ImportSession.create({
        import_id: importId,
        user_id: user.id,
        total_rows: state.csvData.length,
        created_count: createdCount,
        updated_count: updatedCount,
        duplicate_count: state.duplicateLeads.length,
        invalid_count: state.invalidNumbers.length,
        blank_count: state.blankNumbers.length,
        source: finalSource || null,
        assignment_mode: assignmentLabel,
        status,
        errors,
        import_timestamp: new Date().toISOString(),
      });

      // Save invalid logs
      const invalidLogsToSave = state.invalidNumbers.map(lead => ({
        import_id: importId,
        type: "invalid",
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.processedPhone,
        original_phone: lead.originalPhone,
        email: lead.email,
        reason: "Invalid Format",
        row_number: lead.rowNumber,
      }));

      // Save blank logs
      const blankLogsToSave = state.blankNumbers.map(lead => ({
        import_id: importId,
        type: "blank",
        first_name: lead.first_name,
        last_name: lead.last_name,
        original_phone: lead.originalPhone,
        email: lead.email,
        reason: "Blank Phone",
        row_number: lead.rowNumber,
      }));

      // Save duplicate logs
      const duplicateLogsToSave = state.duplicateLeads.map(lead => ({
        import_id: importId,
        type: "duplicate",
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,
        existing_lead_id: lead.existingLeadId,
        existing_owner: lead.existingOwner,
        reason: "Duplicate",
        action_taken: state.duplicateMode === "keep" ? "Skipped" : state.duplicateMode === "replace" ? "Replaced" : state.duplicateMode === "update" ? "Updated" : "Skipped",
      }));

      const allLogs = [...invalidLogsToSave, ...blankLogsToSave, ...duplicateLogsToSave];
      if (allLogs.length > 0) {
        await base44.entities.ImportLog.bulkCreate(allLogs).catch(err => {
          console.warn("Failed to save import logs:", err);
        });
      }
    } catch (err) {
      console.error("Failed to save import session:", err);
    }
  };

  // Session-based round robin: uses only the selectedAgents array, no global index persistence
  const assignLeadsRoundRobinBatch = async (leads, selectedAgents) => {
    if (selectedAgents.length === 0) return { assigned: 0 };

    let currentIndex = 0;
    let assigned = 0;
    for (const lead of leads) {
      const agent = selectedAgents[currentIndex % selectedAgents.length];
      await base44.entities.Lead.update(lead.id, { assigned_user_id: agent.id });
      currentIndex++;
      assigned++;
    }

    return { assigned };
  };

  const handleClose = () => { setState(INITIAL_STATE); onClose(); };
  const handleDone = () => { onImport(); setState(INITIAL_STATE); onClose(); };

  const isAdmin = user?.role === "admin";
  const { step, columns, mapping, csvData, summary, loading, error, selectedTemplateId,
    importStatus, importSource, assignmentMode, specificAgentId, 
    validLeads, blankNumbers, invalidNumbers, duplicateLeads, duplicateMode } = state;
  const rrAgentIds = state.rrAgentIds || [];
  const statusIsMapped = Object.values(mapping).includes("status");
  const sourceIsMapped = Object.values(mapping).includes("source");

  const toggleRRAgent = (id) => {
    set({ rrAgentIds: rrAgentIds.includes(id) ? rrAgentIds.filter(a => a !== id) : [...rrAgentIds, id] });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>
              {step === "upload" ? "Upload a CSV file with lead data" :
               step === "mapping" ? "Map CSV columns to CRM fields" :
               step === "settings" ? "Configure import settings" :
               step === "classification" ? "Classifying rows..." :
               step === "duplicates" ? "Resolve duplicate phone numbers" : "Import complete"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">

            {/* ── STEP: UPLOAD ── */}
            {step === "upload" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Import Template (optional)</Label>
                    {isAdmin && (
                      <button className="text-xs text-blue-600 hover:underline flex items-center gap-1" onClick={() => setShowManageTemplates(true)}>
                        <Settings2 className="w-3 h-3" /> Manage Templates
                      </button>
                    )}
                  </div>
                  <Select value={selectedTemplateId} onValueChange={v => set({ selectedTemplateId: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="No Template (Manual Mapping)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>No Template (Manual Mapping)</SelectItem>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplateId && (
                    <p className="text-xs text-blue-600 mt-1">Template will auto-apply mapping & default settings (you can still override).</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs mb-2 block">CSV File</Label>
                  <Input type="file" accept=".csv" onChange={handleFileSelect} className="cursor-pointer" />
                  <p className="text-xs text-gray-500 mt-2">Select a CSV file to preview and map columns to fields.</p>
                </div>

                {error && <ErrorBox msg={error} />}
              </>
            )}

            {/* ── STEP: MAPPING ── */}
            {step === "mapping" && (
              <>
                {selectedTemplateId && (
                  <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Template mapping applied. Review and adjust if needed.</span>
                  </div>
                )}

                <div className="space-y-3 max-h-72 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                  {columns.map((col, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 truncate flex-1">{col}</Label>
                      <Select value={mapping[col] || ""} onValueChange={(v) => set({ mapping: { ...mapping, [col]: v } })}>
                        <SelectTrigger className="w-44 h-8"><SelectValue placeholder="Skip column" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Skip Column</SelectItem>
                          {FIELD_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {csvData.length > 0 && (
                  <p className="text-xs text-gray-600">Preview: <span className="font-medium">{csvData.length} rows</span> to import</p>
                )}

                {error && <ErrorBox msg={error} />}
              </>
            )}

            {/* ── STEP: SETTINGS ── */}
            {step === "settings" && (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-5">
                  <h3 className="text-sm font-semibold text-gray-800">Global Import Settings</h3>
                  <p className="text-xs text-gray-500 -mt-3">These settings apply to all valid leads in this import.</p>

                  {/* Status */}
                  <div>
                    <Label className="text-xs mb-1 block">
                      Default Lead Status / Stage {!statusIsMapped && <span className="text-red-500">*</span>}
                    </Label>
                    {statusIsMapped ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-xs text-green-700">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        Status mapped from CSV — values will be used per row. Unknown statuses will be left unassigned.
                      </div>
                    ) : (
                      <Select value={importStatus} onValueChange={v => set({ importStatus: v })}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select stage..." />
                        </SelectTrigger>
                        <SelectContent>
                          {leadStatuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Source */}
                  <div>
                    <Label className="text-xs mb-1 block">Default Source</Label>
                    {sourceIsMapped ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-xs text-green-700">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        Source mapped from CSV — values will be used per row. New sources will be created automatically.
                      </div>
                    ) : (
                      <Select value={importSource} onValueChange={v => set({ importSource: v })}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select or type source..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>— No Source —</SelectItem>
                          {existingSources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Assignment */}
                  <div>
                    <Label className="text-xs mb-2 block">Assignment Mode</Label>
                    <RadioGroup value={assignmentMode} onValueChange={v => set({ assignmentMode: v })} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="none" id="assign-none" />
                        <Label htmlFor="assign-none" className="text-sm cursor-pointer">Do Not Assign</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="specific" id="assign-specific" />
                        <Label htmlFor="assign-specific" className="text-sm cursor-pointer">Assign to Specific Agent</Label>
                      </div>
                      {assignmentMode === "specific" && (
                        <div className="ml-6">
                          <Select value={specificAgentId} onValueChange={v => set({ specificAgentId: v })}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select agent..." />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.full_name || a.email}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="roundrobin" id="assign-rr" />
                        <Label htmlFor="assign-rr" className="text-sm cursor-pointer">Auto Assign via Round Robin</Label>
                      </div>
                      {assignmentMode === "roundrobin" && (
                        <div className="ml-6 mt-1">
                          <Label className="text-xs text-gray-600 mb-2 block">Select Agents for Round Robin <span className="text-red-500">*</span></Label>
                          <div className="space-y-2 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg p-2">
                            {agents.length === 0 && <p className="text-xs text-gray-400">No active agents found.</p>}
                            {agents.map(a => (
                              <div key={a.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`rr-agent-${a.id}`}
                                  checked={rrAgentIds.includes(a.id)}
                                  onCheckedChange={() => toggleRRAgent(a.id)}
                                />
                                <Label htmlFor={`rr-agent-${a.id}`} className="text-sm cursor-pointer">
                                  {a.full_name || a.email}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {rrAgentIds.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">{rrAgentIds.length} agent(s) selected</p>
                          )}
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                </div>

                {error && <ErrorBox msg={error} />}
              </>
            )}

            {/* ── STEP: CLASSIFICATION ── */}
            {step === "classification" && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="text-sm text-gray-600">Classifying rows...</p>
                </div>
              </div>
            )}

            {/* ── STEP: DUPLICATES RESOLUTION ── */}
            {step === "duplicates" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Import Summary</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span>Total Rows:</span><span className="font-medium">{state.csvData.length}</span></div>
                    <div className="flex justify-between"><span>Valid Leads:</span><span className="font-medium text-green-600">{validLeads.length}</span></div>
                    <div className="flex justify-between"><span>Blank Numbers:</span><span className="font-medium text-yellow-600">{blankNumbers.length}</span></div>
                    <div className="flex justify-between"><span>Invalid Numbers:</span><span className="font-medium text-red-600">{invalidNumbers.length}</span></div>
                    <div className="flex justify-between col-span-2"><span>Duplicate Numbers:</span><span className="font-medium text-orange-600">{duplicateLeads.length}</span></div>
                  </div>
                  
                  {(blankNumbers.length > 0 || invalidNumbers.length > 0 || duplicateLeads.length > 0) && (
                    <div className="mt-4 space-y-2 flex gap-2 flex-wrap">
                      {blankNumbers.length > 0 && (
                        <Button size="sm" variant="outline" onClick={handleExportBlank} className="text-xs">
                          Download Blank Numbers CSV
                        </Button>
                      )}
                      {invalidNumbers.length > 0 && (
                        <Button size="sm" variant="outline" onClick={handleExportInvalid} className="text-xs">
                          Download Invalid Numbers CSV
                        </Button>
                      )}
                      {duplicateLeads.length > 0 && (
                        <Button size="sm" variant="outline" onClick={handleExportDuplicates} className="text-xs">
                          Download Duplicates CSV
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {duplicateLeads.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-orange-900">Duplicate Handling Mode</h3>
                    <RadioGroup value={duplicateMode} onValueChange={v => set({ duplicateMode: v })} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="keep" id="dup-keep" />
                        <Label htmlFor="dup-keep" className="text-sm cursor-pointer">Keep Existing (Skip All Duplicates)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="replace" id="dup-replace" />
                        <Label htmlFor="dup-replace" className="text-sm cursor-pointer">Replace Existing (Delete Old, Create New)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="update" id="dup-update" />
                        <Label htmlFor="dup-update" className="text-sm cursor-pointer">Update Existing Lead</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="review" id="dup-review" />
                        <Label htmlFor="dup-review" className="text-sm cursor-pointer">Review One by One</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: SUMMARY ── */}
            {step === "summary" && summary && (
              <div className="space-y-4">
                <div className={`rounded-lg p-4 border ${summary.created > 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
                  <div className="flex gap-2 mb-3">
                    <Check className={`w-5 h-5 flex-shrink-0 ${summary.created > 0 ? "text-green-600" : "text-yellow-600"}`} />
                    <h3 className={`font-semibold ${summary.created > 0 ? "text-green-900" : "text-yellow-900"}`}>
                      {summary.created > 0 ? "Import Complete" : "Import Finished with Issues"}
                    </h3>
                  </div>
                  <div className={`space-y-2 text-sm ${summary.created > 0 ? "text-green-900" : "text-yellow-900"}`}>
                    {[
                      ["Total Rows", summary.total],
                      ["Created", summary.created],
                      ["Updated", summary.updated],
                      ["Replaced", summary.replaced],
                      ["Failed", summary.failed],
                      ["Skipped", summary.skipped],
                      ["Blank Numbers", summary.blank],
                      ["Invalid Numbers", summary.invalid],
                      ["Duplicates Resolved", summary.duplicatesResolved],
                      ["Assigned", summary.assigned],
                    ].map(([label, val]) => (
                      val !== undefined && (
                        <div key={label} className="flex justify-between">
                          <span>{label}:</span><span className="font-medium">{val}</span>
                        </div>
                      )
                    ))}
                    <div className={`pt-2 border-t space-y-2 ${summary.created > 0 ? "border-green-200" : "border-yellow-200"}`}>
                      <div className="flex justify-between">
                        <span>Stage Applied:</span><span className="font-medium">{summary.stageApplied}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Source Applied:</span><span className="font-medium">{summary.sourceApplied}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {summary.errors && summary.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">Errors Encountered:</h4>
                    <div className="space-y-1 text-sm text-red-800">
                      {summary.errors.map((err, idx) => (
                        <p key={idx}>• {err}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                  <p className="font-semibold mb-2">Next Steps:</p>
                  <ul className="space-y-1 ml-4 list-disc text-xs">
                    <li>View full import details in Import History</li>
                    <li>Download error logs for follow-up</li>
                    <li>Review invalid or duplicate rows</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            {step === "mapping" && <Button variant="outline" onClick={() => set({ step: "upload" })}>Back</Button>}
            {step === "settings" && <Button variant="outline" onClick={() => set({ step: "mapping", error: "" })}>Back</Button>}
            {step === "duplicates" && <Button variant="outline" onClick={() => set({ step: "settings", error: "" })}>Back</Button>}

            {step === "mapping" && (
              <Button variant="outline" onClick={() => setShowSaveTemplate(true)}>Save as Template</Button>
            )}

            {step !== "summary" && <Button variant="outline" onClick={handleClose}>Cancel</Button>}

            {step === "mapping" && (
              <Button onClick={() => set({ step: "settings", error: "" })} className="bg-blue-600 hover:bg-blue-700 text-white">
                Next: Settings
              </Button>
            )}

            {step === "settings" && (
              <Button onClick={handleImport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="w-4 h-4 mr-1" /> {loading ? "Classifying..." : "Review & Classify"}
              </Button>
            )}

            {step === "duplicates" && (
              <Button onClick={resolveDuplicates} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Processing..." : "Proceed with Import"}
              </Button>
            )}

            {step === "summary" && (
              <Button onClick={handleDone} className="bg-green-600 hover:bg-green-700 text-white">Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveTemplateDialog
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        mapping={mapping}
        enableAutoAssign={assignmentMode === "roundrobin"}
        onSaved={loadTemplates}
      />

      <ManageTemplatesDialog
        open={showManageTemplates}
        onClose={() => { setShowManageTemplates(false); loadTemplates(); }}
      />
    </>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{msg}</span>
    </div>
  );
}