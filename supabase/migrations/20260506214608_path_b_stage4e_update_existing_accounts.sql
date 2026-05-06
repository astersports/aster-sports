-- Stage 4e: UPDATE 42 existing Fall 2025 accounts (add tryout/program fees)
-- Idempotent: skip if any Stage4 transaction already exists for the account
WITH fall_season AS (SELECT id FROM public.seasons WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025'),
     stage4_additions(p1_email, additional_cents) AS (VALUES
       ('esante01@gmail.com', 25000),
       ('leens106@gmail.com', 0),
       ('jacquie.lederman@yahoo.com', 2500),
       ('jujeh54@gmail.com', 2500),
       ('blair.g.jacobs@gmail.com', 5000),
       ('stefanie.forest@gmail.com', 2500),
       ('milano.a9@gmail.com', 2500),
       ('jsachs1@gmail.com', 2500),
       ('korenismd@gmail.com', 2500),
       ('jberk624@gmail.com', 2500),
       ('bdavis59@gmail.com', 2500),
       ('danabrooke1126@gmail.com', 2500),
       ('jackiegfeldman@gmail.com', 5000),
       ('rachelbeatrice@gmail.com', 5000),
       ('lyndie.fasold@gmail.com', 2500),
       ('edina.dodaro@yahoo.com', 2500),
       ('rissa.perkiel@gmail.com', 2500),
       ('nicole.pozzi@gmail.com', 2500),
       ('ashley.a.leblanc@gmail.com', 43000),
       ('jasonmcolombo@gmail.com', 2500),
       ('rmcohen345@gmail.com', 2500),
       ('marisa.richheimer@gmail.com', 2500),
       ('jon.zinman@gmail.com', 2500),
       ('nanachka208@yahoo.com', 2500),
       ('jlevy167@gmail.com', 5000),
       ('jillbaj217@gmail.com', 2500),
       ('andrea.lubel@gmail.com', 2500),
       ('jonathan@omniagroup.nyc', 2500),
       ('cofeetalk@aol.com', 2500),
       ('noradiller@gmail.com', 2500),
       ('mathew.allie.alexander@gmail.com', 5000),
       ('anjella5421@gmail.com', 2500),
       ('spencermandell@gmail.com', 2500),
       ('gabrielle.pretto@gmail.com', 2500),
       ('gali1004@yahoo.com', 2500),
       ('stephanie.leber@gmail.com', 2500),
       ('leyasgur@gmail.com', 2500),
       ('ljrny82@mac.com', 15000),
       ('claudia.reuben@gmail.com', 15000),
       ('alisa.amsterdam@gmail.com', 2500),
       ('lizbeler@gmail.com', 2500),
       ('fsamaritano@hotmail.com', 8750)
     )
UPDATE public.financial_accounts fa
SET season_fee_cents = season_fee_cents + sa.additional_cents
FROM stage4_additions sa
JOIN public.guardians g ON LOWER(g.email) = sa.p1_email
WHERE fa.guardian_id = g.id
  AND fa.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND fa.season_id = (SELECT id FROM fall_season)
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_transactions ft
    WHERE ft.account_id = fa.id
      AND ft.reference LIKE 'LeagueApps Fall 2025 Stage4%'
  );
