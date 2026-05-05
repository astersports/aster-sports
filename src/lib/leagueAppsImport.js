import { supabase } from './supabase';

export function parseLeagueAppsData(raw) {
  let records;
  try {
    records = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new Error('Invalid JSON — paste the LeagueApps export array.');
  }
  if (!Array.isArray(records)) throw new Error('Expected a JSON array of registrations.');

  const families = new Map();
  for (const r of records) {
    const guardianName = (r.parentFirstName || r.parent_first_name || '')
      + ' ' + (r.parentLastName || r.parent_last_name || '');
    const key = guardianName.trim().toLowerCase();
    if (!key) continue;

    if (!families.has(key)) {
      families.set(key, {
        firstName: r.parentFirstName || r.parent_first_name || '',
        lastName: r.parentLastName || r.parent_last_name || '',
        email: r.parentEmail || r.parent_email || r.email || '',
        phone: r.parentPhone || r.parent_phone || r.phone || '',
        players: [],
        totalFeeCents: 0,
        totalPaidCents: 0,
        payments: [],
      });
    }
    const fam = families.get(key);
    const feeCents = parseDollars(r.registrationFee || r.registration_fee || r.fee || r.amount || 0);
    const paidCents = parseDollars(r.amountPaid || r.amount_paid || r.paid || 0);

    fam.players.push({
      firstName: r.firstName || r.first_name || r.playerFirstName || '',
      lastName: r.lastName || r.last_name || r.playerLastName || '',
      program: r.programName || r.program_name || r.program || '',
    });
    fam.totalFeeCents += feeCents;
    fam.totalPaidCents += paidCents;

    if (paidCents > 0) {
      fam.payments.push({
        amountCents: paidCents,
        method: normalizeMethod(r.paymentMethod || r.payment_method || ''),
        date: r.paymentDate || r.payment_date || r.registrationDate || r.registration_date || null,
        reference: r.transactionId || r.transaction_id || r.confirmationNumber || '',
      });
    }
  }
  return Array.from(families.values());
}

function parseDollars(val) {
  if (typeof val === 'number') return Math.round(val * 100);
  const cleaned = String(val).replace(/[$,]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function normalizeMethod(m) {
  const lower = (m || '').toLowerCase();
  if (lower.includes('zelle')) return 'zelle';
  if (lower.includes('venmo')) return 'venmo';
  if (lower.includes('cash')) return 'cash';
  if (lower.includes('check')) return 'check';
  if (lower.includes('stripe') || lower.includes('card') || lower.includes('credit')) return 'stripe';
  return 'other';
}

export async function importToFinancials(families, orgId, seasonId, userId) {
  const results = { created: 0, skipped: 0, errors: [] };

  const { data: guardians } = await supabase
    .from('guardians')
    .select('id, first_name, last_name')
    .eq('org_id', orgId);

  const guardianMap = new Map();
  (guardians || []).forEach((g) => {
    guardianMap.set(`${g.first_name} ${g.last_name}`.toLowerCase(), g.id);
  });

  for (const fam of families) {
    const nameKey = `${fam.firstName} ${fam.lastName}`.toLowerCase();
    let guardianId = guardianMap.get(nameKey);

    if (!guardianId) {
      const { data: newG, error: gErr } = await supabase
        .from('guardians')
        .insert({ org_id: orgId, first_name: fam.firstName, last_name: fam.lastName, email: fam.email, phone: fam.phone })
        .select('id')
        .single();
      if (gErr) { results.errors.push(`Guardian ${fam.firstName} ${fam.lastName}: ${gErr.message}`); results.skipped++; continue; }
      guardianId = newG.id;
    }

    const { data: acct, error: aErr } = await supabase
      .from('financial_accounts')
      .upsert({
        org_id: orgId,
        guardian_id: guardianId,
        season_id: seasonId,
        season_fee_cents: fam.totalFeeCents,
        discount_cents: 0,
      }, { onConflict: 'org_id,guardian_id,season_id' })
      .select('id')
      .single();

    if (aErr) { results.errors.push(`Account for ${fam.firstName} ${fam.lastName}: ${aErr.message}`); results.skipped++; continue; }

    for (const pmt of fam.payments) {
      const { error: tErr } = await supabase
        .from('financial_transactions')
        .insert({
          account_id: acct.id,
          org_id: orgId,
          transaction_type: 'payment',
          amount_cents: pmt.amountCents,
          payment_method: pmt.method,
          reference: pmt.reference || null,
          occurred_at: pmt.date ? new Date(pmt.date).toISOString() : new Date().toISOString(),
          recorded_by: userId,
        });
      if (tErr) results.errors.push(`Payment for ${fam.firstName}: ${tErr.message}`);
    }
    results.created++;
  }
  return results;
}
