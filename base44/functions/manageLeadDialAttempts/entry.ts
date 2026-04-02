import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Missing leadId' }, { status: 400 });
    }

    // Get the lead
    const lead = await base44.entities.Lead.list('-updated_date', 1, { id: leadId });
    if (!lead || lead.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const currentLead = lead[0];
    const currentAgent = currentLead.assigned_user_id;

    // Get app settings
    const settings = await base44.asServiceRole.entities.AppSettings.list('-updated_date', 1);
    const config = settings && settings.length > 0 ? settings[0] : {};
    const maxPerAgent = config.max_dial_attempts_per_agent || 3;
    const maxGlobal = config.max_global_dial_attempts || 6;

    // Update dial attempts
    const newDialAttempts = (currentLead.dial_attempts || 0) + 1;

    // Update agent dial history
    let agentHistory = currentLead.agent_dial_history || [];
    const agentRecord = agentHistory.find(a => a.agent_id === currentAgent);
    if (agentRecord) {
      agentRecord.dial_count += 1;
    } else {
      agentHistory.push({ agent_id: currentAgent, dial_count: 1 });
    }

    // Check if we should reassign or unassign
    let newAssignedUserId = currentAgent;
    let action = 'none';

    // If current agent exceeded max attempts, find another agent
    if (agentRecord && agentRecord.dial_count >= maxPerAgent) {
      // Check if global limit reached
      if (newDialAttempts >= maxGlobal) {
        // Unassign the lead
        newAssignedUserId = null;
        action = 'unassigned';
      } else {
        // Find another agent who hasn't reached their limit for this lead
        const users = await base44.asServiceRole.entities.User.list();
        const availableAgent = users.find(u => {
          if (u.id === currentAgent || u.role !== 'user') return false;
          const agentHist = agentHistory.find(a => a.agent_id === u.id);
          return !agentHist || agentHist.dial_count < maxPerAgent;
        });

        if (availableAgent) {
          newAssignedUserId = availableAgent.id;
          action = 'reassigned';
        } else {
          // No available agents, unassign
          newAssignedUserId = null;
          action = 'unassigned';
        }
      }
    }

    // Update the lead
    await base44.asServiceRole.entities.Lead.update(leadId, {
      dial_attempts: newDialAttempts,
      agent_dial_history: agentHistory,
      assigned_user_id: newAssignedUserId
    });

    // Log dial attempt activity
    await base44.asServiceRole.entities.Activity.create({
      lead_id: leadId,
      user_id: currentAgent,
      type: 'DialAttempt',
      notes: `Dial attempt #${newDialAttempts}`
    });

    // Log reassignment if it happened
    if (action === 'reassigned') {
      await base44.asServiceRole.entities.Activity.create({
        lead_id: leadId,
        user_id: currentAgent,
        type: 'LeadReassigned',
        notes: `Lead reassigned due to dial attempt limit`,
        previous_value: currentAgent,
        new_value: newAssignedUserId
      });
    } else if (action === 'unassigned') {
      await base44.asServiceRole.entities.Activity.create({
        lead_id: leadId,
        user_id: currentAgent,
        type: 'LeadReassigned',
        notes: `Lead unassigned - reached maximum dial attempts limit`,
        previous_value: currentAgent,
        new_value: null
      });
    }

    return Response.json({
      success: true,
      action,
      dialAttempts: newDialAttempts,
      newAgent: newAssignedUserId,
      previousAgent: currentAgent
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});