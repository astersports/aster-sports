// Wave 4.8 6c Session 1 — extracted from _handlers.ts so _handlers.ts
// stays under the 150 LOC cap (CLAUDE.md anti-pattern #11). Houses the
// 3 utilities shared across the 5 trigger handlers: types, draftExists
// idempotency probe, placeholderDraft row builder, tryInsert helper.
//
// placeholderDraft signature changed in PR #118 to accept expiresAt
// (Date) — the auto-draft tick stamps comms_messages.expires_at on
// every INSERT now so the queue auto-expires per kind window. The
// expires_at column lands via migration 20260512162843; backfill on
// existing drafts is in that same migration.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface Trigger {
  id: string;
  org_id: string;
  trigger_event: string;
  lead_time_hours: number | null;
}

export type HandlerResult = {
  trigger_id: string;
  org_id: string;
  kind: string;
  anchor_id?: string;
  created?: boolean;
  skipped?: string;
  error?: string;
};

export async function draftExists(
  sb: SupabaseClient, orgId: string, kind: string, anchorId: string,
): Promise<boolean> {
  // PR-A (G-23): 'archived' MUST be in this list. The idempotency key is
  // "has a proposal EVER been created for this anchor", not "is a live one
  // open". Without 'archived', the loop ran away: a game whose start_at is
  // >14d before its score is published gets a game_recap whose expires_at
  // (start_at + 14d, _helpers.ts) is already in the past -> the expire sweep
  // archives it on the next tick -> draftExists no longer saw it -> the
  // handler re-created it -> archived again, every minute for ~7d (the
  // published_at re-query window). Counting 'archived' makes it one-and-done.
  const { data, error } = await sb.from("comms_messages").select("id")
    .eq("org_id", orgId).eq("kind", kind).eq("anchor_id", anchorId)
    .in("status", ["draft", "scheduled", "queued", "sent", "archived"]).limit(1);
  if (error) throw new Error(`draftExists check failed: ${error.message}`);
  return !!data && data.length > 0;
}

export function placeholderDraft(
  trigger: Trigger, kind: string, anchorKind: string, anchorId: string,
  teamId: string | null, audienceType: string, expiresAt: Date, now: Date,
) {
  // body_html + body_plain are NOT NULL on comms_messages with no
  // default — empty strings are placeholders until admin previews via
  // the resolver-driven path (wave-4.2-A-8a). content_sections gets
  // [] to satisfy its NOT NULL constraint (default is '[]'::jsonb).
  // expires_at threads through from the caller's kind window (PR #118).
  return {
    org_id: trigger.org_id, created_by_trigger: trigger.id,
    kind, anchor_kind: anchorKind, anchor_id: anchorId, team_id: teamId,
    status: "draft", subject: null, body_html: "", body_plain: "", content_sections: [],
    audience_type: audienceType, audience_filter: null, language_code: "en",
    delivery_method: "queued", last_edited_at: now.toISOString(), last_edited_by: null,
    expires_at: expiresAt.toISOString(),
  };
}

// Insert + result builder shared by all 5 handlers. Returns one result.
export async function tryInsert(
  sb: SupabaseClient, trigger: Trigger, kind: string, anchorId: string,
  row: ReturnType<typeof placeholderDraft>,
): Promise<HandlerResult> {
  if (await draftExists(sb, trigger.org_id, kind, anchorId)) {
    return { trigger_id: trigger.id, org_id: trigger.org_id, kind, anchor_id: anchorId, skipped: "already_drafted" };
  }
  const { error } = await sb.from("comms_messages").insert(row);
  if (error) return { trigger_id: trigger.id, org_id: trigger.org_id, kind, anchor_id: anchorId, error: error.message };
  return { trigger_id: trigger.id, org_id: trigger.org_id, kind, anchor_id: anchorId, created: true };
}
