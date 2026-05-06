-- Stage 4f2: 25 paid program transactions (camps + group training; skipping Milo $0 second program)
WITH fall_season AS (SELECT id FROM public.seasons WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025'),
     fall_accounts AS (SELECT id, guardian_id FROM public.financial_accounts WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND season_id = (SELECT id FROM fall_season))
INSERT INTO public.financial_transactions (account_id, org_id, transaction_type, amount_cents, payment_method, reference, occurred_at, notes)
SELECT fa.id, 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'payment', t.fee_cents, 'other', t.reference, t.occurred_at, t.notes
FROM (VALUES
  ('17c2ce33-9ff4-45ec-9766-82a0c9801563'::uuid, 17500, 'LeagueApps Fall 2025 Stage4 Program: Shane Moran / Group Training Remaining 3 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Shane Moran / Group Training Remaining 3 Weeks'),
  ('17c2ce33-9ff4-45ec-9766-82a0c9801563'::uuid, 17500, 'LeagueApps Fall 2025 Stage4 Program: Donovan Moran / Group Training 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Donovan Moran / Group Training 5 Weeks'),
  ('17c2ce33-9ff4-45ec-9766-82a0c9801563'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Shane Moran / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Shane Moran / Future Hoopers Camp'),
  ('17c2ce33-9ff4-45ec-9766-82a0c9801563'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Donovan Moran / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Donovan Moran / Future Hoopers Camp'),
  ('17c2ce33-9ff4-45ec-9766-82a0c9801563'::uuid, 17500, 'LeagueApps Fall 2025 Stage4 Program: Donovan Moran / Group Training Remaining 3 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Donovan Moran / Group Training Remaining 3 Weeks'),
  ('8a3309b0-751c-421f-86b5-4f815e245eab'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Mario Dias / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Mario Dias / Future Hoopers Camp'),
  ('13fd4562-6fbd-4b5a-baa8-56fa0314d12a'::uuid, 7500, 'LeagueApps Fall 2025 Stage4 Program: Robert OMahony / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Robert O''Mahony / Future Hoopers Camp'),
  ('7791172a-1698-4058-8689-62ff33243fa9'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Ben Neimand / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Ben Neimand / Future Hoopers Camp'),
  ('901d02ed-0d75-4027-a8a5-2e49a85a1360'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Oliver Seuss / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Oliver Seuss / Future Hoopers Camp'),
  ('d2dce33d-c046-4eab-83fd-fb1ae42e4415'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Grant DeClemente / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Grant DeClemente / Future Hoopers Camp'),
  ('2d29a13a-3223-4600-b9d8-3f9359ac0c08'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Alexander Vanderhaegen / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Alexander Vanderhaegen / Future Hoopers Camp'),
  ('7d4ef55d-e99b-436d-83e0-dc0d778d0c80'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Matteo Alampi / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Matteo Alampi / Future Hoopers Camp'),
  ('9624a733-44be-4c6f-a5a0-c9e8bdec2efb'::uuid, 12500, 'LeagueApps Fall 2025 Stage4 Program: Jason Dombal / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Jason Dombal / Future Hoopers Camp'),
  ('a1975b9a-db64-41ef-bb5a-672f0c83a593'::uuid, 25000, 'LeagueApps Fall 2025 Stage4 Program: Simone Santevecchi / Group Training Any 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Simone Santevecchi / Group Training Any 5 Weeks'),
  ('6ba0cd8c-692d-4b52-907a-e32fecbe183d'::uuid, 6250, 'LeagueApps Fall 2025 Stage4 Program: Milo Samaritano / Future Hoopers Camp', '2025-09-15 12:00:00-04:00'::timestamptz, 'Milo Samaritano / Future Hoopers Camp'),
  ('c8023893-116a-4931-bb27-15642545f49a'::uuid, 40500, 'LeagueApps Fall 2025 Stage4 Program: Cillian LeBlanc / Group Training 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Cillian LeBlanc / Group Training 5 Weeks'),
  ('1d99dac1-deb9-4d1f-b8cc-b8483d4945cd'::uuid, 25000, 'LeagueApps Fall 2025 Stage4 Program: Jonathan Quartuccio / Group Training Any 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Jonathan Quartuccio / Group Training Any 5 Weeks'),
  ('87a96ff0-7ff8-4ecf-8210-0292163a0277'::uuid, 25000, 'LeagueApps Fall 2025 Stage4 Program: Sebastian Bailey / Group Training Any 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Sebastian Bailey / Group Training Any 5 Weeks'),
  ('98477c19-6fe2-4987-b09f-7f5fa890619f'::uuid, 25000, 'LeagueApps Fall 2025 Stage4 Program: Alessio Mignardi / Group Training Any 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Alessio Mignardi / Group Training Any 5 Weeks'),
  ('288c5613-563b-4e7f-9d3f-491773f62ea8'::uuid, 25000, 'LeagueApps Fall 2025 Stage4 Program: Geo Selvaggio / Group Training Any 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Geo Selvaggio / Group Training Any 5 Weeks'),
  ('f3345398-e13e-44b5-9e30-b1e99aed8c7b'::uuid, 45000, 'LeagueApps Fall 2025 Stage4 Program: Joel Sumpman / Group Training 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Joel Sumpman / Group Training 5 Weeks'),
  ('da74b1ed-5632-4fe5-ab67-c1e8c21d8799'::uuid, 42500, 'LeagueApps Fall 2025 Stage4 Program: Logan Satter / Group Training 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Logan Satter / Group Training 5 Weeks'),
  ('13fd4562-6fbd-4b5a-baa8-56fa0314d12a'::uuid, 42500, 'LeagueApps Fall 2025 Stage4 Program: Robert OMahony / Group Training 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Robert O''Mahony / Group Training 5 Weeks'),
  ('13fd4562-6fbd-4b5a-baa8-56fa0314d12a'::uuid, 42500, 'LeagueApps Fall 2025 Stage4 Program: Jeffrey OMahony / Group Training 5 Weeks', '2025-09-15 12:00:00-04:00'::timestamptz, 'Jeffrey O''Mahony / Group Training 5 Weeks')
) t(p1_guardian_id, fee_cents, reference, occurred_at, notes)
JOIN fall_accounts fa ON fa.guardian_id = t.p1_guardian_id::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.financial_transactions WHERE reference = t.reference);
