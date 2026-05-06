-- Stage 4d: Create 21 NEW Fall 2025 financial_accounts (families not yet on Fall roster)
WITH fall_season AS (SELECT id FROM public.seasons WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025')
INSERT INTO public.financial_accounts (org_id, guardian_id, season_id, season_fee_cents, notes) VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'fa78fd5b-a296-4f76-91a2-ddea4eb23ff1', (SELECT id FROM fall_season), 2500, 'Fall 2025 Stage 4: CJ Cusmano - 6th Boys Tryout ($25)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'ce9a5560-566a-4ab3-8df0-02440b59bf8e', (SELECT id FROM fall_season), 2500, 'Fall 2025 Stage 4: Romy Cooper - 5th Girls Tryout ($25)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '28dc8553-0416-47a2-959d-e3cdb64c001c', (SELECT id FROM fall_season), 2500, 'Fall 2025 Stage 4: Florence Mast - 5th Girls Tryout ($25)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '11d49f69-aee9-4672-b295-29b14e03430e', (SELECT id FROM fall_season), 2500, 'Fall 2025 Stage 4: Jack Gilbert - 6th Boys Tryout ($25)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'c751639a-04d7-4a16-a551-0114cb5b2efb', (SELECT id FROM fall_season), 2500, 'Fall 2025 Stage 4: Chase Kweskin - 4th Boys Tryout ($25)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '3cf2374c-4e5e-4084-8861-4ef31e6b894b', (SELECT id FROM fall_season), 2500, 'Fall 2025 Stage 4: Sylvie Scott - 5th Girls Tryout ($25)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'eaf715e4-4602-4572-a195-fd4210ea3977', (SELECT id FROM fall_season), 2500, 'Fall 2025 Stage 4: Julia Hirsch - 5th Girls Tryout ($25)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '520352be-ce8c-4455-b001-b07458a75cbe', (SELECT id FROM fall_season), 2500, 'Fall 2025 Stage 4: Blake Levey - 5th Girls Tryout ($25)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '17c2ce33-9ff4-45ec-9766-82a0c9801563', (SELECT id FROM fall_season), 77500, 'Fall 2025 Stage 4: Moran family programs ($775 across 5 sessions: 2 camp + 3 group training)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '8a3309b0-751c-421f-86b5-4f815e245eab', (SELECT id FROM fall_season), 12500, 'Fall 2025 Stage 4: Mario Dias - Future Hoopers Camp ($125)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '13fd4562-6fbd-4b5a-baa8-56fa0314d12a', (SELECT id FROM fall_season), 92500, 'Fall 2025 Stage 4: O''Mahony family programs ($925 across Robert camp + Robert+Jeffrey group training)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'd2dce33d-c046-4eab-83fd-fb1ae42e4415', (SELECT id FROM fall_season), 12500, 'Fall 2025 Stage 4: Grant DeClemente - Future Hoopers Camp ($125)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '2d29a13a-3223-4600-b9d8-3f9359ac0c08', (SELECT id FROM fall_season), 12500, 'Fall 2025 Stage 4: Alexander Vanderhaegen - Future Hoopers Camp ($125)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '7d4ef55d-e99b-436d-83e0-dc0d778d0c80', (SELECT id FROM fall_season), 12500, 'Fall 2025 Stage 4: Matteo Alampi - Future Hoopers Camp ($125)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '9624a733-44be-4c6f-a5a0-c9e8bdec2efb', (SELECT id FROM fall_season), 12500, 'Fall 2025 Stage 4: Jason Dombal - Future Hoopers Camp ($125)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '1d99dac1-deb9-4d1f-b8cc-b8483d4945cd', (SELECT id FROM fall_season), 25000, 'Fall 2025 Stage 4: Jonathan Quartuccio - Group Training ($250)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '87a96ff0-7ff8-4ecf-8210-0292163a0277', (SELECT id FROM fall_season), 25000, 'Fall 2025 Stage 4: Sebastian Bailey - Group Training ($250)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '98477c19-6fe2-4987-b09f-7f5fa890619f', (SELECT id FROM fall_season), 25000, 'Fall 2025 Stage 4: Alessio Mignardi - Group Training ($250)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '288c5613-563b-4e7f-9d3f-491773f62ea8', (SELECT id FROM fall_season), 25000, 'Fall 2025 Stage 4: Geo Selvaggio - Group Training ($250)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'f3345398-e13e-44b5-9e30-b1e99aed8c7b', (SELECT id FROM fall_season), 45000, 'Fall 2025 Stage 4: Joel Sumpman - Group Training ($450)'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'da74b1ed-5632-4fe5-ab67-c1e8c21d8799', (SELECT id FROM fall_season), 42500, 'Fall 2025 Stage 4: Logan Satter - Group Training ($425)')
ON CONFLICT (org_id, guardian_id, season_id) DO NOTHING;
