-- Closes Wave 3.B #27 P1: players.notes free-form text PII sink.
--
-- The notes column on players is a free-form text field admins can
-- edit (allergies, behavioral notes, medical-related comments). It's
-- a PII sink that can hold sensitive child health information without
-- any guard at the data layer. Per §16.7 privacy locks doctrine, this
-- column needs an explicit PII flag so the admin UI surfaces a
-- warning and so any future export / data-subject-deletion flow knows
-- to include it.
--
-- Doc-only change at the DB layer (column COMMENT). UI warning is a
-- separate concern (the PlayerProfile edit form should display a
-- "Don't store sensitive health information here — use a dedicated
-- medical-info workflow" hint; tracked as a follow-up since the
-- PlayerProfile edit form doesn't yet have a notes input today).

comment on column public.players.notes is
  'PII SINK — free-form text. Admin-editable. May contain allergies, behavioral notes, medical-adjacent comments. Per §16.7 privacy locks: do NOT use for sensitive health information; recommend a dedicated medical-info workflow when one exists. Included in account-deletion processing (3B.27.P0-1) and any future data-export flow.';

-- Verification
do $$
declare
  has_comment boolean;
begin
  select coalesce(col_description(
    ('public.players')::regclass::oid,
    (select ordinal_position from information_schema.columns where table_schema='public' and table_name='players' and column_name='notes')
  ) like 'PII SINK%', false) into has_comment;
  if not has_comment then
    raise exception 'players.notes PII SINK comment not applied';
  end if;
end $$;
