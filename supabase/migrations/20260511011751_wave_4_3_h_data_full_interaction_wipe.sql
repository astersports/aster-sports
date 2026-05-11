-- Wave 4.3-H-data: full interaction-layer reset to clean baseline.
-- Applied via chat-side Supabase MCP 2026-05-11 01:17 UTC.
--
-- PRESERVES: events, tournaments, teams, players, guardians, game_results,
--            locations, organizations, organization_settings, app_secrets,
--            briefing_triggers, briefing_templates, all structural data.
-- WIPES: all parent/coach interaction state across 14 tables.
-- Target org: Legacy Hoopers (e3e95e21-3571-4e9a-985a-d5d01480d4a6).

DO $$
DECLARE
  c_org constant uuid := 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  v_rsvps int; v_duties int; v_arrivals int; v_comments int; v_checkins int;
  v_claims int; v_rides int; v_offers int;
  v_notifs int; v_recipients int; v_comms int; v_audits int;
  v_messages int; v_threads int;
BEGIN
  CREATE TEMP TABLE _wipe_event_ids ON COMMIT DROP AS
    SELECT e.id FROM events e
    JOIN teams t ON t.id = e.team_id
    WHERE t.org_id = c_org;

  DELETE FROM event_rsvps WHERE event_id IN (SELECT id FROM _wipe_event_ids);
  GET DIAGNOSTICS v_rsvps = ROW_COUNT;
  DELETE FROM event_duties WHERE event_id IN (SELECT id FROM _wipe_event_ids);
  GET DIAGNOSTICS v_duties = ROW_COUNT;
  DELETE FROM event_arrivals WHERE event_id IN (SELECT id FROM _wipe_event_ids);
  GET DIAGNOSTICS v_arrivals = ROW_COUNT;
  DELETE FROM event_comments WHERE event_id IN (SELECT id FROM _wipe_event_ids);
  GET DIAGNOSTICS v_comments = ROW_COUNT;
  DELETE FROM check_ins WHERE event_id IN (SELECT id FROM _wipe_event_ids);
  GET DIAGNOSTICS v_checkins = ROW_COUNT;

  -- Ride board: claims FK→offers + claims FK→requests, so claims first.
  -- event_ride_claims.offer_id FK is CASCADE, so the explicit DELETE here
  -- is documentation; same applies to comms_message_recipients below.
  DELETE FROM event_ride_claims WHERE org_id = c_org;
  GET DIAGNOSTICS v_claims = ROW_COUNT;
  DELETE FROM event_ride_requests WHERE org_id = c_org;
  GET DIAGNOSTICS v_rides = ROW_COUNT;
  DELETE FROM event_ride_offers WHERE event_id IN (SELECT id FROM _wipe_event_ids);
  GET DIAGNOSTICS v_offers = ROW_COUNT;

  DELETE FROM event_notifications WHERE org_id = c_org;
  GET DIAGNOSTICS v_notifs = ROW_COUNT;

  DELETE FROM comms_message_recipients
  WHERE message_id IN (SELECT id FROM comms_messages WHERE org_id = c_org);
  GET DIAGNOSTICS v_recipients = ROW_COUNT;
  DELETE FROM comms_messages WHERE org_id = c_org;
  GET DIAGNOSTICS v_comms = ROW_COUNT;

  DELETE FROM event_change_audit WHERE org_id = c_org;
  GET DIAGNOSTICS v_audits = ROW_COUNT;

  DELETE FROM messages WHERE org_id = c_org;
  GET DIAGNOSTICS v_messages = ROW_COUNT;
  DELETE FROM dm_threads WHERE org_id = c_org;
  GET DIAGNOSTICS v_threads = ROW_COUNT;

  IF (SELECT COUNT(*) FROM event_rsvps WHERE event_id IN (SELECT id FROM _wipe_event_ids)) != 0 THEN RAISE EXCEPTION 'event_rsvps wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM event_duties WHERE event_id IN (SELECT id FROM _wipe_event_ids)) != 0 THEN RAISE EXCEPTION 'event_duties wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM event_arrivals WHERE event_id IN (SELECT id FROM _wipe_event_ids)) != 0 THEN RAISE EXCEPTION 'event_arrivals wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM event_comments WHERE event_id IN (SELECT id FROM _wipe_event_ids)) != 0 THEN RAISE EXCEPTION 'event_comments wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM check_ins WHERE event_id IN (SELECT id FROM _wipe_event_ids)) != 0 THEN RAISE EXCEPTION 'check_ins wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM event_ride_claims WHERE org_id = c_org) != 0 THEN RAISE EXCEPTION 'event_ride_claims wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM event_ride_requests WHERE org_id = c_org) != 0 THEN RAISE EXCEPTION 'event_ride_requests wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM event_ride_offers WHERE event_id IN (SELECT id FROM _wipe_event_ids)) != 0 THEN RAISE EXCEPTION 'event_ride_offers wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM event_notifications WHERE org_id = c_org) != 0 THEN RAISE EXCEPTION 'event_notifications wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM comms_messages WHERE org_id = c_org) != 0 THEN RAISE EXCEPTION 'comms_messages wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM event_change_audit WHERE org_id = c_org) != 0 THEN RAISE EXCEPTION 'event_change_audit wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM messages WHERE org_id = c_org) != 0 THEN RAISE EXCEPTION 'messages wipe incomplete'; END IF;
  IF (SELECT COUNT(*) FROM dm_threads WHERE org_id = c_org) != 0 THEN RAISE EXCEPTION 'dm_threads wipe incomplete'; END IF;

  RAISE NOTICE 'Wave 4.3-H-data complete: rsvps=%, duties=%, arrivals=%, comments=%, checkins=%, ride_claims=%, ride_requests=%, ride_offers=%, notifications=%, comms_recipients=%, comms_messages=%, event_audits=%, chat_messages=%, dm_threads=%',
    v_rsvps, v_duties, v_arrivals, v_comments, v_checkins, v_claims, v_rides, v_offers,
    v_notifs, v_recipients, v_comms, v_audits, v_messages, v_threads;
END $$;
