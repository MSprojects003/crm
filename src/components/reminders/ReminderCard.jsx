import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Phone, Mail, MessageSquare, AlertTriangle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fmtSLT } from "@/components/utils/timezone";

const TYPE_ICONS = { Call: Phone, Email: Mail, SMS: MessageSquare };
const TYPE_COLORS = {
  Call: "bg-blue-100 text-blue-700",
  Email: "bg-purple-100 text-purple-700",
  SMS: "bg-green-100 text-green-700",
};

function useCountdown(due) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const dueDaySLT = toSLTDay(due.toISOString());
    const todaySLT = nowSLTDay();
    if (dueDaySLT !== todaySLT) return;
    const update = () => {
      const diff = due - new Date();
      if (diff <= 0) { setTimeLeft("Due now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [due]);

  return timeLeft;
}

const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const toSLTDay = (isoStr) => new Date(new Date(isoStr).getTime() + SLT_OFFSET_MS).toISOString().slice(0, 10);
const toSLTNaive = (isoStr) => new Date(new Date(isoStr).getTime() + SLT_OFFSET_MS).toISOString().slice(0, 16);
const nowSLTDay = () => new Date(Date.now() + SLT_OFFSET_MS).toISOString().slice(0, 10);
const nowSLTNaive = () => new Date(Date.now() + SLT_OFFSET_MS).toISOString().slice(0, 16);

export default function ReminderCard({ reminder, lead, agentName, onComplete, onQuickCall, onMarkMissed }) {
  const due = new Date(reminder.due_datetime);
  const dueDaySLT = toSLTDay(reminder.due_datetime);
  const isDueToday = dueDaySLT === nowSLTDay();
  const overdue = reminder.status === "Pending" && toSLTNaive(reminder.due_datetime) < nowSLTNaive() && !isDueToday;
  const Icon = TYPE_ICONS[reminder.type] || Clock;
  const countdown = useCountdown(due);

  return (
    <div className={`bg-white rounded-xl border p-4 transition-all
      ${overdue ? "border-red-300 bg-red-50/50" : "border-gray-200 hover:border-gray-300"}`}>

      <div className="flex items-start gap-4">
        {/* Type icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
          ${TYPE_COLORS[reminder.type] || "bg-gray-100 text-gray-600"}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name + Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm">
              {lead ? `${lead.first_name} ${lead.last_name}` : "Unknown Lead"}
            </span>
            <Badge className={`${TYPE_COLORS[reminder.type]} border-0 text-xs`}>{reminder.type}</Badge>
            {overdue && (
              <Badge className="bg-red-100 text-red-700 border-0 text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </Badge>
            )}
            {reminder.status === "Completed" && (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Completed
              </Badge>
            )}
            {reminder.status === "Missed" && (
              <Badge className="bg-gray-200 text-gray-500 border-0 text-xs">Missed</Badge>
            )}
          </div>

          {/* Row 2: Phone + Agent + Due + Countdown */}
          <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-gray-500">
            {lead?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {lead.phone}
              </span>
            )}
            {agentName && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {agentName}
              </span>
            )}
            <span className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : ""}`}>
              <Clock className="w-3 h-3" />
              {fmtSLT(reminder.due_datetime)}
              {!overdue && !isDueToday && (
                <span className="ml-1 text-gray-400">({formatDistanceToNow(due, { addSuffix: true })})</span>
              )}
            </span>
            {isDueToday && reminder.status === "Pending" && countdown && (
              <span className="flex items-center gap-1 text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> {countdown}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {reminder.status === "Pending" && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {reminder.type === "Call" && lead && (
              <Button size="sm" variant="outline" className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50" onClick={() => onQuickCall?.(lead)}>
                <Phone className="w-3.5 h-3.5 mr-1" /> Call
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs text-blue-700 border-blue-300 hover:bg-blue-50" onClick={() => onComplete(reminder)}>
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
            </Button>
            {overdue && (
              <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:bg-red-50" onClick={() => onMarkMissed?.(reminder)}>
                Mark Missed
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}