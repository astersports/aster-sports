// Wave 4.1b §6.G + §6.I — extracted submit pipeline so BriefingComposer
// can stay ≤150 lines while picking up audience, save-status, schedule,
// and kind-null guard concerns.
//
// Pure-ish: this module owns the multi-branch dispatch (rsvp_nudge
// per-token send vs generic compose+queue+invoke vs scheduled). Caller
// passes the wizard state + dependencies; we return a result object
// that maps to a toast message.

import { compose } from '../../lib/engine/composer';
import { sendRsvpNudge } from '../../lib/rsvpNudgeSend';
import { supabase } from '../../lib/supabase';

async function resolveTourneyUrl(state) {
  if (state.anchor_kind === 'tournament' && state.anchor_id) {
    const { data } = await supabase.from('tournaments').select('tourney_url').eq('id', state.anchor_id).maybeSingle();
    return data?.tourney_url || null;
  }
  if (state.anchor_kind === 'event' && state.anchor_id && state.kind === 'game_recap') {
    const { data } = await supabase.from('events').select('tournament_id, tournaments(tourney_url)').eq('id', state.anchor_id).maybeSingle();
    return data?.tournaments?.tourney_url || null;
  }
  return null;
}

export async function submitBriefing({ state, draft, orgId, recipients, coaches, pilotModeEnabled }) {
  if (state.kind === 'rsvp_nudge' && state.anchor_kind === 'event' && state.anchor_id) {
    const { data: ev } = await supabase.from('events').select('id,title,start_at,location,team_id').eq('id', state.anchor_id).maybeSingle();
    const r = await sendRsvpNudge({ orgId, event: ev, body: state.body, signoffMessage: state.signoff_message, coaches, recipients, pilotModeEnabled, testOnly: state.test_only });
    if (r?.error) throw r.error;
    return { audienceCount: r.audienceCount };
  }
  const tourneyUrl = await resolveTourneyUrl(state);
  const composed = compose({ kind: state.kind, data: { ...state.body, tourney_url: tourneyUrl, signoff_message: state.signoff_message, coaches } });
  const payload = {
    kind: state.kind, anchor_kind: state.anchor_kind, anchor_id: state.anchor_id,
    audience_type: state.audience_type, audience_filter: state.audience_filter,
    content_sections: { body: state.body, sections: composed.sections },
    signoff_message: state.signoff_message,
    subject: composed.subject, body_html: composed.html, body_plain: composed.plainText,
  };
  if (state.send_mode === 'scheduled' && state.scheduled_for) {
    const r = await draft.submitSchedule(payload, state.scheduled_for);
    if (r?.error) throw r.error;
    return { scheduledFor: state.scheduled_for };
  }
  const r = await draft.submitSend(payload);
  if (r?.error) throw r.error;
  const dispatchInvoke = await supabase.functions.invoke('send-tournament-message', { body: { message_id: r.id } });
  if (dispatchInvoke.error) throw dispatchInvoke.error;
  return { sent: true };
}
