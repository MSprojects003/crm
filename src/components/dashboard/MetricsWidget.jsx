import { TrendingUp, Users, Target, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const iconMap = {
  up: TrendingUp,
  users: Users,
  target: Target,
  chart: BarChart3,
};

export default function MetricsWidget({ title, value, icon = "up", trend, unit = "" }) {
  const IconComponent = iconMap[icon];

  return (
    <Card className="p-4 border-gray-200 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        {IconComponent && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <IconComponent className="w-5 h-5 text-blue-600" />
          </div>
        )}
      </div>
    </Card>
  );
}