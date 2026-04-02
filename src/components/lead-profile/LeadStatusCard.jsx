import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fmtSLT } from "@/components/utils/timezone";
import SaveIndicator from "./SaveIndicator";
import { useAutoSave } from "./useAutoSave.jsx";

const fmtDate = (val) => fmtSLT(val);

export default function LeadStatusCard({ lead, changes, onFieldChange, user, onActivityLogged, isAdmin }) {
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const { autoSave } = useAutoSave(lead.id);

  const handleStatusChange = async (statusId) => {
    const statusName = statuses.find(s => s.id === statusId)?.name || "";
    const oldStatusName = lead.lead_status || "Unknown";
    setSaveStatus(prev => ({ ...prev, status_id: "saving" }));

    try {
      // Update lead status
      await base44.entities.Lead.update(lead.id, { status_id: statusId, lead_status: statusName });

      // Trigger backend automation for conversion logic
      if (statusName === 'Converted') {
        const response = await base44.functions.invoke('handleLeadStatusChange', {
          leadId: lead.id,
          newStatus: statusName,
          userId: user?.id
        });
        
        // Apply backend updates to local state
        const updates = response.data?.updates || {};
        if (updates.account_status) {
          onFieldChange("account_status", updates.account_status);
        }
        if (updates.conversion_owner) {
          onFieldChange("conversion_owner", updates.conversion_owner);
        }
        if (updates.assigned_user_id) {
          onFieldChange("assigned_user_id", updates.assigned_user_id);
          onFieldChange("assigned_user", updates.assigned_user);
        }
      }

      setSaveStatus(prev => ({ ...prev, status_id: "saved" }));
      onFieldChange("status_id", statusId);
      onFieldChange("lead_status", statusName);

      // Log activity
      if (user?.id) {
        base44.entities.Activity.create({
          lead_id: lead.id,
          user_id: user.id,
          type: "StatusChange",
          previous_value: oldStatusName,
          new_value: statusName,
          notes: `Status changed from "${oldStatusName}" to "${statusName}"`,
        }).then(() => onActivityLogged?.()).catch(() => {});
      }

      setTimeout(() => setSaveStatus(prev => { const n = {...prev}; delete n.status_id; return n; }), 2000);
    } catch (error) {
      console.error('Status change failed:', error);
      setSaveStatus(prev => ({ ...prev, status_id: "error" }));
    }
  };

  const handleDatetimeChange = (field, value) => {
    onFieldChange(field, value);
    autoSave(field, value, (f, status) => {
      setSaveStatus(prev => ({ ...prev, [f]: status }));
    });
  };

  useEffect(() => {
    base44.entities.LeadStatus.filter({ is_active: true }).then(data =>
      setStatuses(data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
    );
    base44.entities.LeadSource.filter({ is_active: true }).then(data =>
      setSources(data.sort((a, b) => a.name.localeCompare(b.name)))
    );
  }, []);

  const getFieldValue = (field) => {
    return changes[field] !== undefined ? changes[field] : (lead[field] || "");
  };

  const noAnswerTimes = getFieldValue("no_answer_times") || 0;
  const isColdLead = noAnswerTimes > 7;

  // Resolve the display name for the current status_id
  const currentStatusId = getFieldValue("status_id");
  const currentStatusName = statuses.find(s => s.id === currentStatusId)?.name || lead.lead_status || "-";

  const staticFields = [
    {
      label: "Sales Follow Up Date & Time",
      field: "sales_follow_up_datetime",
      type: "datetime-local",
    },
    {
      label: "No Of Calls",
      field: "no_of_calls",
      type: "number",
      readonly: true,
    },
    {
      label: "No Answer Times",
      field: "no_answer_times",
      type: "number",
      readonly: true,
    },
    { label: "Country Code", field: "country_code", type: "text", readonly: true },
    { label: "Phone", field: "phone", type: "text", readonly: true },
    { label: "Phone Number", field: "phone_number", type: "text", readonly: true },
    { label: "Campaign Name", field: "campaign_name", type: "text", readonly: !isAdmin },
  ];

  // Resolve source label from source_id FK
  const sourceId = lead.source_id || changes?.source_id;
  const sourceName = sourceId
    ? (sources.find(s => s.id === sourceId)?.name || lead.source || "-")
    : (lead.source || "-");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Lead Status</h2>
        {isColdLead && (
          <div className="mt-2 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            <AlertCircle className="w-4 h-4" />
            <span>No Answer Times &gt; 7: Consider updating status</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Status dropdown — dynamic from DB */}
        <div className="flex items-center gap-4">
          <Label className="text-sm text-gray-600 font-medium w-40 flex-shrink-0">Lead Status</Label>
          <div className="flex-1 flex items-center gap-2">
            <Select
              value={currentStatusId}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={currentStatusName} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SaveIndicator status={saveStatus.status_id} />
          </div>
        </div>

        {staticFields.map((fieldGroup) => (
          <div key={fieldGroup.field} className="flex items-center gap-4">
            <Label className="text-sm text-gray-600 font-medium w-40 flex-shrink-0">{fieldGroup.label}</Label>
            {fieldGroup.type === "number" ? (
              <p className="text-sm text-gray-900 font-medium flex-1">{getFieldValue(fieldGroup.field) || "-"}</p>
            ) : fieldGroup.readonly ? (
              <p className="text-sm text-gray-900 font-medium flex-1">
                {fieldGroup.render
                  ? fieldGroup.render()
                  : (lead[fieldGroup.field] != null && lead[fieldGroup.field] !== "" ? lead[fieldGroup.field] : "-")}
              </p>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type={fieldGroup.type}
                  value={getFieldValue(fieldGroup.field)}
                  onChange={(e) => {
                    if (fieldGroup.type === "datetime-local") {
                      handleDatetimeChange(fieldGroup.field, e.target.value);
                    } else {
                      onFieldChange(fieldGroup.field, e.target.value);
                    }
                  }}
                  className="text-sm flex-1"
                />
                {fieldGroup.type === "datetime-local" && <SaveIndicator status={saveStatus[fieldGroup.field]} />}
              </div>
            )}
          </div>
        ))}

        {/* Source — editable for admin, read-only for users */}
        <div className="flex items-center gap-4">
          <Label className="text-sm text-gray-600 font-medium w-40 flex-shrink-0">Source</Label>
          {isAdmin ? (
            <div className="flex-1 flex items-center gap-2">
              <Select
                value={lead.source_id || ""}
                onValueChange={(v) => {
                  const sourceName = sources.find(s => s.id === v)?.name || "";
                  onFieldChange("source_id", v);
                  onFieldChange("source", sourceName);
                  autoSave("source_id", v, (f, status) => setSaveStatus(prev => ({ ...prev, [f]: status })));
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={sourceName} />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <SaveIndicator status={saveStatus.source_id} />
            </div>
          ) : (
            <p className="text-sm text-gray-900 font-medium flex-1">{sourceName}</p>
          )}
        </div>
      </div>
    </div>
  );
}