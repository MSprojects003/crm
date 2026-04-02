import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, X, ChevronDown } from "lucide-react";

export const FILTER_FIELDS = [
  { key: "name",                       label: "Lead Name",               type: "text" },
  { key: "first_name",                 label: "First Name",              type: "text" },
  { key: "last_name",                  label: "Last Name",               type: "text" },
  { key: "phone",                      label: "Phone Number",            type: "text" },
  { key: "email",                      label: "Email",                   type: "text" },
  { key: "status_id",                  label: "Lead Status",             type: "status" },
  { key: "assigned_user_id",           label: "Assigned User",           type: "user" },
  { key: "source_id",                  label: "Source",                  type: "source" },
  { key: "language_id",               label: "Language",                type: "language" },
  { key: "city",                       label: "City",                    type: "text" },
  { key: "country",                    label: "Country",                 type: "text" },
  { key: "company",                    label: "Company",                 type: "text" },
  { key: "campaign_name",              label: "Campaign",                type: "text" },
  { key: "account_number",             label: "Account Number",          type: "text" },
  { key: "account_name",               label: "Account Name",            type: "text" },
  { key: "account_type",               label: "Account Type",            type: "text" },
  { key: "account_status",             label: "Account Status",          type: "text" },
  { key: "account",                    label: "Account (Client Status)", type: "text" },
  { key: "server",                     label: "Server",                  type: "text" },
  { key: "lead_status",                label: "Lead Status Label",       type: "text" },
  { key: "retention_status",           label: "Retention Status",        type: "text" },
  { key: "retention_follow_up",        label: "Retention Follow-Up",     type: "text" },
  { key: "trading_status",             label: "Trading Status",          type: "text" },
  { key: "client_potential",           label: "Client Potential",        type: "text" },
  { key: "client_deposit_potential",   label: "Deposit Potential",       type: "text" },
  { key: "client_feedback",            label: "Client Feedback",         type: "text" },
  { key: "conversion_owner",           label: "Conversion Owner",        type: "text" },
  { key: "created_date",               label: "Created Date",            type: "date" },
  { key: "updated_date",               label: "Last Modified",           type: "date" },
  { key: "sales_follow_up_datetime",   label: "Follow-Up Date",          type: "date" },
  { key: "last_call_datetime",         label: "Last Call Date",          type: "date" },
  { key: "ftd_datetime",               label: "FTD Date",                type: "date" },
  { key: "last_deposit_date",          label: "Last Deposit Date",       type: "date" },
  { key: "last_withdrawal_sl",         label: "Last Withdrawal Date (SL)",type: "date" },
  { key: "last_withdrawal_utc",        label: "Last Withdrawal Date (UTC)",type: "date" },
  { key: "no_of_calls",               label: "Call Count",              type: "number" },
  { key: "no_answer_times",           label: "No Answer Times",         type: "number" },
  { key: "dial_attempts",             label: "Dial Attempts",           type: "number" },
  { key: "deposit_amount_usd",        label: "Total Deposit (USD)",     type: "number" },
  { key: "ftd_amount",                label: "FTD Amount",              type: "number" },
  { key: "last_deposit_amount",       label: "Last Deposit Amount",     type: "number" },
  { key: "last_withdrawal_amount",    label: "Last Withdrawal Amount",  type: "number" },
  { key: "balance",                   label: "Balance",                 type: "number" },
  { key: "equity",                    label: "Equity",                  type: "number" },
];

const MULTI_CONDITIONS = [
  { value: "is_any_of",  label: "Is any of" },
  { value: "is_none_of", label: "Is none of" },
];
const TEXT_CONDITIONS = [
  { value: "contains",     label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "equals",       label: "Equals" },
  { value: "not_equals",   label: "Does not equal" },
  { value: "starts_with",  label: "Starts with" },
];
const NUMBER_CONDITIONS = [
  { value: "equals",       label: "= Equals" },
  { value: "greater_than", label: "> Greater than" },
  { value: "less_than",    label: "< Less than" },
];
const DATE_CONDITIONS = [
  { value: "after",  label: "After" },
  { value: "before", label: "Before" },
  { value: "on",     label: "On" },
];

const CONDITIONS_BY_TYPE = {
  text:     TEXT_CONDITIONS,
  number:   NUMBER_CONDITIONS,
  date:     DATE_CONDITIONS,
  status:   MULTI_CONDITIONS,
  user:     MULTI_CONDITIONS,
  source:   MULTI_CONDITIONS,
  language: MULTI_CONDITIONS,
};

function MultiCheckboxDropdown({ options, values, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectedLabels = options.filter(o => values.includes(o.value)).map(o => o.label);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 border border-input bg-background h-8 px-3 rounded-md text-sm min-w-44 text-left max-w-64"
      >
        <span className="flex-1 truncate text-gray-700">
          {selectedLabels.length === 0
            ? <span className="text-gray-400">{placeholder}</span>
            : selectedLabels.join(", ")}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-48 max-h-52 overflow-y-auto">
          {options.length === 0
            ? <p className="text-xs text-gray-400 px-3 py-2">No options</p>
            : options.map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.includes(opt.value)}
                  onChange={e => {
                    if (e.target.checked) onChange([...values, opt.value]);
                    else onChange(values.filter(v => v !== opt.value));
                  }}
                  className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
        </div>
      )}
    </div>
  );
}

const emptyRow = () => ({ id: `${Date.now()}_${Math.random()}`, field: "", condition: "", values: [] });

export default function AdvancedFilterBuilder({ statuses = [], sources = [], users = [], languages = [], isAdmin = false, onChange }) {
  const [logic, setLogic] = useState("AND");
  const [rows, setRows] = useState([emptyRow()]);

  const emit = (newLogic, newRows) => {
    onChange({
      logic: newLogic,
      rows: newRows.filter(r => r.field && r.condition && r.values.length > 0),
    });
  };

  const updateRow = (id, changes) => {
    setRows(prev => {
      const updated = prev.map(r => {
        if (r.id !== id) return r;
        const next = { ...r, ...changes };
        if (changes.field && changes.field !== r.field) { next.condition = ""; next.values = []; }
        return next;
      });
      emit(logic, updated);
      return updated;
    });
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const removeRow = (id) => {
    setRows(prev => {
      const updated = prev.filter(r => r.id !== id);
      const final = updated.length === 0 ? [emptyRow()] : updated;
      emit(logic, final);
      return final;
    });
  };

  const handleLogicChange = (val) => {
    setLogic(val);
    emit(val, rows);
  };

  const renderValueInput = (row) => {
    const fc = FILTER_FIELDS.find(f => f.key === row.field);
    if (!fc || !row.condition) return null;

    if (["status", "user", "source", "language"].includes(fc.type)) {
      const opts = fc.type === "status"
        ? statuses.map(s => ({ value: s.id, label: s.name }))
        : fc.type === "user"
        ? users.map(u => ({ value: u.id, label: u.full_name }))
        : fc.type === "language"
        ? languages.map(l => ({ value: l.id, label: l.name }))
        : sources.map(s => ({ value: s.id, label: s.name }));
      return (
        <MultiCheckboxDropdown
          options={opts}
          values={row.values}
          onChange={vals => updateRow(row.id, { values: vals })}
          placeholder="Select values..."
        />
      );
    }

    if (fc.type === "date") {
      return (
        <Input
          type="datetime-local"
          value={row.values[0] || ""}
          onChange={e => updateRow(row.id, { values: [e.target.value] })}
          className="h-8 min-w-48"
        />
      );
    }

    if (fc.type === "number") {
      return (
        <Input
          type="number"
          value={row.values[0] || ""}
          onChange={e => updateRow(row.id, { values: [e.target.value] })}
          placeholder="Value"
          className="h-8 w-28"
        />
      );
    }

    return (
      <Input
        value={row.values[0] || ""}
        onChange={e => updateRow(row.id, { values: [e.target.value] })}
        placeholder="Value"
        className="h-8 min-w-36"
      />
    );
  };

  return (
    <div className="space-y-3">
      {/* AND / OR Logic toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Match:</span>
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {["AND", "OR"].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => handleLogicChange(opt)}
              className={`px-3 py-1 text-xs font-semibold transition-colors ${
                logic === opt ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {logic === "AND" ? "All conditions must match" : "Any condition can match"}
        </span>
      </div>

      {rows.map((row, idx) => {
        const fc = FILTER_FIELDS.find(f => f.key === row.field);
        const conditions = fc ? (CONDITIONS_BY_TYPE[fc.type] || []) : [];

        return (
          <div key={row.id} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-blue-500 w-8 text-right shrink-0">
              {idx === 0 ? "IF" : logic}
            </span>

            <Select value={row.field} onValueChange={v => updateRow(row.id, { field: v })}>
              <SelectTrigger className="h-8 min-w-44">
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {FILTER_FIELDS.filter(f => isAdmin || f.key !== "assigned_user_id").map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {row.field && (
              <Select value={row.condition} onValueChange={v => updateRow(row.id, { condition: v })}>
                <SelectTrigger className="h-8 min-w-36">
                  <SelectValue placeholder="Condition..." />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {renderValueInput(row)}

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeRow(row.id)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      })}

      <Button type="button" size="sm" variant="outline" onClick={addRow} className="h-7 gap-1 text-xs">
        <Plus className="w-3 h-3" /> Add Condition
      </Button>
    </div>
  );
}