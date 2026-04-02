import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";
import { fmtSLT } from "@/components/utils/timezone";
import SaveIndicator from "./SaveIndicator";
import { useAutoSave } from "./useAutoSave";

const fmtDate = (val) => fmtSLT(val, true);

export default function AccountInformationCard({
  lead,
  changes,
  onFieldChange,
  isAgent,
  crmRoleName = "",
  allUsers = []
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState({});
  const { autoSave } = useAutoSave(lead.id);

  const handleBlur = (field, value) => {
    autoSave(field, value, (f, status) => {
      setSaveStatus((prev) => ({ ...prev, [f]: status }));
    });
  };

  const getFieldValue = (field) => {
    return changes[field] !== undefined ? changes[field] : lead[field] || "";
  };

  const getReadOnlyValue = (field) => {
    const val = changes[field] != null && changes[field] !== "" ? changes[field] : lead[field];
    return val != null && val !== "" ? val : "-";
  };

  const isEditable = (field) => {
    // Admin sees everything editable
    if (!isAgent) return true;
    // Agent, Retention, User can always edit these three fields
    const allowedForRestricted = ["account_number", "investor_password", "client_feedback", "server"];
    if (allowedForRestricted.includes(field)) return true;
    return false;
  };

  const topFields = [
    { label: "First Name", value: lead.first_name },
    { label: "Last Name", value: lead.last_name },
    { label: "Phone Number", value: lead.phone },
    { label: "Email", value: lead.email },
  ];

  // Get the assigned user's full name from allUsers based on assigned_user_id
  const getAssignedUserName = () => {
    if (!lead.assigned_user_id) return "-";
    const assignedUser = allUsers.find(u => u.id === lead.assigned_user_id || u.email === lead.assigned_user_id);
    const fullName = assignedUser?.full_name || lead.assigned_user || "";
    return fullName || "-";
  };

  // Get conversion owner full name (stored value may be email)
  const getConversionOwnerName = () => {
    const raw = lead.conversion_owner;
    if (!raw) return "-";
    const found = allUsers.find(u => u.email === raw || u.id === raw || u.full_name === raw);
    const fullName = found?.full_name || "";
    if (fullName) return fullName;
    // If no user found, return raw value only if it's not an email
    return raw.includes('@') ? "-" : raw || "-";
  };

  const isConverted = (lead.lead_status || "").toLowerCase().includes("convert");

  const bottomFields = [
    { label: "Country", value: lead.country },
    { label: "Account Status", value: lead.account_status || "Lead" },
    { label: "Created Date & Time", value: fmtDate(lead.created_date) },
    { label: "Assigned User", value: getAssignedUserName() },
    { label: "Conversion Owner", value: getConversionOwnerName() },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">General Information</h2>

      {/* Fields with phone editable between top and bottom */}
      <div className="space-y-3">
        {topFields.map((field) => (
          <div key={field.label} className="flex items-center gap-4">
            <Label className="text-sm text-gray-600 font-medium w-32 flex-shrink-0">{field.label}</Label>
            <p className="text-sm text-gray-900 font-medium flex-1">{field.value || "-"}</p>
          </div>
        ))}

        {bottomFields.map((field) => (
          <div key={field.label} className="flex items-center gap-4">
            <Label className="text-sm text-gray-600 font-medium w-32 flex-shrink-0">{field.label}</Label>
            <p className="text-sm text-gray-900 font-medium flex-1">
              {field.field ? getReadOnlyValue(field.field) : field.value || "-"}
            </p>
          </div>
        ))}

        {/* Deposit Amount - editable unless converted */}
        <div className="flex items-center gap-4">
          <Label className="text-sm text-gray-600 font-medium w-32 flex-shrink-0">Deposit Amount (USD)</Label>
          {isConverted ? (
            <p className="text-sm text-gray-900 font-medium flex-1">{getReadOnlyValue("deposit_amount_usd")}</p>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="number"
                value={getFieldValue("deposit_amount_usd")}
                onChange={(e) => onFieldChange("deposit_amount_usd", e.target.value)}
                onBlur={(e) => handleBlur("deposit_amount_usd", e.target.value === "" ? "" : Number(e.target.value))}
                className="text-sm flex-1"
              />
              <SaveIndicator status={saveStatus.deposit_amount_usd} />
            </div>
          )}
        </div>
      </div>

      {/* Editable fields */}
      {isEditable("account_number") &&
      <div className="border-t border-gray-200 pt-4 space-y-3">
          {/* Account Number */}
          <div className="flex items-center gap-4">
            <Label className="text-sm text-gray-600 font-medium w-32 flex-shrink-0">Account Number</Label>
            <div className="flex-1 flex items-center gap-2">
              <Input
              type="text"
              value={getFieldValue("account_number")}
              onChange={(e) => onFieldChange("account_number", e.target.value)}
              onBlur={(e) => handleBlur("account_number", e.target.value)}
              className="text-sm flex-1" />

              <SaveIndicator status={saveStatus.account_number} />
            </div>
          </div>

          {/* Server */}
          <div className="flex items-center gap-4">
            <Label className="text-sm text-gray-600 font-medium w-32 flex-shrink-0">Server</Label>
            <div className="flex-1 flex items-center gap-2">
              <Input
              type="text"
              value={getFieldValue("server")}
              onChange={(e) => onFieldChange("server", e.target.value)}
              onBlur={(e) => handleBlur("server", e.target.value)}
              className="text-sm flex-1" />
              <SaveIndicator status={saveStatus.server} />
            </div>
          </div>

          {/* Investor Password with show/hide toggle */}
          <div className="flex items-center gap-4">
            <Label className="text-sm text-gray-600 font-medium w-32 flex-shrink-0">Investor Password</Label>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                type={showPassword ? "text" : "password"}
                value={getFieldValue("investor_password")}
                onChange={(e) => onFieldChange("investor_password", e.target.value)}
                onBlur={(e) => handleBlur("investor_password", e.target.value)}
                className="text-sm pr-10" />

                <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">

                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <SaveIndicator status={saveStatus.investor_password} />
            </div>
          </div>

          {/* Client Feedback as textarea */}
          <div className="flex items-start gap-4">
            <Label className="text-sm text-gray-600 font-medium w-32 flex-shrink-0 pt-2">Client Feedback</Label>
            <div className="flex-1 flex gap-2">
              <Textarea
              rows={4}
              value={getFieldValue("client_feedback")}
              onChange={(e) => onFieldChange("client_feedback", e.target.value)}
              onBlur={(e) => handleBlur("client_feedback", e.target.value)}
              className="text-sm flex-1 resize-none" />

              <div className="pt-2">
                <SaveIndicator status={saveStatus.client_feedback} />
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}