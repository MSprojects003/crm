import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [activities, leads, deposits, users] = await Promise.all([
      base44.entities.Activity.list('-created_date', 100),
      base44.entities.Lead.list('-created_date', 100),
      base44.entities.Deposit.list('-deposit_date', 100),
      base44.entities.User.list().catch(() => []),
    ]);

    let dashboardLeads = leads;
    let dashboardActivities = activities;
    let dashboardDeposits = deposits;
    let dashboardUsers = users;

    // Filter based on role
    if (user.role !== 'admin') {
      dashboardLeads = leads.filter(l => l.assigned_user_id === user.id);
      dashboardActivities = activities.filter(a => a.user_id === user.id);
      
      const userLeadIds = dashboardLeads.map(l => l.id);
      dashboardDeposits = deposits.filter(d => userLeadIds.includes(d.lead_id) && d.status === 'Completed');
      dashboardUsers = [user];
    }

    // Calculate metrics
    const leadsThisWeek = dashboardLeads.filter(l => {
      const leadDate = new Date(l.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return leadDate >= weekAgo;
    }).length;

    const totalDeposits = dashboardDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    const completedDeposits = dashboardDeposits.filter(d => d.status === 'Completed').length;

    return Response.json({
      leads: dashboardLeads,
      activities: dashboardActivities,
      deposits: dashboardDeposits,
      users: dashboardUsers,
      metrics: {
        leadsThisWeek,
        totalDeposits,
        completedDeposits,
        isAdmin: user.role === 'admin',
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});