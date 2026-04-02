import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtSLT } from "@/components/utils/timezone";
import { Trash2, Phone, Mail, FileText, CheckCircle } from "lucide-react";

const TYPE_ICONS = {
  Call: Phone,
  Email: Mail,
  "Status Change": CheckCircle,
  Note: FileText,
};

const TYPE_COLORS = {
  Call: "bg-blue-100 text-blue-800",
  Email: "bg-purple-100 text-purple-800",
  "Status Change": "bg-green-100 text-green-800",
  Note: "bg-yellow-100 text-yellow-800",
};

export default function ActivityCard({ activity, onDelete }) {
  const Icon = TYPE_ICONS[activity.type] || FileText;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${TYPE_COLORS[activity.type] || "bg-gray-100"}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{activity.type}</span>
              <Badge variant="outline" className="text-xs">{activity.status || "Pending"}</Badge>
            </div>
            {activity.duration && (
              <p className="text-sm text-gray-600">Duration: {activity.duration} seconds</p>
            )}
            {activity.notes && (
              <p className="text-sm text-gray-700 mt-2">{activity.notes}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {fmtSLT(activity.created_date)}
            </p>
          </div>
        </div>
        <Button onClick={onDelete} variant="ghost" size="icon" className="text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}