import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Cleans phone to E.164 format
 */
function cleanPhone(raw) {
  if (!raw) return null;
  let phone = String(raw).trim();
  const plusIndex = phone.indexOf("+");
  if (plusIndex !== -1) {
    phone = phone.slice(plusIndex);
  } else {
    phone = phone.replace(/\D/g, "");
    if (phone.length === 10) {
      phone = "+91" + phone;
    } else {
      phone = "+" + phone;
    }
  }
  phone = "+" + phone.slice(1).replace(/\D/g, "");
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  return e164Regex.test(phone) ? phone : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Only admins can import leads' }, { status: 403 });
    }

    const { leads } = await req.json();

    // Get existing leads for duplicate checking
    const existingLeads = await base44.entities.Lead.list();
    const existingEmails = new Set(existingLeads.map(l => l.email?.toLowerCase()));
    const existingPhones = new Set(existingLeads.map(l => l.phone));

    const results = {
      valid: [],
      invalid: [],
      duplicates: [],
    };

    for (const lead of leads) {
      const errors = [];

      // Validate required fields
      if (!lead.first_name?.trim()) errors.push('Missing first name');
      if (!lead.last_name?.trim()) errors.push('Missing last name');

      // Validate phone
      const cleanedPhone = lead.phone ? cleanPhone(lead.phone) : null;
      if (lead.phone && !cleanedPhone) {
        errors.push('Invalid phone format');
      }

      // Check for duplicates
      if (lead.email && existingEmails.has(lead.email.toLowerCase())) {
        results.duplicates.push({ ...lead, reason: 'Email already exists' });
        continue;
      }
      if (cleanedPhone && existingPhones.has(cleanedPhone)) {
        results.duplicates.push({ ...lead, reason: 'Phone already exists' });
        continue;
      }

      if (errors.length > 0) {
        results.invalid.push({ ...lead, errors });
      } else {
        results.valid.push({ ...lead, phone: cleanedPhone });
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});