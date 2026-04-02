import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { fmtSLT } from "@/components/utils/timezone";

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = () => {
    if (!user?.id) return;
    base44.entities.LeadNotification
      .filter({ user_id: user.id }, "-created_date", 40)
      .then(setNotifications)
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (notif) => {
    if (!notif.is_read) {
      await base44.entities.LeadNotification.update(notif.id, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    setOpen(false);
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.LeadNotification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const formatDt = (dt) => {
    if (!dt) return "";
    return fmtSLT(dt) || "";
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">
              Notifications
              {unreadCount > 0 && <span className="ml-1 text-blue-600">({unreadCount} new)</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No notifications yet</p>
            ) : notifications.map(notif => (
              <Link
                key={notif.id}
                to={`/LeadProfile?id=${notif.lead_id}`}
                onClick={() => markRead(notif)}
                className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.is_read ? "bg-blue-50" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.is_read ? "bg-blue-500" : "bg-gray-200"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{notif.lead_name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                      notif.type === "Priority" ? "bg-red-100 text-red-700" :
                      notif.type === "Mention" ? "bg-blue-100 text-blue-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {notif.type === "Priority" ? "Priority" : notif.type === "Mention" ? "Mentioned" : "Follow Up"}
                    </span>
                  </div>
                  {notif.type === "Mention" ? (
                    <p className="text-xs text-gray-600 mt-0.5">{notif.message || `${notif.mentioned_by} mentioned you`}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-0.5">{notif.lead_phone}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDt(notif.scheduled_datetime || notif.created_date)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}