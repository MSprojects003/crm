import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AlertTriangle, CheckCircle, Clock, CalendarDays } from "lucide-react";
import useAuth from "@/components/auth/useAuth";
import ReminderCard from "@/components/reminders/ReminderCard";
import LiveCallScreen from "@/components/call/LiveCallScreen";
import DispositionModal from "@/components/call/DispositionModal";
import { formatDistanceToNow } from "date-fns";
import { nowSLTString } from "@/components/utils/timezone";

export default function Reminders() {
  const { user, isAdmin } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [disposition, setDisposition] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchWithRetry = async (attempt = 1) => {
      try {
        const usersPromise = isAdmin
          ? base44.entities.User.list().catch(() => [])
          : Promise.resolve([]);

        const [response, leadsResponse, settingsData, userData] = await Promise.all([
          base44.functions.invoke('getRemindersByRole', {}),
          base44.functions.invoke('getLeadsByRole', {}),
          base44.entities.AppSettings.filter({ key: "missed_reminder_email" }),
          usersPromise,
        ]);
        
        setReminders(response.data.reminders || []);
        setLeads(leadsResponse.data?.leads || []);
        setSettings(settingsData);
        setUsers(userData.length ? userData : [user]);
        setLoading(false);
      } catch (err) {
        // Fallback to direct entity queries if backend functions fail
        if (err.response?.status === 500 && attempt === 1) {
          try {
            const usersPromise = isAdmin ? base44.entities.User.list().catch(() => []) : Promise.resolve([]);
            const [settingsData, userData] = await Promise.all([
              base44.entities.AppSettings.filter({ key: "missed_reminder_email" }),
              usersPromise,
            ]);
            
            let rems = [], lds = [];
            if (isAdmin) {
              [rems, lds] = await Promise.all([
                base44.entities.Reminder.list("-created_date", 10000),
                base44.entities.Lead.list("-updated_date", 10000)
              ]);
            } else {
              [rems, lds] = await Promise.all([
                base44.entities.Reminder.filter({ user_id: user.id }, "-created_date", 10000),
                base44.entities.Lead.filter({ assigned_user_id: user.id }, "-updated_date", 10000)
              ]);
            }
            
            setReminders(rems);
            setLeads(lds);
            setSettings(settingsData);
            setUsers(userData.length ? userData : [user]);
            setLoading(false);
            return;
          } catch (fallbackErr) {
            console.error("Fallback query failed:", fallbackErr);
          }
        }
        
        if (attempt < 3) {
          setTimeout(() => fetchWithRetry(attempt + 1), 1000 * attempt);
        } else {
          setLoading(false);
        }
      }
    };
    
    fetchWithRetry();
  }, [user?.id]);

  const emailFallbackEnabled = useMemo(() => {
    const s = settings.find(s => s.key === "missed_reminder_email");
    return s?.value === "true";
  }, [settings]);

  const leadsMap = useMemo(() => Object.fromEntries(leads.map(l => [l.id, l])), [leads]);
  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.id, u.full_name])), [users]);

  const myReminders = useMemo(() => {
    if (!user) return [];
    return isAdmin ? reminders : reminders.filter(r => r.user_id === user.id);
  }, [reminders, user, isAdmin]);

  // All time comparisons use Sri Lanka Time (UTC+5:30)
  const SLT_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const nowSLT = nowSLTString(); // "YYYY-MM-DDTHH:mm"
  const todaySLT = nowSLT.slice(0, 10); // "YYYY-MM-DD"

  const toSLTDay = (isoStr) => {
    if (!isoStr) return "";
    return new Date(new Date(isoStr).getTime() + SLT_OFFSET_MS).toISOString().slice(0, 10);
  };
  const toSLTNaive = (isoStr) => {
    if (!isoStr) return "";
    return new Date(new Date(isoStr).getTime() + SLT_OFFSET_MS).toISOString().slice(0, 16);
  };

  const todayList     = myReminders.filter(r => r.status === "Pending" && toSLTDay(r.due_datetime) === todaySLT);
  const overdueList   = myReminders.filter(r => r.status === "Pending" && toSLTNaive(r.due_datetime) < nowSLT && toSLTDay(r.due_datetime) !== todaySLT);
  const upcomingList  = myReminders.filter(r => r.status === "Pending" && toSLTNaive(r.due_datetime) > nowSLT && toSLTDay(r.due_datetime) !== todaySLT);
  const completedList = myReminders.filter(r => r.status === "Completed" && toSLTDay(r.updated_date || r.created_date) === todaySLT);
  const completedAll  = myReminders.filter(r => r.status === "Completed");

  // Stats
  const remindersToday = todayList.length;
  const overdueCount   = overdueList.length;
  const completedToday = completedList.length;
  const upcomingCount  = upcomingList.length;

  const handleComplete = async (reminder) => {
    await base44.entities.Reminder.update(reminder.id, { status: "Completed" });
    if (user) {
      await base44.entities.Activity.create({
        lead_id: reminder.lead_id,
        user_id: user.id,
        type: reminder.type === "SMS" ? "Note" : reminder.type,
        notes: `Reminder completed: ${reminder.type}`,
      });
    }
    setReminders(rs => rs.map(r => r.id === reminder.id ? { ...r, status: "Completed" } : r));
  };

  const handleMarkMissed = async (reminder) => {
    await base44.entities.Reminder.update(reminder.id, { status: "Missed" });
    setReminders(rs => rs.map(r => r.id === reminder.id ? { ...r, status: "Missed" } : r));

    if (emailFallbackEnabled) {
      const lead = leadsMap[reminder.lead_id];
      if (lead?.email) {
        await base44.integrations.Core.SendEmail({
          to: lead.email,
          subject: `We missed your scheduled ${reminder.type}`,
          body: `Hi ${lead.first_name},\n\nWe had a ${reminder.type} scheduled but were unable to connect. We'll reach out again soon.\n\nBest regards`,
        });
      }
    }
  };

  const handleQuickCall = (lead) => setActiveCall(lead);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading reminders...</div>;

  const sharedProps = { onComplete: handleComplete, onQuickCall: handleQuickCall, onMarkMissed: handleMarkMissed };

  const renderList = (list, emptyIcon, emptyMsg, emptyColor) => {
    if (list.length === 0) return <EmptyState icon={emptyIcon} message={emptyMsg} color={emptyColor} />;
    return list.map(r => (
      <ReminderCard
        key={r.id}
        reminder={r}
        lead={leadsMap[r.lead_id]}
        agentName={isAdmin ? usersMap[r.user_id] : undefined}
        {...sharedProps}
      />
    ));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders & Follow-ups</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your scheduled follow-ups</p>
        </div>
        {emailFallbackEnabled && (
          <Badge className="bg-purple-100 text-purple-700 border-0 gap-1 px-3 py-1">
            <Bell className="w-3.5 h-3.5" /> Email fallback ON
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Bell className="w-3 h-3" /> Today</p>
          <p className="text-2xl font-bold text-gray-900">{remindersToday}</p>
        </div>
        <div className={`border rounded-xl p-4 ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
          <p className={`text-xs mb-1 flex items-center gap-1 ${overdueCount > 0 ? "text-red-500" : "text-gray-500"}`}>
            <AlertTriangle className="w-3 h-3" /> Overdue
          </p>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-700" : "text-gray-900"}`}>{overdueCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Upcoming</p>
          <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed Today</p>
          <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="today">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="today" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Today
            {todayList.length > 0 && <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">{todayList.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue
            {overdueList.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">{overdueList.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Upcoming
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3 mt-4">
          {renderList(todayList, Bell, "No reminders for today.", "text-blue-400")}
        </TabsContent>
        <TabsContent value="overdue" className="space-y-3 mt-4">
          {renderList(overdueList, CheckCircle, "No overdue reminders!", "text-green-500")}
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {renderList(upcomingList, Clock, "No upcoming reminders.", "text-gray-400")}
        </TabsContent>
        <TabsContent value="completed" className="space-y-3 mt-4">
          {renderList(completedAll, CheckCircle, "No completed reminders yet.", "text-gray-400")}
        </TabsContent>
      </Tabs>

      {/* Live Call */}
      {activeCall && (
        <LiveCallScreen
          lead={activeCall}
          user={user}
          onEndCall={(callData) => { setDisposition({ lead: activeCall, callData }); setActiveCall(null); }}
          onClose={() => setActiveCall(null)}
        />
      )}
      {disposition && (
        <DispositionModal
          lead={disposition.lead}
          user={user}
          callData={disposition.callData}
          onDone={() => setDisposition(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message, color }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <Icon className={`w-10 h-10 ${color}`} />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}