import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useAuth } from '@/lib/AuthContext';
import ActionBar from "@/components/lead-profile/ActionBar.jsx";
import AccountInformationCard from "@/components/lead-profile/AccountInformationCard.jsx";
import LeadStatusCard from "@/components/lead-profile/LeadStatusCard.jsx";
import ClientStatusCard from "@/components/lead-profile/ClientStatusCard.jsx";
import NotesActivityStream from "@/components/lead-profile/NotesActivityStream.jsx";
import CallLogModal from "@/components/lead-profile/CallLogModal.jsx";
import QuickNoteCard from "@/components/lead-profile/QuickNoteCard.jsx";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { nowSLTString, toSLTString } from "@/components/utils/timezone";

export default function LeadProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const leadId = queryParams.get('id');

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [refreshActivities, setRefreshActivities] = useState(0);
  const [changes, setChanges] = useState({});
  const [nextCallerLoading, setNextCallerLoading] = useState(false);

  useEffect(() => {
    if (!user || !leadId) return;
    setLoading(true);
    setNextCallerLoading(false);
    
    // Fetch lead and users in parallel — getLead is now lightweight (no users fetch)
    Promise.all([
      base44.entities.Lead.get(leadId),
      base44.entities.User.list('-created_date', 500).catch(() => [user]),
    ]).then(([lead, allUsers]) => {
        setLead(lead || null);
        setAllUsers(allUsers.map(u => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role })));
        setChanges({});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load lead:", err);
        setLoading(false);
      });
  }, [user, leadId]);

  const handleFieldChange = (field, value) => {
    setLead((prev) => ({ ...prev, [field]: value }));
  };

  const handleCallClick = async () => {
    if (!lead?.phone) return;

    // Always initiate the call immediately
    window.location.href = `tel:${lead.phone.replace(/^\+/, '')}`;

    // Server-side handles 1-hour dedup logic
    try {
      const res = await base44.functions.invoke('handleClickToCall', { leadId });
      const data = res.data || {};
      if (data.incremented) {
        setLead(prev => ({
          ...prev,
          no_of_calls: data.no_of_calls,
          last_call_datetime: data.last_call_datetime,
          ...(data.no_answer_times !== undefined && { no_answer_times: data.no_answer_times })
        }));
      } else if (data.message) {
        toast.info(data.message);
      }
    } catch (error) {
      console.error("Failed to log call:", error);
    }
  };

  const handleShowNextCaller = async () => {
    // If current lead is Converted, reassign to umair.u before moving to next
    if (lead && lead.lead_status === 'Converted') {
      try {
        const umairUser = await base44.entities.User.filter({ email: 'umair.u@primepath-solutions.com' });
        if (umairUser?.[0]) {
          await base44.entities.Lead.update(lead.id, {
            assigned_user_id: umairUser[0].id,
            assigned_user: umairUser[0].full_name
          });
        }
      } catch (error) {
        console.error('Failed to reassign converted lead:', error);
      }
    }

    // Lock rule: if current lead is a due Priority or Follow-Up, require a call first
    if (lead) {
      const nowSLT = nowSLTString();
      const isDuePriorityOrFollowUp =
        (lead.lead_status === 'Priority' || lead.lead_status === 'Follow Up') &&
        lead.sales_follow_up_datetime &&
        lead.sales_follow_up_datetime <= nowSLT;

      if (isDuePriorityOrFollowUp) {
        const lastCallSLT = toSLTString(lead.last_call_datetime);
        const callMadeThisSession = lastCallSLT && lastCallSLT >= lead.sales_follow_up_datetime;
        if (!callMadeThisSession) {
          toast.warning(`This ${lead.lead_status} lead is due now. Please call the lead first before moving to the next.`);
          return;
        }
      }
    }

    setNextCallerLoading(true);
    try {
      const storageKey = 'nextCallerVisited';
      const existing = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
      const excludeIds = Array.from(new Set([...existing, leadId].filter(Boolean)));

      try {
        const response = await base44.functions.invoke('getNextCaller', { excludeIds });
        const { leadId: nextLeadId, reason } = response.data || {};

        if (nextLeadId) {
          sessionStorage.setItem(storageKey, JSON.stringify(excludeIds));
          if (reason) toast.info(`Next caller: ${reason} lead`);
          setNextCallerLoading(false);
          navigate(createPageUrl(`LeadProfile?id=${nextLeadId}`));
        } else {
          sessionStorage.removeItem(storageKey);
          toast.info("No more leads available in the queue.");
          setNextCallerLoading(false);
        }
      } catch (err) {
        // Fallback: Find next caller directly when backend function is unavailable
        const nowSLT = nowSLTString();
        const isAdmin = user.role === 'admin';
        const assignedFilter = isAdmin ? {} : { assigned_user_id: user.id };
        const fetchCount = Math.max(50, excludeIds.length + 20);

        const findLead = async (extraFilter, sortField) => {
          const results = await base44.entities.Lead.filter(
            { ...assignedFilter, ...extraFilter },
            sortField,
            fetchCount
          );
          return results.find(l => !excludeIds.includes(l.id)) || null;
        };

        // Priority order: Follow Up -> Priority -> Unassigned -> No Answer -> Unhandled -> Any
        let nextLead = null;
        let reason = '';

        // 1. Follow Up due leads
        nextLead = await findLead(
          { lead_status: 'Follow Up', sales_follow_up_datetime: { $lte: nowSLT } },
          'sales_follow_up_datetime'
        );
        if (nextLead) reason = 'Follow Up';

        // 2. Priority due leads
        if (!nextLead) {
          nextLead = await findLead(
            { lead_status: 'Priority', sales_follow_up_datetime: { $lte: nowSLT } },
            'sales_follow_up_datetime'
          );
          if (nextLead) reason = 'Priority';
        }

        // 3. Unassigned — only admins see all unassigned; non-admins only see their assigned unassigned leads
        if (!nextLead) {
          if (isAdmin) {
            const unassignedFetchCount = Math.max(200, excludeIds.length + 50);
            const [unassignedExplicit, unassignedNull] = await Promise.all([
              base44.entities.Lead.filter({ lead_status: 'Unassigned' }, 'created_date', unassignedFetchCount),
              base44.entities.Lead.filter({ lead_status: null }, 'created_date', unassignedFetchCount),
            ]);
            const unassignedPool = [...unassignedExplicit, ...unassignedNull]
              .filter((l, i, arr) => arr.findIndex(x => x.id === l.id) === i)
              .filter(l => !l.lead_status || l.lead_status === '' || l.lead_status === 'Unassigned')
              .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
            nextLead = unassignedPool.find(l => !excludeIds.includes(l.id)) || null;
          } else {
            const assignedUnassigned = await base44.entities.Lead.filter(
              { assigned_user_id: user.id, lead_status: 'Unassigned' },
              'created_date',
              Math.max(50, excludeIds.length + 20)
            );
            nextLead = assignedUnassigned.find(l => !excludeIds.includes(l.id)) || null;
          }
          if (nextLead) reason = 'Unassigned';
        }

        // 4. No Answer (not called today, oldest last call first)
        if (!nextLead) {
          const todayDateSLT = new Date(Date.now() + (5 * 60 + 30) * 60 * 1000).toISOString().slice(0, 10);
          const noAnswerLeads = await base44.entities.Lead.filter(
            { ...assignedFilter, lead_status: 'No Answer' },
            'last_call_datetime',
            fetchCount
          );
          const eligibleNoAnswer = noAnswerLeads.filter(l => {
            if (excludeIds.includes(l.id)) return false;
            if (l.last_call_datetime) {
              const lastCallSLT = new Date(new Date(l.last_call_datetime).getTime() + (5 * 60 + 30) * 60 * 1000);
              const lastCallDateSLT = lastCallSLT.toISOString().slice(0, 10);
              if (lastCallDateSLT === todayDateSLT) return false;
            }
            return true;
          }).sort((a, b) => {
            const aTime = a.last_call_datetime ? new Date(a.last_call_datetime).getTime() : 0;
            const bTime = b.last_call_datetime ? new Date(b.last_call_datetime).getTime() : 0;
            return aTime - bTime; // oldest first
          });
          nextLead = eligibleNoAnswer[0] || null;
          if (nextLead) reason = 'No Answer';
        }

        // 5. Unhandled (oldest last call first)
        if (!nextLead) {
          const unhandledLeads = await base44.entities.Lead.filter(
            { ...assignedFilter, lead_status: 'Unhandled' },
            'last_call_datetime',
            fetchCount
          );
          const sorted = unhandledLeads
            .filter(l => !excludeIds.includes(l.id))
            .sort((a, b) => {
              const aTime = a.last_call_datetime ? new Date(a.last_call_datetime).getTime() : 0;
              const bTime = b.last_call_datetime ? new Date(b.last_call_datetime).getTime() : 0;
              return aTime - bTime; // oldest first
            });
          nextLead = sorted[0] || null;
          if (nextLead) reason = 'Unhandled';
        }

        // 6. Any remaining lead (oldest last call first)
        if (!nextLead) {
          const allLeads = await base44.entities.Lead.filter(assignedFilter, 'last_call_datetime', fetchCount);
          const sorted = allLeads
            .filter(l => !excludeIds.includes(l.id))
            .sort((a, b) => {
              const aTime = a.last_call_datetime ? new Date(a.last_call_datetime).getTime() : 0;
              const bTime = b.last_call_datetime ? new Date(b.last_call_datetime).getTime() : 0;
              return aTime - bTime; // oldest first
            });
          nextLead = sorted[0] || null;
          if (nextLead) reason = nextLead.lead_status || 'Other';
        }

        if (nextLead) {
          sessionStorage.setItem(storageKey, JSON.stringify(excludeIds));
          if (reason) toast.info(`Next caller: ${reason} lead`);
          setNextCallerLoading(false);
          navigate(createPageUrl(`LeadProfile?id=${nextLead.id}`));
        } else {
          sessionStorage.removeItem(storageKey);
          toast.info("No more leads available in the queue.");
          setNextCallerLoading(false);
        }
      }
    } catch (error) {
      console.error("Error getting next caller:", error);
      toast.error("Failed to get next caller. Please try again.");
      setNextCallerLoading(false);
    }
  };

  const handleCallLogged = (callData) => {
    setLead((prev) => ({
      ...prev,
      lastCallDateTime: new Date().toISOString(),
      noAnswerTimes: callData.result === 'No Answer' ?
      (prev.noAnswerTimes || 0) + 1 :
      prev.noAnswerTimes
    }));
    setRefreshActivities((prev) => prev + 1);
    setShowCallLogModal(false);
  };

  // Role-based card visibility
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const canSeeLeadStatus = isAdmin || isUser;
  const canSeeClientStatus = isAdmin || isUser;

  if (authLoading || (loading && !lead)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>);

  }

  if (!lead) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Lead not found</p>
      </div>);

  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          {lead.first_name} {lead.last_name}
        </h1>
        
      </div>

      {/* Action Bar */}
      <ActionBar
        lead={lead}
        onClickToCall={handleCallClick}
        onShowNextCaller={handleShowNextCaller}
        nextCallerLoading={nextCallerLoading}
        onLogCall={() => setShowCallLogModal(true)} />


      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <AccountInformationCard
            lead={lead}
            changes={{}}
            onFieldChange={handleFieldChange}
            isAgent={!isAdmin}
            allUsers={allUsers} />
        </div>

        <div className="space-y-6">
          {canSeeLeadStatus && (
            <LeadStatusCard
              lead={lead}
              changes={{}}
              onFieldChange={handleFieldChange}
              user={user}
              isAdmin={isAdmin}
              onActivityLogged={() => setRefreshActivities(prev => prev + 1)} />
          )}
          <QuickNoteCard lead={lead} user={user} onNotePosted={() => setRefreshActivities(prev => prev + 1)} />
        </div>

        <div>
          {canSeeClientStatus && (
            <ClientStatusCard
              lead={lead}
              changes={{}}
              onFieldChange={handleFieldChange} />
          )}
        </div>
      </div>

      {/* Notes & Activity Stream */}
      <NotesActivityStream
        lead={lead}
        user={user}
        users={allUsers}
        refreshTrigger={refreshActivities}
        onActivityAdded={() => setRefreshActivities((prev) => prev + 1)} />


      {/* Call Log Modal */}
      {showCallLogModal &&
      <CallLogModal
        lead={lead}
        user={user}
        onClose={() => setShowCallLogModal(false)}
        onLogged={handleCallLogged} />

      }
    </div>);

}