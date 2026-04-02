import { base44 } from "@/api/base44Client";

/**
 * Get active agents (users with role "Agent")
 */
export async function getActiveAgents() {
  const users = await base44.entities.User.list();
  // Return all non-admin users (agents/users) who can be assigned leads
  return users.filter(u => u.role !== "admin");
}

/**
 * Get the last assigned agent index from AppSettings
 */
export async function getLastAssignedAgentIndex() {
  try {
    const settings = await base44.entities.AppSettings.filter({ key: "lastAssignedAgentIndex" });
    if (settings.length > 0) {
      return parseInt(settings[0].value) || 0;
    }
  } catch (err) {
    console.error("Error reading lastAssignedAgentIndex:", err);
  }
  return 0;
}

/**
 * Save the last assigned agent index to AppSettings
 */
export async function saveLastAssignedAgentIndex(index) {
  try {
    const settings = await base44.entities.AppSettings.filter({ key: "lastAssignedAgentIndex" });
    if (settings.length > 0) {
      await base44.entities.AppSettings.update(settings[0].id, { value: index.toString() });
    } else {
      await base44.entities.AppSettings.create({ key: "lastAssignedAgentIndex", value: index.toString() });
    }
  } catch (err) {
    console.error("Error saving lastAssignedAgentIndex:", err);
  }
}

/**
 * Get the next agent for round robin assignment
 * Returns { agent, nextIndex }
 */
export async function getNextAgentForRoundRobin() {
  const agents = await getActiveAgents();
  if (agents.length === 0) return null;

  let currentIndex = await getLastAssignedAgentIndex();
  
  // Ensure currentIndex is within bounds
  currentIndex = currentIndex % agents.length;
  
  const agent = agents[currentIndex];
  const nextIndex = (currentIndex + 1) % agents.length;
  
  await saveLastAssignedAgentIndex(nextIndex);
  
  return { agent, nextIndex };
}

/**
 * Assign multiple leads using round robin
 */
export async function assignLeadsRoundRobin(leadIds) {
  if (!leadIds || leadIds.length === 0) return { assigned: 0, failed: 0 };

  const agents = await getActiveAgents();
  if (agents.length === 0) {
    console.warn("No active agents available for round robin assignment");
    return { assigned: 0, failed: leadIds.length };
  }

  let currentIndex = await getLastAssignedAgentIndex();
  let assigned = 0;

  try {
    for (const leadId of leadIds) {
      const agent = agents[currentIndex % agents.length];
      await base44.entities.Lead.update(leadId, { assigned_user_id: agent.id });
      currentIndex++;
      assigned++;
    }
    
    await saveLastAssignedAgentIndex(currentIndex % agents.length);
  } catch (err) {
    console.error("Error in round robin assignment:", err);
  }

  return { assigned, failed: leadIds.length - assigned };
}