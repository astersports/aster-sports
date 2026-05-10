// Wave 4.0 — rsvp_nudge send pipeline. Per-recipient + per-player
// token minting, then dispatch through send-tournament-message v14.
//
// For each guardian recipient on the event's team:
//   1. Resolve which players this guardian RSVPs for (player_guardians)
//   2. For each player + each response (going/maybe/not_going), call
//      public.mint_rsvp_token RPC to get a signed token URL
//   3. Compose per-recipient body via composeRsvpNudge with rsvpLinks
//      keyed by player_id
//   4. Insert per-recipient comms_message_recipients row with
//      body_html_rendered fully tokenized
//   5. Invoke send-tournament-message v14 — pilot mode gate inherited
//
// pgcrypto + mint_rsvp_token + verify_rsvp_token RPCs ship in the
// 20260509215604_rsvp_token_infrastructure migration.

import { supabase } from './supabase';
import { compose } from './engine/composer';
import { applyUnsubscribeUrls } from './unsubscribeUrl';

const ADMIN_BCC_EMAIL = 'admin@legacyhoopers.org';
const HANDLER_BASE = 'https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/rsvp-token-handler';

function buildLinkUrl(token, action) {
  return `${HANDLER_BASE}?t=${encodeURIComponent(token)}&action=${action}`;
}

async function mintLinksForPlayer(eventId, playerId, guardianId) {
  const responses = ['going', 'maybe', 'not_going'];
  const out = {};
  for (const r of responses) {
    const { data, error } = await supabase.rpc('mint_rsvp_token', {
      p_event_id: eventId, p_player_id: playerId, p_guardian_id: guardianId, p_response: r,
    });
    if (error) throw error;
    out[r] = buildLinkUrl(data, r);
  }
  return out;
}

async function fetchEventDetails(eventId) {
  const { data } = await supabase.from('events').select('id,title,start_at,location,team_id').eq('id', eventId).maybeSingle();
  return data;
}

async function fetchPlayersForGuardianOnTeam(guardianId, teamId) {
  const { data } = await supabase.from('player_guardians')
    .select('player_id, players!inner(id, first_name, last_name, team_players!inner(team_id))')
    .eq('guardian_id', guardianId)
    .eq('players.team_players.team_id', teamId);
  return (data || []).map((row) => ({ id: row.players.id, name: row.players.first_name || '' }));
}

export async function sendRsvpNudge({ orgId, event, body, signoffMessage, coaches, recipients, pilotModeEnabled, testOnly }) {
  if (!orgId) throw new Error('Missing orgId.');
  if (!event?.id) throw new Error('Missing event.');
  const ev = (await fetchEventDetails(event.id)) || event;
  const teamId = ev.team_id;
  if (!teamId) throw new Error('Event has no team_id.');

  const audience = (recipients || []).filter((f) => (f.team_ids || []).includes(teamId));
  if (!audience.length && !testOnly) throw new Error('No families on this team.');

  const eventTimeLabel = ev.start_at ? new Date(ev.start_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  const baseData = { ...body, eventTitle: ev.title, eventTimeLabel, eventLocation: ev.location, signoff_message: signoffMessage, coaches };

  // Sample compose for message-level body (admin BCC sees a generic copy).
  const sample = compose({ kind: 'rsvp_nudge', data: { ...baseData, players: [], rsvpLinks: {} } });

  const { data: msg, error: msgErr } = await supabase.from('comms_messages').insert({
    org_id: orgId, tournament_id: null, team_id: teamId,
    kind: 'rsvp_nudge', language_code: 'en',
    delivery_method: 'queued', sent_at: null,
    subject: sample.subject, body_html: sample.html, body_plain: sample.plainText,
    headline: 'QUICK RSVP', content_sections: sample.sections,
    signoff_message: signoffMessage || null,
    anchor_kind: 'event', anchor_id: ev.id,
    audience_type: 'event_attendees',
  }).select('id').single();
  if (msgErr) throw msgErr;

  const familyRows = [];
  if (!testOnly) {
    for (const fam of audience) {
      const players = await fetchPlayersForGuardianOnTeam(fam.guardian_id, teamId);
      if (!players.length) continue;
      const rsvpLinks = {};
      for (const p of players) {
        rsvpLinks[p.id] = await mintLinksForPlayer(ev.id, p.id, fam.guardian_id);
      }
      const composed = compose({ kind: 'rsvp_nudge', data: { ...baseData, players, rsvpLinks } });
      familyRows.push({
        message_id: msg.id, guardian_id: fam.guardian_id, email_at_send: fam.email,
        delivery_method: 'resend_api', delivery_status: 'queued',
        body_html_rendered: composed.html, body_plain_rendered: composed.plainText,
        subject_rendered: composed.subject, teams_included: [teamId],
      });
    }
  }
  const adminAlreadyIncluded = familyRows.some((r) => r.email_at_send === ADMIN_BCC_EMAIL);
  const adminRow = adminAlreadyIncluded ? null : {
    message_id: msg.id, guardian_id: null, email_at_send: ADMIN_BCC_EMAIL,
    delivery_method: 'resend_api', delivery_status: 'queued',
    body_html_rendered: sample.html, body_plain_rendered: sample.plainText,
    subject_rendered: sample.subject, teams_included: [],
  };
  const allRows = [...familyRows, ...(adminRow ? [adminRow] : [])];
  const stampedRows = await applyUnsubscribeUrls(allRows);
  const { error: recErr } = await supabase.from('comms_message_recipients').insert(stampedRows);
  if (recErr) throw recErr;

  const { data: dispatch, error: dispErr } = await supabase.functions.invoke('send-tournament-message', { body: { message_id: msg.id } });
  if (dispErr) throw dispErr;
  return { messageId: msg.id, ...(dispatch || {}), audienceCount: familyRows.length, pilotModeEnabled: !!pilotModeEnabled };
}
