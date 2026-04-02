import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function LeadSystemInfoSection({ lead, users, teams, changes, onFieldChange }) {
  const getFieldValue = (field) => changes[field] !== undefined ? changes[field] : (lead[field] || "");

  return (
    <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
      <div>
        <label className="text-sm font-medium text-gray-700">Created</label>
        <p className="mt-1 text-sm text-gray-600">
          {lead.created_date ? format(new Date(lead.created_date), "PPP p") : "N/A"}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Last Updated</label>
        <p className="mt-1 text-sm text-gray-600">
          {lead.updated_date ? format(new Date(lead.updated_date), "PPP p") : "N/A"}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Created By</label>
        <p className="mt-1 text-sm text-gray-600">{lead.created_by || "System"}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">ID</label>
        <p className="mt-1 text-sm font-mono text-gray-600">{lead.id}</p>
      </div>
    </div>
  );
}