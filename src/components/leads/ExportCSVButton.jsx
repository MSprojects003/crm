import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXPORT_FIELDS = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "company", label: "Company" },
  { key: "lead_status", label: "Lead Status" },
  { key: "source", label: "Source" },
  { key: "campaign_name", label: "Campaign Name" },
  { key: "assigned_user", label: "Assigned User" },
  { key: "conversion_owner", label: "Conversion Owner" },
  { key: "account_status", label: "Account Status" },
  { key: "account_number", label: "Account Number" },
  { key: "account_name", label: "Account Name" },
  { key: "account_type", label: "Account Type" },
  { key: "server", label: "Server" },
  { key: "balance", label: "Balance" },
  { key: "equity", label: "Equity" },
  { key: "deposit_amount_usd", label: "Deposit Amount (USD)" },
  { key: "ftd_amount", label: "FTD Amount" },
  { key: "ftd_datetime", label: "FTD Date" },
  { key: "last_deposit_date", label: "Last Deposit Date" },
  { key: "last_deposit_amount", label: "Last Deposit Amount" },
  { key: "trading_status", label: "Trading Status" },
  { key: "retention_status", label: "Retention Status" },
  { key: "client_potential", label: "Client Potential" },
  { key: "sales_follow_up_datetime", label: "Sales Follow Up" },
  { key: "no_of_calls", label: "No Of Calls" },
  { key: "dial_attempts", label: "Dial Attempts" },
  { key: "notes", label: "Notes" },
  { key: "client_feedback", label: "Client Feedback" },
  { key: "created_date", label: "Created Date" },
];

function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportCSVButton({ selectedIds, allFilteredLeads, leads }) {
  const handleExport = () => {
    // Export selected leads if any, otherwise all filtered leads
    const toExport = selectedIds.length > 0
      ? leads.filter(l => selectedIds.includes(l.id))
      : allFilteredLeads;

    if (toExport.length === 0) return;

    const header = EXPORT_FIELDS.map(f => f.label).join(",");
    const rows = toExport.map(lead =>
      EXPORT_FIELDS.map(f => escapeCsv(lead[f.key])).join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      className="h-9 gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
    >
      <Download className="w-4 h-4" /> Export CSV
    </Button>
  );
}