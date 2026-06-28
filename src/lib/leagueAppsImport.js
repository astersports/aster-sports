import { supabase } from './supabase';
import { normalizeMethod, parseDollars } from './leagueAppsImportHelpers';

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
    const email = (r.Parent_1_Email || r.parentEmail || r.parent_email || r.email || '').trim().toLowerCase();
    const phone = (r.Parent_1_Mobile_Number || r.parentPhone || r.parent_phone || r.phone || '').trim();
    const firstName = r.Parent_1_First_Name || r.parentFirstName || r.parent_first_name || '';
    const lastName = r.Parent_1_Last_Name || r.parentLastName || r.parent_last_name || '';
    const key = email || phone || `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!key) continue;

    if (!families.has(key)) {
      families.set(key, {
        firstName, lastName, email, phone,
        dedupKey: email ? 'email' : phone ? 'phone' : 'name',
        players: [],
        totalFeeCents: 0,
        totalPaidCents: 0,
        totalFeesDeducted: 0,
        payments: [],
      });
    }
    const fam = families.get(key);
    const feeCents = parseDollars(r.registrationFee || r.registration_fee || r.fee || r.amount || r.Amount || 0);
    const paidCents = parseDollars(r.amountPaid || r.amount_paid || r.paid || r.Amount_Paid || 0);
    const feeDeducted = parseDollars(r.processingFee || r.processing_fee || r.LeagueApps_Fee || 0);

    fam.players.push({
      firstName: r.Member_First_Name || r.firstName || r.first_name || r.playerFirstName || '',
      lastName: r.Member_Last_Name || r.lastName || r.last_name || r.playerLastName || '',
      program: r.Program || r.programName || r.program_name || r.program || '',
    });
    fam.totalFeeCents += feeCents;
    fam.totalPaidCents += paidCents;
    fam.totalFeesDeducted += feeDeducted;

    if (paidCents > 0) {
      fam.payments.push({
        amountCents: paidCents,
        processingFeeCents: feeDeducted,
        method: normalizeMethod(r.Payment_Method || r.paymentMethod || r.payment_method || ''),
        date: r.Invoice_Date || r.paymentDate || r.payment_date || r.registrationDate || null,
        reference: r.Invoice_Number || r.transactionId || r.transaction_id || '',
      });
    }
  }
  return Array.from(families.values());
}

export async function importToFinancials(families, orgId, seasonId, userId) {
  const results = { created: 0, skipped: 0, errors: [] };

  // AP #36: a swallowed error here empties the dedup maps below, so EVERY
  // family re-inserts on a re-run — duplicate guardians + re-posted fee/payment
  // transactions (money path). Fail the import instead of deduping against [].
  const { data: guardians, error: guardiansErr } = await supabase
    .from('guardians')
    .select('id, first_name, last_name, email, phone')
    .eq('org_id', orgId);
  if (guardiansErr) throw new Error(`Could not load existing guardians for de-duplication: ${guardiansErr.message}`);

  const byEmail = new Map();
  const byPhone = new Map();
  const byName = new Map();
  (guardians || []).forEach((g) => {
    if (g.email) byEmail.set(g.email.trim().toLowerCase(), g.id);
    if (g.phone) byPhone.set(g.phone.replace(/\D/g, ''), g.id);
    byName.set(`${g.first_name} ${g.last_name}`.trim().replace(/\s+/g, ' ').toLowerCase(), g.id);
  });

  for (const fam of families) {
    let guardianId = null;
    if (fam.email) guardianId = byEmail.get(fam.email);
    if (!guardianId && fam.phone) guardianId = byPhone.get(fam.phone.replace(/\D/g, ''));
    if (!guardianId) guardianId = byName.get(`${fam.firstName} ${fam.lastName}`.trim().replace(/\s+/g, ' ').toLowerCase());

    if (!guardianId) {
      const { data: newG, error: gErr } = await supabase
        .from('guardians')
        .insert({ org_id: orgId, first_name: fam.firstName, last_name: fam.lastName, email: fam.email || null, phone: fam.phone || null })
        .select('id')
        .single();
      if (gErr) { results.errors.push(`Guardian ${fam.firstName} ${fam.lastName}: ${gErr.message}`); results.skipped++; continue; }
      guardianId = newG.id;
    }

    const { data: acct, error: aErr } = await supabase
      .from('financial_accounts')
      .upsert({
        org_id: orgId, guardian_id: guardianId, season_id: seasonId,
        season_fee_cents: 0, discount_cents: 0, // unified model: fee is a 'fee' txn (billed=SUM('fee'))
      }, { onConflict: 'org_id,guardian_id,season_id' })
      .select('id')
      .single();

    if (aErr) { results.errors.push(`Account for ${fam.firstName} ${fam.lastName}: ${aErr.message}`); results.skipped++; continue; }

    // Post the season fee as a 'fee' txn (view bills from 'fee'); guard re-runs.
    if (fam.totalFeeCents > 0) {
      const { data: hasFee, error: hErr } = await supabase.from('financial_transactions')
        .select('id').eq('account_id', acct.id).eq('transaction_type', 'fee').limit(1).maybeSingle();
      if (hErr) results.errors.push(`Fee check ${fam.firstName}: ${hErr.message}`);
      else if (!hasFee) {
        const { error: fErr } = await supabase.from('financial_transactions').insert({ account_id: acct.id, org_id: orgId, transaction_type: 'fee', amount_cents: fam.totalFeeCents, occurred_at: new Date().toISOString(), recorded_by: userId });
        if (fErr) results.errors.push(`Fee ${fam.firstName}: ${fErr.message}`);
      }
    }

    for (const pmt of fam.payments) {
      const pmtDate = pmt.date ? new Date(pmt.date) : null;
      const { error: tErr } = await supabase
        .from('financial_transactions')
        .insert({
          account_id: acct.id,
          org_id: orgId,
          transaction_type: 'payment',
          amount_cents: pmt.amountCents,
          processing_fee_cents: pmt.processingFeeCents || 0,
          payment_method: pmt.method,
          reference: pmt.reference || null,
          occurred_at: pmtDate && !isNaN(pmtDate.getTime()) ? pmtDate.toISOString() : new Date().toISOString(),
          recorded_by: userId,
        });
      if (tErr) results.errors.push(`Payment for ${fam.firstName}: ${tErr.message}`);
    }
    results.created++;
  }
  return results;
}
