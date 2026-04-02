import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Clock, Phone, Mail, MessageSquare, Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { fmtSLT } from "@/components/utils/timezone";

const REMINDER_ICONS = { Call: Phone, Email: Mail, SMS: MessageSquare };

export default function ReminderNotificationPopup({ user }) {
  const [notifications, setNotifications] = useState([]);
  const seenReminderIds   = useRef(new Set());
  const seenLeadNotifIds  = useRef(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const check = async () => {
      try {
        const now = new Date();

        // ── 1. Reminder-based (existing) ──────────────────────────────────
        const reminders = await base44.entities.Reminder.filter({ user_id: user.id, status: "Pending" });
        const dueReminders = reminders.filter(r => {
          if (seenReminderIds.current.has(r.id)) return false;
          const dueAt   = new Date(r.due_datetime);
          const notifyAt = new Date(dueAt.getTime() - (r.reminder_before_minutes ?? 15) * 60000);
          return now >= notifyAt && now <= dueAt;
        });

        // Fetch lead info for due reminders
        let leadsMap = {};
        const rLeadIds = [...new Set(dueReminders.map(r => r.lead_id).filter(Boolean))];
        if (rLeadIds.length > 0) {
          const rLeads = await Promise.all(rLeadIds.map(id => base44.entities.Lead.get(id).catch(() => null)));
          rLeads.filter(Boolean).forEach(l => { leadsMap[l.id] = l; });
        }

        // ── 2. LeadNotification-based (follow-up / priority) ───────────────
        const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const leadNotifs  = await base44.entities.LeadNotification.filter({ user_id: user.id, is_read: false });
        const recentNotifs = leadNotifs.filter(n => {
          if (seenLeadNotifIds.current.has(n.id)) return false;
          return new Date(n.created_date) > fiveMinsAgo;
        });

        // Build popup items
        const newItems = [];

        dueReminders.forEach(r => {
          seenReminderIds.current.add(r.id);
          newItems.push({ id: `r_${r.id}`, kind: "reminder", type: r.type, lead: leadsMap[r.lead_id], due_datetime: r.due_datetime, lead_id: r.lead_id });
        });

        recentNotifs.forEach(n => {
          seenLeadNotifIds.current.add(n.id);
          newItems.push({ id: `ln_${n.id}`, kind: "followup", type: n.type, lead_name: n.lead_name, lead_phone: n.lead_phone, lead_status: n.lead_status, due_datetime: n.scheduled_datetime, lead_id: n.lead_id, notif_id: n.id });
        });

        if (newItems.length > 0) {
          setNotifications(prev => [...prev, ...newItems]);
        }
      } catch (_e) {
        // Network error — silently ignore and retry on next interval
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const dismiss = async (item) => {
    if (item.kind === "followup" && item.notif_id) {
      await base44.entities.LeadNotification.update(item.notif_id, { is_read: true }).catch(() => {});
    }
    setNotifications(n => n.filter(x => x.id !== item.id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map(notif => {
          const isFollowUp = notif.kind === "followup";
          const Icon = isFollowUp ? Calendar : (REMINDER_ICONS[notif.type] || Clock);

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60 }}
              className={`bg-white border rounded-xl shadow-lg p-4 flex items-start gap-3 pointer-events-auto ${
                isFollowUp ? "border-orange-200" : "border-blue-200"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isFollowUp ? "bg-orange-100" : "bg-blue-100"
              }`}>
                <Icon className={`w-4 h-4 ${isFollowUp ? "text-orange-600" : "text-blue-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {isFollowUp ? `${notif.lead_status} Reminder` : `${notif.type} Reminder`}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isFollowUp
                    ? `${notif.lead_name} · ${notif.lead_phone || ""}`
                    : notif.lead ? `${notif.lead.first_name} ${notif.lead.last_name} · ${notif.lead.phone || ""}` : ""}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {notif.due_datetime ? fmtSLT(notif.due_datetime) : ""}
                </p>
                {notif.lead_id && (
                  <Link
                    to={`/LeadProfile?id=${notif.lead_id}`}
                    onClick={() => dismiss(notif)}
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Open Lead →
                  </Link>
                )}
              </div>
              <button onClick={() => dismiss(notif)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}