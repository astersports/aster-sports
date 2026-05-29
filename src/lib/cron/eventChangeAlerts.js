// Event change-alert pure logic (vitest source of truth).
//
// AP #30 mirror: byte-near-identical to
// supabase/functions/briefing-auto-draft-tick/_changeAlertLogic.ts (the Deno
// mirror the edge function imports). When you change one, change BOTH in the
// same commit. Logic uses only standard ES + Intl so the two stay in sync.
//
// Powers the event_notifications dispatcher (Wave 3.A #19 P0-1): the 5
// migration-027 triggers write queued event_notifications rows on event
// add/cancel/reschedule/relocate; this composes the parent-facing push +
// email for the URGENT subset (cancellation / reschedule / relocation).
// event_added / chat_mention are in_app-only and have no consumer today, so
// the dispatcher clears them without composing (see _changeAlertDispatch.ts).

const ET = 'America/New_York';

// The urgent change set = trigger p_urgent=true = channels contains "push".
// change_summary.change is the discriminator the triggers stamp.
export const URGENT_CHANGES = ['event_cancelled', 'rescheduled', 'relocated'];

export function isUrgentChange(row) {
  return URGENT_CHANGES.includes(row?.change_summary?.change);
}

// timeZone-pinned ET formatting (AP #43). Missing/invalid iso -> ''.
function fmt(iso, tz = ET) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(d);
  return `${day} · ${time}`;
}

// Compose the parent-facing alert for one urgent event_notifications row.
// Pure: same change_summary -> deeply-equal output.
export function composeChangeAlert(row, tz = ET) {
  const cs = (row && row.change_summary) || {};
  const title = cs.title || 'Your event';
  let headline;
  let line;
  if (cs.change === 'event_cancelled') {
    headline = `Cancelled: ${title}`;
    const reason = cs.reason ? ` Reason: ${cs.reason}` : '';
    const when = fmt(cs.start_at, tz);
    line = `${when ? when + ' — ' : ''}this event has been cancelled.${reason}`;
  } else if (cs.change === 'rescheduled') {
    headline = `New time: ${title}`;
    const was = fmt(cs.old_start_at, tz);
    line = `Moved to ${fmt(cs.new_start_at, tz)}${was ? ` (was ${was})` : ''}.`;
  } else if (cs.change === 'relocated') {
    headline = `New location: ${title}`;
    const was = cs.old_location ? ` (was ${cs.old_location})` : '';
    const when = fmt(cs.start_at, tz);
    line = `${when ? when + ' — ' : ''}now at ${cs.new_location || 'a new location'}${was}.`;
  } else {
    headline = `Update: ${title}`;
    line = fmt(cs.start_at, tz);
  }
  const html = alertHtml(headline, line);
  return { title: headline, pushBody: line, subject: headline, plain: `${headline}\n${line}`, html };
}

function alertHtml(headline, line) {
  const c = '#4a8fd4';
  return `<div style="max-width:480px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;border:2px solid ${c};border-radius:6px;overflow:hidden;background:#ffffff;">`
    + `<div style="background:${c};padding:14px 16px;"><span style="font-size:16px;font-weight:700;color:#ffffff;">${esc(headline)}</span></div>`
    + `<div style="padding:14px 16px;"><div style="font-size:15px;font-weight:600;color:#1a1a2e;">${esc(line)}</div></div></div>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
