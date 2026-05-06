-- ============================================================================
-- Migration: Path B Stage 3 - Synthesize Fall 2025 financial history
-- Date: 2026-05-06
-- ============================================================================
-- Loads 47 paid Fall 2025 registrations as guardians + players + accounts + transactions.
-- 
-- Counts (pre-flight):
--   31 new guardians (37 existed already)
--   29 new players (18 existed already)
--   46 new player_guardians links (some may dedupe)
--   41 new financial_accounts under Fall 2025 season
--   46 new financial_transactions ($53,602.50)
--   1 SKIPPED: Krystalenia Demasi (no P1 email in registration -- carry-forward)
--
-- Post-flight target: Fall 2025 = 41 accts / $53,602.50 / 46 txns
-- ============================================================================

-- Step 1: Create 31 missing guardians
INSERT INTO public.guardians (id, org_id, first_name, last_name, email, phone) VALUES
  ('a1975b9a-db64-41ef-bb5a-672f0c83a593', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Edward', 'Santevecchi', 'esante01@gmail.com', '19178621321'),
  ('399b7af0-60af-4fff-a190-b54101dc51b0', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Leena', 'Kapur', 'leens106@gmail.com', '19179216199'),
  ('a65bc958-2bb7-4b4e-840f-c7df895f8e92', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Nick', 'Kapur', 'nikhil_kapur@hotmail.com', '16462793261'),
  ('8206f16c-9cb7-4175-a0fa-7b37769dad80', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Lyndie', 'Fasold', 'lyndie.fasold@gmail.com', '16467530385'),
  ('d4d15b5b-2a54-452d-82b5-2bdea08db883', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Cory', 'Fasold', 'cfasold33@yahoo.com', '19144799032'),
  ('7f5f161c-313a-4eae-b1e8-e9682d83aebb', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Blair', 'Jacobs', 'blair.g.jacobs@gmail.com', '12162334238'),
  ('3b621f36-041d-46e9-9296-9bca48197b68', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jillian', 'Bajraktari', 'jillbaj217@gmail.com', '16318340098'),
  ('ec9acc54-5edd-44b9-8374-9f87eb4e2548', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jason', 'Colombo', 'jasonmcolombo@gmail.com', '19172920460'),
  ('7bb3e085-fd73-4d93-9b15-69076018cc47', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jessica', 'Colombo', 'jlevin8@gmail.com', '17327357126'),
  ('694e8f5a-8fb5-4d00-9e35-25ba9222c51c', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Stefanie', 'Forest', 'stefanie.forest@gmail.com', '19148063746'),
  ('a6db4f89-1581-4ae1-900a-99e232ac6fab', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jacqueline', 'Lederman', 'jacquie.lederman@yahoo.com', '19174478912'),
  ('22ce1774-1bf3-41d5-93bc-9f595c2d8cc4', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jon', 'Sachs', 'jsachs1@gmail.com', '19175492909'),
  ('cb215868-d189-4d9c-9ee5-85f825d062fd', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Rose', 'Cohen', 'rmcohen345@gmail.com', '16467084401'),
  ('42847f8d-8ba2-416b-903d-7d965de97feb', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Adam', 'Cohen', 'abcohenmd@gmail.com', '19173630632'),
  ('9441917c-c03a-467a-bbef-8340f1097394', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Nana', 'Maksumov', 'nanachka208@yahoo.com', '19176556200'),
  ('c462baa7-e080-4f2a-b80d-de3299472806', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Alex', 'Maksumov', 'dmode06@gmail.com', NULL),
  ('9c40fdb4-38e9-485f-9000-79af6140012f', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jessica', 'Levy', 'jlevy167@gmail.com', '15163144971'),
  ('91a255cf-fd4f-4f58-987e-98e240520d4b', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jason', 'Levy', 'jlevy10@gmail.com', '15163144971'),
  ('7811dc71-be45-410b-945f-528f4453480b', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Nikki', 'Pozzi', 'nicole.pozzi@gmail.com', '12404989024'),
  ('b494a5aa-9ab9-41b7-8e34-64be3acbc540', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Mike', 'Pozzi', 'mpozzi01@gmail.com', NULL),
  ('9bbd2ad9-7bcc-44f3-b46f-2947d8e68530', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Peggy', 'Rios', 'korenismd@gmail.com', '19144265127'),
  ('4740478c-1fa3-43aa-802b-f0147d2ffa38', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Dana', 'Ingwer', 'danabrooke1126@gmail.com', '15162205241'),
  ('07532da2-399c-41dc-a3d2-94987f0a6b67', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Brian', 'Davis', 'bdavis59@gmail.com', '15163763450'),
  ('1f49c976-5e3d-495f-ab23-655f427c75d7', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Brittne', 'Davis', 'brittnedavis22@gmail.com', NULL),
  ('55c4748a-894b-449d-9e87-9935e7c57f1f', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Liz', 'Beler', 'lizbeler@gmail.com', '19176013501'),
  ('901d02ed-0d75-4027-a8a5-2e49a85a1360', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Claudia', 'Seuss', 'claudia.reuben@gmail.com', '19143914508'),
  ('c9c12bf0-b8c2-44d7-a577-7549faaeacc3', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Peter', 'Seuss', 'pseuss@gmail.com', '19146498623'),
  ('c564a251-2e13-42fd-b75a-dd8fed38e229', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Gal', 'Seiler', 'gali1004@yahoo.com', '15162982228'),
  ('6ba0cd8c-692d-4b52-907a-e32fecbe183d', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Frank', 'Samaritano', 'fsamaritano@hotmail.com', '19179919830'),
  ('f6925a45-335f-4ebd-a297-fe3782e4a72d', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Alisa', 'Tolchin', 'alisa.amsterdam@gmail.com', '6464838392'),
  ('4bfcca3a-6d47-42ea-8ed6-ee4b4e1ffbda', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Glenn', 'Tolchin', 'glenn@upanyc.com', '19173596727')
ON CONFLICT (email) DO NOTHING;

-- Step 2: Create 29 missing players
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '45fb079e-4f3a-472e-8eb2-66c07976e286', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Talia', 'Santevecchi', DATE '2016-09-24' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Talia') AND LOWER(last_name) = LOWER('Santevecchi'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '04ed8cbb-bc43-496e-9ab6-3c488f848951', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Naya', 'Kapur', DATE '2015-11-03' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Naya') AND LOWER(last_name) = LOWER('Kapur'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '0d258a65-a74b-4ff9-b35d-419fd655eee0', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Brady', 'Fasold', DATE '2014-06-06' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Brady') AND LOWER(last_name) = LOWER('Fasold'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '0e4d2ef0-1dfa-4d3e-8e31-6b9cc7cf3684', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Ryder', 'LeBlanc', DATE '2014-06-13' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Ryder') AND LOWER(last_name) = LOWER('LeBlanc'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'fa6bbd29-3e68-4c2b-9532-ac6261ea7c58', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Zoe', 'Jacobs', DATE '2015-11-06' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Zoe') AND LOWER(last_name) = LOWER('Jacobs'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '40080350-e20b-4c4d-9250-83b87d9bef6d', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Liv', 'Jacobs', DATE '2015-11-06' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Liv') AND LOWER(last_name) = LOWER('Jacobs'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'b5017768-c52c-431c-bab9-c71ecde07b86', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Alexa', 'Bajraktari', DATE '2015-03-20' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Alexa') AND LOWER(last_name) = LOWER('Bajraktari'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'f382b3c7-2ed8-4b2d-a102-36dcb909c6a9', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Dylan', 'Feldman', DATE '2014-05-02' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Dylan') AND LOWER(last_name) = LOWER('Feldman'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '9a7134d1-1c1d-4ff5-aea8-c073ead34751', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Ryan', 'Colombo', DATE '2014-05-02' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Ryan') AND LOWER(last_name) = LOWER('Colombo'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'a6b19a30-9b1b-4392-bab2-ee161d676417', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Carter', 'Forest', DATE '2014-10-21' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Carter') AND LOWER(last_name) = LOWER('Forest'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '9c7afa0d-bc09-497a-b838-2dc561b375d3', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jesse', 'Lederman', DATE '2014-06-03' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Jesse') AND LOWER(last_name) = LOWER('Lederman'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '91833dc7-ca2d-4546-bd5e-99c0f9ac7b1f', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Tyler', 'Sachs', DATE '1982-08-01' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Tyler') AND LOWER(last_name) = LOWER('Sachs'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '4cf7b78f-4205-4e47-87ae-466143210307', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Lincoln', 'Cohen', DATE '2014-06-14' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Lincoln') AND LOWER(last_name) = LOWER('Cohen'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'cdd95a1a-8163-46ef-a520-45eb818f3267', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'David', 'Maksumov', DATE '2014-09-14' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('David') AND LOWER(last_name) = LOWER('Maksumov'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'de298568-3e53-4999-86b2-0f119de36f2a', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Ron', 'Levy', DATE '2014-03-18' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Ron') AND LOWER(last_name) = LOWER('Levy'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'f71d720e-8593-415e-9b53-a55739449276', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jack', 'Forman', DATE '2014-06-17' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Jack') AND LOWER(last_name) = LOWER('Forman'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '7100c0f8-9b38-4608-bb52-96ccfb8d866c', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Jake', 'Pozzi', DATE '2013-11-19' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Jake') AND LOWER(last_name) = LOWER('Pozzi'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '6382d941-1209-491e-938f-be355ea1d0bc', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Joshua', 'Rios', DATE '2014-03-08' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Joshua') AND LOWER(last_name) = LOWER('Rios'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'a8e1df5e-c816-4710-bbc5-ee08bd2faff0', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Wyatt', 'Feldman', DATE '2016-10-06' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Wyatt') AND LOWER(last_name) = LOWER('Feldman'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '7a1240ed-5fca-43e3-909b-41d6e2049d85', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Henry', 'Forman', DATE '2016-01-29' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Henry') AND LOWER(last_name) = LOWER('Forman'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'e38032a8-0959-4e97-88fa-810dcb473019', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Makyla', 'Ingwer', DATE '2015-05-12' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Makyla') AND LOWER(last_name) = LOWER('Ingwer'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '417ee02a-854f-4b4c-955b-79eb920d10e9', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Kendall', 'Davis', DATE '2015-05-08' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Kendall') AND LOWER(last_name) = LOWER('Davis'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '2632df07-820e-4559-9e64-ebcb71856882', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Theodora', 'Beler', DATE '2015-08-23' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Theodora') AND LOWER(last_name) = LOWER('Beler'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'bd774c6b-d011-40a6-8865-36369c8ebb8f', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Charlotte', 'Seuss', DATE '2015-04-12' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Charlotte') AND LOWER(last_name) = LOWER('Seuss'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '04fb0274-3d3d-43a9-bbb8-0244535a06fc', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Hana', 'Levy', DATE '2015-05-05' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Hana') AND LOWER(last_name) = LOWER('Levy'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '1c88c6af-066b-4119-9035-571501983c62', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Maya', 'Seiler', DATE '2015-10-21' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Maya') AND LOWER(last_name) = LOWER('Seiler'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '77b5d58b-270c-4c6a-9658-e74cd9e0a93c', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Zoe', 'Neimand', DATE '2015-01-12' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Zoe') AND LOWER(last_name) = LOWER('Neimand'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT '6b34c10f-6000-4417-9fde-12dad8adfecc', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Locklyn', 'Yasgur', DATE '2015-09-09' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Locklyn') AND LOWER(last_name) = LOWER('Yasgur'));
INSERT INTO public.players (id, org_id, first_name, last_name, dob) SELECT 'df88ece7-c235-4167-87fe-79ed35b22bf1', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Chloe', 'Tolchin', DATE '2015-07-10' WHERE NOT EXISTS (SELECT 1 FROM public.players WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND LOWER(first_name) = LOWER('Chloe') AND LOWER(last_name) = LOWER('Tolchin'));

-- Step 3: Create player_guardians links (P1 = primary, P2 = secondary)
INSERT INTO public.player_guardians (player_id, guardian_id, relationship, is_primary) VALUES
  ('45fb079e-4f3a-472e-8eb2-66c07976e286', 'a1975b9a-db64-41ef-bb5a-672f0c83a593', 'parent', true),
  ('18b86aab-de3b-44aa-96dc-22ed51423316', '3e61c9bb-659a-4878-aa1c-0c084886a027', 'parent', true),
  ('18b86aab-de3b-44aa-96dc-22ed51423316', '7094acce-7231-45a9-b6c9-d396cce9bbfe', 'parent', false),
  ('04ed8cbb-bc43-496e-9ab6-3c488f848951', '399b7af0-60af-4fff-a190-b54101dc51b0', 'parent', true),
  ('04ed8cbb-bc43-496e-9ab6-3c488f848951', 'a65bc958-2bb7-4b4e-840f-c7df895f8e92', 'parent', false),
  ('e3abcf1a-8391-4824-8241-b8f4a33627f4', '42dd4b5d-b91c-4697-a627-1366e3b5d52f', 'parent', true),
  ('0d258a65-a74b-4ff9-b35d-419fd655eee0', '8206f16c-9cb7-4175-a0fa-7b37769dad80', 'parent', true),
  ('0d258a65-a74b-4ff9-b35d-419fd655eee0', 'd4d15b5b-2a54-452d-82b5-2bdea08db883', 'parent', false),
  ('0e4d2ef0-1dfa-4d3e-8e31-6b9cc7cf3684', 'c8023893-116a-4931-bb27-15642545f49a', 'parent', true),
  ('0e4d2ef0-1dfa-4d3e-8e31-6b9cc7cf3684', '4ffc0be1-6360-44b8-9abd-221d53d1f602', 'parent', false),
  ('fa6bbd29-3e68-4c2b-9532-ac6261ea7c58', '7f5f161c-313a-4eae-b1e8-e9682d83aebb', 'parent', true),
  ('40080350-e20b-4c4d-9250-83b87d9bef6d', '7f5f161c-313a-4eae-b1e8-e9682d83aebb', 'parent', true),
  ('b5017768-c52c-431c-bab9-c71ecde07b86', '3b621f36-041d-46e9-9296-9bca48197b68', 'parent', true),
  ('f382b3c7-2ed8-4b2d-a102-36dcb909c6a9', '8f4378a8-ad1c-43b2-b2c3-912150573673', 'parent', true),
  ('9a7134d1-1c1d-4ff5-aea8-c073ead34751', 'ec9acc54-5edd-44b9-8374-9f87eb4e2548', 'parent', true),
  ('9a7134d1-1c1d-4ff5-aea8-c073ead34751', '7bb3e085-fd73-4d93-9b15-69076018cc47', 'parent', false),
  ('a6b19a30-9b1b-4392-bab2-ee161d676417', '694e8f5a-8fb5-4d00-9e35-25ba9222c51c', 'parent', true),
  ('9c7afa0d-bc09-497a-b838-2dc561b375d3', 'a6db4f89-1581-4ae1-900a-99e232ac6fab', 'parent', true),
  ('91833dc7-ca2d-4546-bd5e-99c0f9ac7b1f', '22ce1774-1bf3-41d5-93bc-9f595c2d8cc4', 'parent', true),
  ('91833dc7-ca2d-4546-bd5e-99c0f9ac7b1f', 'ab3f6b1d-e075-4847-88ac-da8516fce958', 'parent', false),
  ('4cf7b78f-4205-4e47-87ae-466143210307', 'cb215868-d189-4d9c-9ee5-85f825d062fd', 'parent', true),
  ('4cf7b78f-4205-4e47-87ae-466143210307', '42847f8d-8ba2-416b-903d-7d965de97feb', 'parent', false),
  ('cdd95a1a-8163-46ef-a520-45eb818f3267', '9441917c-c03a-467a-bbef-8340f1097394', 'parent', true),
  ('cdd95a1a-8163-46ef-a520-45eb818f3267', 'c462baa7-e080-4f2a-b80d-de3299472806', 'parent', false),
  ('de298568-3e53-4999-86b2-0f119de36f2a', '9c40fdb4-38e9-485f-9000-79af6140012f', 'parent', true),
  ('de298568-3e53-4999-86b2-0f119de36f2a', '91a255cf-fd4f-4f58-987e-98e240520d4b', 'parent', false),
  ('f71d720e-8593-415e-9b53-a55739449276', 'f30602a6-b7f4-4131-8156-953c0f75673a', 'parent', true),
  ('f71d720e-8593-415e-9b53-a55739449276', '231a666e-437e-4985-905f-946ea3820ffc', 'parent', false),
  ('7100c0f8-9b38-4608-bb52-96ccfb8d866c', '7811dc71-be45-410b-945f-528f4453480b', 'parent', true),
  ('7100c0f8-9b38-4608-bb52-96ccfb8d866c', 'b494a5aa-9ab9-41b7-8e34-64be3acbc540', 'parent', false),
  ('6382d941-1209-491e-938f-be355ea1d0bc', '9bbd2ad9-7bcc-44f3-b46f-2947d8e68530', 'parent', true),
  ('a8e1df5e-c816-4710-bbc5-ee08bd2faff0', '8f4378a8-ad1c-43b2-b2c3-912150573673', 'parent', true),
  ('aeb76b0c-5f04-4605-8ed5-61f50f991d58', '61742708-92c2-49bb-b12c-dd912bbd4413', 'parent', true),
  ('aeb76b0c-5f04-4605-8ed5-61f50f991d58', '804b2aac-23bb-4899-a06b-3b0e0ba4e7be', 'parent', false),
  ('1bdea839-6a57-42ab-9d78-a8a6436cf11b', '1ae2ac08-67aa-4ef3-8e1c-ecd065ef4218', 'parent', true),
  ('1bdea839-6a57-42ab-9d78-a8a6436cf11b', '7b4a0b9a-67de-4cfd-a542-079f59b22131', 'parent', false),
  ('7a1240ed-5fca-43e3-909b-41d6e2049d85', 'f30602a6-b7f4-4131-8156-953c0f75673a', 'parent', true),
  ('7a1240ed-5fca-43e3-909b-41d6e2049d85', '231a666e-437e-4985-905f-946ea3820ffc', 'parent', false),
  ('0a507ad9-0a10-4146-8311-f9a11a8d3052', 'bcac3fe1-a958-44bc-a8b5-5b40a3ce262f', 'parent', true),
  ('4e361e9b-4cfa-46b7-bae8-48552f9841e0', '0896bcd1-4b11-4ccc-a9ce-f03c29eb1d03', 'parent', true),
  ('4e361e9b-4cfa-46b7-bae8-48552f9841e0', 'f3553748-9b77-43af-9f53-0e595a2bf76e', 'parent', false),
  ('e84f1fa7-a480-424b-b379-5b46f4e55b62', '393eefd0-133e-4b78-84ff-d6fe968e7ece', 'parent', true),
  ('e84f1fa7-a480-424b-b379-5b46f4e55b62', '4e41b228-a7d5-45c7-b4a6-30809253667c', 'parent', false),
  ('fa384908-7441-447d-b23a-eea152b37a59', 'dc8738ff-ef83-4eac-ba0a-e40483db8a5f', 'parent', true),
  ('fa384908-7441-447d-b23a-eea152b37a59', 'daad9fe6-3c86-4ebc-8ee1-618f9a686dfe', 'parent', false),
  ('8497c4bc-94a3-431a-852b-9189a3bae6b9', '41121ca9-4aaa-4902-8a1a-44c7544ba49f', 'parent', true),
  ('8497c4bc-94a3-431a-852b-9189a3bae6b9', 'ba2ab256-d1c3-4c4c-abe2-152956df3018', 'parent', false),
  ('f3aa5ce1-119b-4fa4-ad16-d042bb1b0047', 'f964403c-144b-4916-bf56-0b54b7ec8c6f', 'parent', true),
  ('f3aa5ce1-119b-4fa4-ad16-d042bb1b0047', '3ae9ba4e-122c-467a-a498-8e651cd13367', 'parent', false),
  ('0d971247-327e-4879-8bf4-184d1a8e9883', 'f964403c-144b-4916-bf56-0b54b7ec8c6f', 'parent', true),
  ('0d971247-327e-4879-8bf4-184d1a8e9883', '3ae9ba4e-122c-467a-a498-8e651cd13367', 'parent', false),
  ('2cd74025-7e6a-43ce-b5d0-ecf69baf72d4', '69f73a58-eee9-4c55-8ec8-ea8835a537da', 'parent', true),
  ('2cd74025-7e6a-43ce-b5d0-ecf69baf72d4', '61f9408b-81df-493a-bb6c-6e95d01c612b', 'parent', false),
  ('05a851e0-b025-4970-ad32-975fcfc28605', 'd055c8ce-8f78-46e0-8aaf-59b31914e08d', 'parent', true),
  ('05a851e0-b025-4970-ad32-975fcfc28605', 'd015a90b-b134-4542-aba5-8e354d58d19e', 'parent', false),
  ('ccc538a0-89ce-4005-bfeb-71428f87526c', 'bb3b7cee-b8e3-4603-86cc-8601169df565', 'parent', true),
  ('ccc538a0-89ce-4005-bfeb-71428f87526c', '348b5627-b649-40a0-aae2-c866514d34f0', 'parent', false),
  ('3d16b790-65f1-4e74-8aad-4a46a24bba05', '51ff3882-22a0-4931-a6e7-010e3073ba36', 'parent', true),
  ('3d16b790-65f1-4e74-8aad-4a46a24bba05', 'e2fc9788-e6c2-4628-8fc6-c90bea85c9b5', 'parent', false),
  ('e38032a8-0959-4e97-88fa-810dcb473019', '4740478c-1fa3-43aa-802b-f0147d2ffa38', 'parent', true),
  ('417ee02a-854f-4b4c-955b-79eb920d10e9', '07532da2-399c-41dc-a3d2-94987f0a6b67', 'parent', true),
  ('417ee02a-854f-4b4c-955b-79eb920d10e9', '1f49c976-5e3d-495f-ab23-655f427c75d7', 'parent', false),
  ('2632df07-820e-4559-9e64-ebcb71856882', '55c4748a-894b-449d-9e87-9935e7c57f1f', 'parent', true),
  ('bd774c6b-d011-40a6-8865-36369c8ebb8f', '901d02ed-0d75-4027-a8a5-2e49a85a1360', 'parent', true),
  ('bd774c6b-d011-40a6-8865-36369c8ebb8f', 'c9c12bf0-b8c2-44d7-a577-7549faaeacc3', 'parent', false),
  ('04fb0274-3d3d-43a9-bbb8-0244535a06fc', '9c40fdb4-38e9-485f-9000-79af6140012f', 'parent', true),
  ('04fb0274-3d3d-43a9-bbb8-0244535a06fc', '91a255cf-fd4f-4f58-987e-98e240520d4b', 'parent', false),
  ('1c88c6af-066b-4119-9035-571501983c62', 'c564a251-2e13-42fd-b75a-dd8fed38e229', 'parent', true),
  ('77b5d58b-270c-4c6a-9658-e74cd9e0a93c', '7791172a-1698-4058-8689-62ff33243fa9', 'parent', true),
  ('77b5d58b-270c-4c6a-9658-e74cd9e0a93c', '63c9e504-0542-4f1b-9f5c-f1da9b383231', 'parent', false),
  ('6b34c10f-6000-4417-9fde-12dad8adfecc', 'ec5f4bf1-8510-4b35-963f-5493a7301e26', 'parent', true),
  ('67690d8a-fbb2-476b-908a-a501eb2e5e7c', '6ba0cd8c-692d-4b52-907a-e32fecbe183d', 'parent', true),
  ('67690d8a-fbb2-476b-908a-a501eb2e5e7c', '8de4a7b8-d795-4179-a66e-476d947b642a', 'parent', false),
  ('df88ece7-c235-4167-87fe-79ed35b22bf1', 'f6925a45-335f-4ebd-a297-fe3782e4a72d', 'parent', true),
  ('df88ece7-c235-4167-87fe-79ed35b22bf1', '4bfcca3a-6d47-42ea-8ed6-ee4b4e1ffbda', 'parent', false),
  ('f3e9a55e-e8fc-443d-8d97-580d68338e2d', 'f5280753-34c6-4924-8779-5c22750f6943', 'parent', true)
ON CONFLICT (player_id, guardian_id) DO NOTHING;

-- Step 4: Create 41 financial_accounts for Fall 2025 (one per P1 family)
WITH fall_season AS (SELECT id FROM public.seasons WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025')
INSERT INTO public.financial_accounts (org_id, guardian_id, season_id, season_fee_cents, notes) VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'a1975b9a-db64-41ef-bb5a-672f0c83a593', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Talia Santevecchi ($1275.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '3e61c9bb-659a-4878-aa1c-0c084886a027', (SELECT id FROM fall_season), 87500, 'Fall 2025 backfill 2026-05-06: Griffin Lubel ($875.00, 4th Grade Boys - Practice Roster)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '399b7af0-60af-4fff-a190-b54101dc51b0', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Naya Kapur ($1275.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '42dd4b5d-b91c-4697-a627-1366e3b5d52f', (SELECT id FROM fall_season), 70000, 'Fall 2025 backfill 2026-05-06: Hannah Bixler ($700.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '8206f16c-9cb7-4175-a0fa-7b37769dad80', (SELECT id FROM fall_season), 120000, 'Fall 2025 backfill 2026-05-06: Brady Fasold ($1200.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'c8023893-116a-4931-bb27-15642545f49a', (SELECT id FROM fall_season), 120000, 'Fall 2025 backfill 2026-05-06: Ryder LeBlanc ($1200.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '7f5f161c-313a-4eae-b1e8-e9682d83aebb', (SELECT id FROM fall_season), 216750, 'Fall 2025 backfill 2026-05-06: Zoe Jacobs ($1275.00, 5th Grade Girls Black); Liv Jacobs ($892.50, 5th Grade Girls Black)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '3b621f36-041d-46e9-9296-9bca48197b68', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Alexa Bajraktari ($1275.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '8f4378a8-ad1c-43b2-b2c3-912150573673', (SELECT id FROM fall_season), 234750, 'Fall 2025 backfill 2026-05-06: Dylan Feldman ($1072.50, 6th Grade Boys); Wyatt Feldman ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'ec9acc54-5edd-44b9-8374-9f87eb4e2548', (SELECT id FROM fall_season), 120000, 'Fall 2025 backfill 2026-05-06: Ryan Colombo ($1200.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '694e8f5a-8fb5-4d00-9e35-25ba9222c51c', (SELECT id FROM fall_season), 80000, 'Fall 2025 backfill 2026-05-06: Carter Forest ($800.00, 6th Grade Boys - Practice Roster)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'a6db4f89-1581-4ae1-900a-99e232ac6fab', (SELECT id FROM fall_season), 115000, 'Fall 2025 backfill 2026-05-06: Jesse Lederman ($1150.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '22ce1774-1bf3-41d5-93bc-9f595c2d8cc4', (SELECT id FROM fall_season), 120000, 'Fall 2025 backfill 2026-05-06: Tyler Sachs ($1200.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'cb215868-d189-4d9c-9ee5-85f825d062fd', (SELECT id FROM fall_season), 120000, 'Fall 2025 backfill 2026-05-06: Lincoln Cohen ($1200.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '9441917c-c03a-467a-bbef-8340f1097394', (SELECT id FROM fall_season), 120000, 'Fall 2025 backfill 2026-05-06: David Maksumov ($1200.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '9c40fdb4-38e9-485f-9000-79af6140012f', (SELECT id FROM fall_season), 207500, 'Fall 2025 backfill 2026-05-06: Ron Levy ($800.00, 6th Grade Boys - Practice Roster); Hana Levy ($1275.00, 5th Grade Girls Black)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'f30602a6-b7f4-4131-8156-953c0f75673a', (SELECT id FROM fall_season), 247500, 'Fall 2025 backfill 2026-05-06: Jack Forman ($1200.00, 6th Grade Boys); Henry Forman ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '7811dc71-be45-410b-945f-528f4453480b', (SELECT id FROM fall_season), 120000, 'Fall 2025 backfill 2026-05-06: Jake Pozzi ($1200.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '9bbd2ad9-7bcc-44f3-b46f-2947d8e68530', (SELECT id FROM fall_season), 120000, 'Fall 2025 backfill 2026-05-06: Joshua Rios ($1200.00, 6th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '61742708-92c2-49bb-b12c-dd912bbd4413', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Henry Graff ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '1ae2ac08-67aa-4ef3-8e1c-ecd065ef4218', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Frankie Schindler ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'bcac3fe1-a958-44bc-a8b5-5b40a3ce262f', (SELECT id FROM fall_season), 85000, 'Fall 2025 backfill 2026-05-06: Parker Richheimer ($850.00, 4th Grade Boys - Practice Roster)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '0896bcd1-4b11-4ccc-a9ce-f03c29eb1d03', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Jake Perkiel ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '393eefd0-133e-4b78-84ff-d6fe968e7ece', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Mason Drumheller ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'dc8738ff-ef83-4eac-ba0a-e40483db8a5f', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Aubtin Khojasteh ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '41121ca9-4aaa-4902-8a1a-44c7544ba49f', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Spencer Clark ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'f964403c-144b-4916-bf56-0b54b7ec8c6f', (SELECT id FROM fall_season), 255000, 'Fall 2025 backfill 2026-05-06: Gabriel Alexander ($1275.00, 4th Grade Boys); Lily Alexander ($1275.00, 5th Grade Girls Black)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '69f73a58-eee9-4c55-8ec8-ea8835a537da', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Liam Diller ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'd055c8ce-8f78-46e0-8aaf-59b31914e08d', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Lucas Mandell ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'bb3b7cee-b8e3-4603-86cc-8601169df565', (SELECT id FROM fall_season), 115000, 'Fall 2025 backfill 2026-05-06: Sofia Dodaro ($1150.00, 5th Grade Girls Black)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '51ff3882-22a0-4931-a6e7-010e3073ba36', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Christian Clarke ($1275.00, 4th Grade Boys)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '4740478c-1fa3-43aa-802b-f0147d2ffa38', (SELECT id FROM fall_season), 72500, 'Fall 2025 backfill 2026-05-06: Makyla Ingwer ($725.00, 5th Grade Girls Black)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '07532da2-399c-41dc-a3d2-94987f0a6b67', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Kendall Davis ($1275.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '55c4748a-894b-449d-9e87-9935e7c57f1f', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Theodora Beler ($1275.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '901d02ed-0d75-4027-a8a5-2e49a85a1360', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Charlotte Seuss ($1275.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'c564a251-2e13-42fd-b75a-dd8fed38e229', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Maya Seiler ($1275.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '7791172a-1698-4058-8689-62ff33243fa9', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Zoe Neimand ($1275.00, 5th Grade Girls Blue)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'ec5f4bf1-8510-4b35-963f-5493a7301e26', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Locklyn Yasgur ($1275.00, 5th Grade Girls Black)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '6ba0cd8c-692d-4b52-907a-e32fecbe183d', (SELECT id FROM fall_season), 63750, 'Fall 2025 backfill 2026-05-06: Charlie Samaritano ($637.50, 5th Grade Girls Black)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'f6925a45-335f-4ebd-a297-fe3782e4a72d', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Chloe Tolchin ($1275.00, 5th Grade Girls Black)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'f5280753-34c6-4924-8779-5c22750f6943', (SELECT id FROM fall_season), 127500, 'Fall 2025 backfill 2026-05-06: Demi Stamatakos ($1275.00, 5th Grade Girls Black)')
ON CONFLICT (org_id, guardian_id, season_id) DO NOTHING;

-- Step 5: Create 46 financial_transactions for Fall 2025 paid registrations
WITH fall_season AS (SELECT id FROM public.seasons WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025'),
     fall_accounts AS (SELECT id, guardian_id FROM public.financial_accounts WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND season_id = (SELECT id FROM fall_season))
INSERT INTO public.financial_transactions (account_id, org_id, transaction_type, amount_cents, payment_method, reference, occurred_at, notes)
SELECT fa.id, 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'payment', t.fee_cents, 'other', t.reference, t.occurred_at, t.notes
FROM (VALUES
  ('a1975b9a-db64-41ef-bb5a-672f0c83a593', 127500, 'LeagueApps Fall 2025: Talia Santevecchi / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Talia Santevecchi / 5th Grade Girls Blue'),
  ('3e61c9bb-659a-4878-aa1c-0c084886a027', 87500, 'LeagueApps Fall 2025: Griffin Lubel / 4th Grade Boys - Practice Roster', '2025-09-01 12:00:00-04:00'::timestamptz, 'Griffin Lubel / 4th Grade Boys - Practice Roster'),
  ('399b7af0-60af-4fff-a190-b54101dc51b0', 127500, 'LeagueApps Fall 2025: Naya Kapur / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Naya Kapur / 5th Grade Girls Blue'),
  ('42dd4b5d-b91c-4697-a627-1366e3b5d52f', 70000, 'LeagueApps Fall 2025: Hannah Bixler / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Hannah Bixler / 5th Grade Girls Blue'),
  ('8206f16c-9cb7-4175-a0fa-7b37769dad80', 120000, 'LeagueApps Fall 2025: Brady Fasold / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Brady Fasold / 6th Grade Boys'),
  ('c8023893-116a-4931-bb27-15642545f49a', 120000, 'LeagueApps Fall 2025: Ryder LeBlanc / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Ryder LeBlanc / 6th Grade Boys'),
  ('7f5f161c-313a-4eae-b1e8-e9682d83aebb', 127500, 'LeagueApps Fall 2025: Zoe Jacobs / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Zoe Jacobs / 5th Grade Girls Black'),
  ('7f5f161c-313a-4eae-b1e8-e9682d83aebb', 89250, 'LeagueApps Fall 2025: Liv Jacobs / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Liv Jacobs / 5th Grade Girls Black'),
  ('3b621f36-041d-46e9-9296-9bca48197b68', 127500, 'LeagueApps Fall 2025: Alexa Bajraktari / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Alexa Bajraktari / 5th Grade Girls Blue'),
  ('8f4378a8-ad1c-43b2-b2c3-912150573673', 107250, 'LeagueApps Fall 2025: Dylan Feldman / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Dylan Feldman / 6th Grade Boys'),
  ('ec9acc54-5edd-44b9-8374-9f87eb4e2548', 120000, 'LeagueApps Fall 2025: Ryan Colombo / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Ryan Colombo / 6th Grade Boys'),
  ('694e8f5a-8fb5-4d00-9e35-25ba9222c51c', 80000, 'LeagueApps Fall 2025: Carter Forest / 6th Grade Boys - Practice Roster', '2025-09-01 12:00:00-04:00'::timestamptz, 'Carter Forest / 6th Grade Boys - Practice Roster'),
  ('a6db4f89-1581-4ae1-900a-99e232ac6fab', 115000, 'LeagueApps Fall 2025: Jesse Lederman / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Jesse Lederman / 6th Grade Boys'),
  ('22ce1774-1bf3-41d5-93bc-9f595c2d8cc4', 120000, 'LeagueApps Fall 2025: Tyler Sachs / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Tyler Sachs / 6th Grade Boys'),
  ('cb215868-d189-4d9c-9ee5-85f825d062fd', 120000, 'LeagueApps Fall 2025: Lincoln Cohen / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Lincoln Cohen / 6th Grade Boys'),
  ('9441917c-c03a-467a-bbef-8340f1097394', 120000, 'LeagueApps Fall 2025: David Maksumov / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'David Maksumov / 6th Grade Boys'),
  ('9c40fdb4-38e9-485f-9000-79af6140012f', 80000, 'LeagueApps Fall 2025: Ron Levy / 6th Grade Boys - Practice Roster', '2025-09-01 12:00:00-04:00'::timestamptz, 'Ron Levy / 6th Grade Boys - Practice Roster'),
  ('f30602a6-b7f4-4131-8156-953c0f75673a', 120000, 'LeagueApps Fall 2025: Jack Forman / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Jack Forman / 6th Grade Boys'),
  ('7811dc71-be45-410b-945f-528f4453480b', 120000, 'LeagueApps Fall 2025: Jake Pozzi / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Jake Pozzi / 6th Grade Boys'),
  ('9bbd2ad9-7bcc-44f3-b46f-2947d8e68530', 120000, 'LeagueApps Fall 2025: Joshua Rios / 6th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Joshua Rios / 6th Grade Boys'),
  ('8f4378a8-ad1c-43b2-b2c3-912150573673', 127500, 'LeagueApps Fall 2025: Wyatt Feldman / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Wyatt Feldman / 4th Grade Boys'),
  ('61742708-92c2-49bb-b12c-dd912bbd4413', 127500, 'LeagueApps Fall 2025: Henry Graff / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Henry Graff / 4th Grade Boys'),
  ('1ae2ac08-67aa-4ef3-8e1c-ecd065ef4218', 127500, 'LeagueApps Fall 2025: Frankie Schindler / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Frankie Schindler / 4th Grade Boys'),
  ('f30602a6-b7f4-4131-8156-953c0f75673a', 127500, 'LeagueApps Fall 2025: Henry Forman / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Henry Forman / 4th Grade Boys'),
  ('bcac3fe1-a958-44bc-a8b5-5b40a3ce262f', 85000, 'LeagueApps Fall 2025: Parker Richheimer / 4th Grade Boys - Practice Roster', '2025-09-01 12:00:00-04:00'::timestamptz, 'Parker Richheimer / 4th Grade Boys - Practice Roster'),
  ('0896bcd1-4b11-4ccc-a9ce-f03c29eb1d03', 127500, 'LeagueApps Fall 2025: Jake Perkiel / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Jake Perkiel / 4th Grade Boys'),
  ('393eefd0-133e-4b78-84ff-d6fe968e7ece', 127500, 'LeagueApps Fall 2025: Mason Drumheller / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Mason Drumheller / 4th Grade Boys'),
  ('dc8738ff-ef83-4eac-ba0a-e40483db8a5f', 127500, 'LeagueApps Fall 2025: Aubtin Khojasteh / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Aubtin Khojasteh / 4th Grade Boys'),
  ('41121ca9-4aaa-4902-8a1a-44c7544ba49f', 127500, 'LeagueApps Fall 2025: Spencer Clark / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Spencer Clark / 4th Grade Boys'),
  ('f964403c-144b-4916-bf56-0b54b7ec8c6f', 127500, 'LeagueApps Fall 2025: Gabriel Alexander / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Gabriel Alexander / 4th Grade Boys'),
  ('f964403c-144b-4916-bf56-0b54b7ec8c6f', 127500, 'LeagueApps Fall 2025: Lily Alexander / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Lily Alexander / 5th Grade Girls Black'),
  ('69f73a58-eee9-4c55-8ec8-ea8835a537da', 127500, 'LeagueApps Fall 2025: Liam Diller / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Liam Diller / 4th Grade Boys'),
  ('d055c8ce-8f78-46e0-8aaf-59b31914e08d', 127500, 'LeagueApps Fall 2025: Lucas Mandell / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Lucas Mandell / 4th Grade Boys'),
  ('bb3b7cee-b8e3-4603-86cc-8601169df565', 115000, 'LeagueApps Fall 2025: Sofia Dodaro / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Sofia Dodaro / 5th Grade Girls Black'),
  ('51ff3882-22a0-4931-a6e7-010e3073ba36', 127500, 'LeagueApps Fall 2025: Christian Clarke / 4th Grade Boys', '2025-09-01 12:00:00-04:00'::timestamptz, 'Christian Clarke / 4th Grade Boys'),
  ('4740478c-1fa3-43aa-802b-f0147d2ffa38', 72500, 'LeagueApps Fall 2025: Makyla Ingwer / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Makyla Ingwer / 5th Grade Girls Black'),
  ('07532da2-399c-41dc-a3d2-94987f0a6b67', 127500, 'LeagueApps Fall 2025: Kendall Davis / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Kendall Davis / 5th Grade Girls Blue'),
  ('55c4748a-894b-449d-9e87-9935e7c57f1f', 127500, 'LeagueApps Fall 2025: Theodora Beler / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Theodora Beler / 5th Grade Girls Blue'),
  ('901d02ed-0d75-4027-a8a5-2e49a85a1360', 127500, 'LeagueApps Fall 2025: Charlotte Seuss / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Charlotte Seuss / 5th Grade Girls Blue'),
  ('9c40fdb4-38e9-485f-9000-79af6140012f', 127500, 'LeagueApps Fall 2025: Hana Levy / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Hana Levy / 5th Grade Girls Black'),
  ('c564a251-2e13-42fd-b75a-dd8fed38e229', 127500, 'LeagueApps Fall 2025: Maya Seiler / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Maya Seiler / 5th Grade Girls Blue'),
  ('7791172a-1698-4058-8689-62ff33243fa9', 127500, 'LeagueApps Fall 2025: Zoe Neimand / 5th Grade Girls Blue', '2025-09-01 12:00:00-04:00'::timestamptz, 'Zoe Neimand / 5th Grade Girls Blue'),
  ('ec5f4bf1-8510-4b35-963f-5493a7301e26', 127500, 'LeagueApps Fall 2025: Locklyn Yasgur / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Locklyn Yasgur / 5th Grade Girls Black'),
  ('6ba0cd8c-692d-4b52-907a-e32fecbe183d', 63750, 'LeagueApps Fall 2025: Charlie Samaritano / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Charlie Samaritano / 5th Grade Girls Black'),
  ('f6925a45-335f-4ebd-a297-fe3782e4a72d', 127500, 'LeagueApps Fall 2025: Chloe Tolchin / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Chloe Tolchin / 5th Grade Girls Black'),
  ('f5280753-34c6-4924-8779-5c22750f6943', 127500, 'LeagueApps Fall 2025: Demi Stamatakos / 5th Grade Girls Black', '2025-09-01 12:00:00-04:00'::timestamptz, 'Demi Stamatakos / 5th Grade Girls Black')
) t(p1_guardian_id, fee_cents, reference, occurred_at, notes)
JOIN fall_accounts fa ON fa.guardian_id = t.p1_guardian_id::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.financial_transactions WHERE reference = t.reference);

-- Step 6: Verification
DO $$
DECLARE
  fall_acct_count int;
  fall_acct_total_cents bigint;
  fall_txn_count int;
  fall_txn_total_cents bigint;
  new_guardian_count int;
  new_player_count int;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(season_fee_cents), 0)
    INTO fall_acct_count, fall_acct_total_cents
  FROM public.financial_accounts
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND season_id = (SELECT id FROM public.seasons
                     WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
                       AND name = 'Fall 2025');

  SELECT COUNT(*), COALESCE(SUM(amount_cents), 0)
    INTO fall_txn_count, fall_txn_total_cents
  FROM public.financial_transactions ft
  JOIN public.financial_accounts fa ON fa.id = ft.account_id
  WHERE fa.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND fa.season_id = (SELECT id FROM public.seasons
                        WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
                          AND name = 'Fall 2025');

  SELECT COUNT(*) INTO new_guardian_count FROM public.guardians
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

  SELECT COUNT(*) INTO new_player_count FROM public.players
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

  RAISE NOTICE 'POST-MIGRATION STATE:';
  RAISE NOTICE '  Total guardians: %', new_guardian_count;
  RAISE NOTICE '  Total players: %', new_player_count;
  RAISE NOTICE '  Fall 2025 accounts: % ($%)', fall_acct_count, (fall_acct_total_cents/100.0);
  RAISE NOTICE '  Fall 2025 transactions: % ($%)', fall_txn_count, (fall_txn_total_cents/100.0);

  IF fall_acct_count <> 41 THEN
    RAISE EXCEPTION 'Fall 2025 should have 41 accounts, got %', fall_acct_count;
  END IF;
  IF fall_acct_total_cents <> 5360250 THEN
    RAISE EXCEPTION 'Fall 2025 billable should be $53,602.50, got $%', (fall_acct_total_cents/100.0);
  END IF;
  IF fall_txn_count <> 46 THEN
    RAISE EXCEPTION 'Fall 2025 should have 46 transactions, got %', fall_txn_count;
  END IF;
  IF fall_txn_total_cents <> 5360250 THEN
    RAISE EXCEPTION 'Fall 2025 transaction total should be $53,602.50, got $%', (fall_txn_total_cents/100.0);
  END IF;
END $$;
