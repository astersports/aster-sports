-- Closes Wave 3.B #27 P0-3: guardian consent ledger.
--
-- Today every imported guardian (and every manually-created one) lands in
-- the DB with zero consent record. CCPA / GDPR-best-practice / future
-- youth-sports compliance all require an auditable "this guardian
-- acknowledged X at time Y" trail. This table is the canonical record.
--
-- Out of scope here (separate PRs):
--   - signup-time accept UI (the privacy/ToS scaffold PR wires the form)
--   - LeagueApps-import re-affirmation flow (admin-driven; operator runs)
--   - admin-facing list view (read-only is fine for now; the table + RLS
--     mean a SQL query is enough at L99)
--
-- Schema decisions:
--   - guardian_id + org_id both stored (denormalized) so RLS can scope
--     to org membership without joining guardians on every read.
--   - consent_kind is a text label, not an ENUM, so the legal team can
--     introduce new categories without a schema change.
--   - document_version captures WHAT was consented to (Privacy Policy
--     v1.0, ToS v2.1, etc.). When the doc text changes materially, a
--     re-affirmation creates a new row with the new version; the old
--     row's revoked_at stays NULL (consent to the older version is still
--     a valid historical fact).
--   - given_at + revoked_at: a guardian can revoke a consent. Active
--     consents = revoked_at IS NULL.
--   - ip_address + user_agent: collected for the legal trail. NULLable
--     so admin-driven backfill rows (no per-row request context) don't
--     leak placeholder values.

create table if not exists public.guardian_consents (
  id              uuid primary key default gen_random_uuid(),
  guardian_id     uuid not null references public.guardians(id) on delete cascade,
  org_id          uuid not null references public.organizations(id) on delete cascade,
  consent_kind    text not null
    check (consent_kind in (
      'privacy_policy',
      'terms_of_service',
      'photo_video_release',
      'safesport_acknowledgment',
      'communications_optin'
    )),
  document_version text,
  given_at        timestamptz not null default now(),
  revoked_at      timestamptz,
  source          text
    check (source is null or source in (
      'signup',
      'admin_backfill',
      'updated_terms_reaffirm',
      'leagueapps_import_reaffirm',
      'admin_revoke'
    )),
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_guardian_consents_guardian on public.guardian_consents(guardian_id);
create index if not exists idx_guardian_consents_org      on public.guardian_consents(org_id);
create index if not exists idx_guardian_consents_active   on public.guardian_consents(guardian_id, consent_kind) where revoked_at is null;

-- One active consent per (guardian, kind, version). Re-affirmation to a
-- new version creates a new row; the old row remains as historical
-- evidence (and may itself be revoked separately if needed).
create unique index if not exists guardian_consents_active_unique
  on public.guardian_consents(guardian_id, consent_kind, document_version)
  where revoked_at is null;

comment on table public.guardian_consents is
  'Per-guardian consent ledger. One row per (guardian, consent_kind, document_version). Closes Wave 3.B #27 P0-3. Document text + version semantics owned by the privacy/ToS scaffold work. Active consent = revoked_at IS NULL.';

-- RLS — same shape as guardians + guardian_email_preferences (org-scoped
-- staff visibility; guardian sees their own consents via guardians.user_id).
alter table public.guardian_consents enable row level security;
revoke all on public.guardian_consents from public;
revoke all on public.guardian_consents from anon;

-- Staff in the org can see consents for any guardian in their org.
create policy "guardian_consents_select_staff" on public.guardian_consents
  for select to authenticated
  using (public.user_has_role_in_org(org_id, array['admin', 'coach']));

-- Guardian can see their OWN consents (via the link from guardians.user_id).
create policy "guardian_consents_select_own" on public.guardian_consents
  for select to authenticated
  using (guardian_id in (
    select id from public.guardians where user_id = (select auth.uid())
  ));

-- Inserts: signup flow (RLS-checked: caller is the guardian) OR admin backfill.
create policy "guardian_consents_insert_own_or_admin" on public.guardian_consents
  for insert to authenticated
  with check (
    guardian_id in (
      select id from public.guardians where user_id = (select auth.uid())
    )
    or public.user_has_role_in_org(org_id, array['admin'])
  );

-- Updates: only the guardian themselves (to revoke) or an admin. WITH
-- CHECK mirrors USING per AP #20.
create policy "guardian_consents_update_own_or_admin" on public.guardian_consents
  for update to authenticated
  using (
    guardian_id in (
      select id from public.guardians where user_id = (select auth.uid())
    )
    or public.user_has_role_in_org(org_id, array['admin'])
  )
  with check (
    guardian_id in (
      select id from public.guardians where user_id = (select auth.uid())
    )
    or public.user_has_role_in_org(org_id, array['admin'])
  );

-- No DELETE policy: consents are an append-only audit log. To "remove"
-- a consent, set revoked_at = now(). Admin can override via service_role
-- if a legal/compliance event requires it.
