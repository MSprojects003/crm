import { Badge } from "@/components/ui/badge";
import { fmtSLT } from "@/components/utils/timezone";
import { FileText, Phone, AlertCircle } from "lucide-react";

const TYPE_ICONS = {
  Note: FileText,
  Activity: Phone,
  Update: AlertCircle,
};

const TYPE_COLORS = {
  Note: "bg-blue-100 text-blue-800",
  Activity: "bg-purple-100 text-purple-800",
  Update: "bg-orange-100 text-orange-800",
};

export default function StreamEntry({ entry }) {
  const Icon = TYPE_ICONS[entry.type] || FileText;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className={`p-2 rounded-lg h-fit ${TYPE_COLORS[entry.type] || "bg-gray-100"}`}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{entry.user_name}</span>
            <Badge variant="outline" className="text-xs">{entry.type}</Badge>
          </div>

          <p className="text-sm text-gray-700 mb-2">{entry.content}</p>

          {entry.details?.status && entry.type === "Activity" && (
            <p className="text-xs text-gray-500 mb-1">Status: {entry.details.status}</p>
          )}

          <p className="text-xs text-gray-500">
            {fmtSLT(entry.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}