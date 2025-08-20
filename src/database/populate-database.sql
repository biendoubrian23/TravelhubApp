-- Script pour remplir la base de données avec des trajets variés
-- Supprimer les données existantes et les recréer

-- Vider les tables dans l'ordre correct (à cause des contraintes de clés étrangères)
DELETE FROM trip_services;
DELETE FROM trips;
DELETE FROM agencies;

-- Insérer les agences avec des IDs fixes pour pouvoir les référencer
INSERT INTO agencies (id, name, description, phone, email, address, is_verified, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Finexs Voyage', 'Compagnie de transport premium avec service VIP', '+237 695 123 456', 'contact@finexs.cm', 'Yaoundé, Cameroun', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Garanti Express', 'Transport fiable et ponctuel dans tout le Cameroun', '+237 677 234 567', 'info@garanti.cm', 'Douala, Cameroun', true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Touristique Express', 'Voyages touristiques et transport de passagers', '+237 666 345 678', 'booking@touristique.cm', 'Bamenda, Cameroun', true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'Central Voyage', 'Transport central du Cameroun', '+237 655 456 789', 'central@voyage.cm', 'Bafoussam, Cameroun', true, NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Littoral Express', 'Spécialiste du transport vers le littoral', '+237 644 567 890', 'littoral@express.cm', 'Douala, Cameroun', true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'Nord Transport', 'Transport vers les régions du Nord', '+237 633 678 901', 'nord@transport.cm', 'Garoua, Cameroun', true, NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'Sud Voyage', 'Transport vers les régions du Sud', '+237 622 789 012', 'sud@voyage.cm', 'Ebolowa, Cameroun', true, NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'Est Express', 'Transport vers les régions de l''Est', '+237 611 890 123', 'est@express.cm', 'Bertoua, Cameroun', true, NOW(), NOW());

-- Script pour remplir la base de données avec des trajets variés
-- Supprimer les données existantes et les recréer

-- Vider les tables dans l'ordre correct (à cause des contraintes de clés étrangères)
DELETE FROM trip_services;
DELETE FROM trips;
DELETE FROM agencies;

-- Insérer les agences avec des IDs fixes pour pouvoir les référencer
INSERT INTO agencies (id, name, description, phone, email, address, is_verified, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Finexs Voyage', 'Compagnie de transport premium avec service VIP', '+237 695 123 456', 'contact@finexs.cm', 'Yaoundé, Cameroun', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Garanti Express', 'Transport fiable et ponctuel dans tout le Cameroun', '+237 677 234 567', 'info@garanti.cm', 'Douala, Cameroun', true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Touristique Express', 'Voyages touristiques et transport de passagers', '+237 666 345 678', 'booking@touristique.cm', 'Bamenda, Cameroun', true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'Central Voyage', 'Transport central du Cameroun', '+237 655 456 789', 'central@voyage.cm', 'Bafoussam, Cameroun', true, NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Littoral Express', 'Spécialiste du transport vers le littoral', '+237 644 567 890', 'littoral@express.cm', 'Douala, Cameroun', true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'Nord Transport', 'Transport vers les régions du Nord', '+237 633 678 901', 'nord@transport.cm', 'Garoua, Cameroun', true, NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'Sud Voyage', 'Transport vers les régions du Sud', '+237 622 789 012', 'sud@voyage.cm', 'Ebolowa, Cameroun', true, NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'Est Express', 'Transport vers les régions de l''Est', '+237 611 890 123', 'est@express.cm', 'Bertoua, Cameroun', true, NOW(), NOW());

-- Insérer des trajets pour le 29 juillet 2025
INSERT INTO trips (id, agency_id, departure_city, arrival_city, departure_time, arrival_time, bus_type, price_fcfa, total_seats, available_seats, created_at, updated_at) VALUES
-- Yaoundé - Douala
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Yaoundé', 'Douala', '2025-07-29 06:00:00+00', '2025-07-29 09:30:00+00', 'classique', 3000, 45, 42, NOW(), NOW()),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Yaoundé', 'Douala', '2025-07-29 08:00:00+00', '2025-07-29 11:45:00+00', 'premium', 3800, 40, 35, NOW(), NOW()),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Yaoundé', 'Douala', '2025-07-29 10:30:00+00', '2025-07-29 14:00:00+00', 'vip', 4500, 35, 30, NOW(), NOW()),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Yaoundé', 'Douala', '2025-07-29 14:00:00+00', '2025-07-29 17:30:00+00', 'classique', 3200, 45, 40, NOW(), NOW()),
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Yaoundé', 'Douala', '2025-07-29 16:30:00+00', '2025-07-29 20:15:00+00', 'premium', 3900, 40, 37, NOW(), NOW()),

-- Douala - Yaoundé  
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Douala', 'Yaoundé', '2025-07-29 06:30:00+00', '2025-07-29 10:00:00+00', 'classique', 3000, 45, 43, NOW(), NOW()),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Douala', 'Yaoundé', '2025-07-29 09:00:00+00', '2025-07-29 12:45:00+00', 'vip', 4600, 35, 32, NOW(), NOW()),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Douala', 'Yaoundé', '2025-07-29 12:00:00+00', '2025-07-29 15:30:00+00', 'premium', 3750, 40, 38, NOW(), NOW()),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Douala', 'Yaoundé', '2025-07-29 15:00:00+00', '2025-07-29 18:45:00+00', 'classique', 3100, 45, 41, NOW(), NOW()),

-- Yaoundé - Bamenda
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Yaoundé', 'Bamenda', '2025-07-29 07:00:00+00', '2025-07-29 12:30:00+00', 'premium', 4200, 40, 36, NOW(), NOW()),
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Yaoundé', 'Bamenda', '2025-07-29 09:30:00+00', '2025-07-29 15:00:00+00', 'classique', 3800, 45, 39, NOW(), NOW()),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Yaoundé', 'Bamenda', '2025-07-29 13:00:00+00', '2025-07-29 18:45:00+00', 'vip', 5200, 35, 28, NOW(), NOW()),

-- Trajets pour le 30 juillet 2025
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Yaoundé', 'Douala', '2025-07-30 07:00:00+00', '2025-07-30 10:30:00+00', 'classique', 3000, 45, 44, NOW(), NOW()),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Douala', 'Yaoundé', '2025-07-30 08:30:00+00', '2025-07-30 12:00:00+00', 'premium', 3750, 40, 36, NOW(), NOW()),
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Yaoundé', 'Bafoussam', '2025-07-30 09:00:00+00', '2025-07-30 13:00:00+00', 'classique', 3500, 45, 40, NOW(), NOW()),
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'Douala', 'Kribi', '2025-07-30 10:00:00+00', '2025-07-30 12:30:00+00', 'premium', 2800, 40, 38, NOW(), NOW()),

-- Trajets pour le 31 juillet 2025
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Yaoundé', 'Douala', '2025-07-31 06:30:00+00', '2025-07-31 10:00:00+00', 'vip', 4500, 35, 33, NOW(), NOW()),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Douala', 'Bamenda', '2025-07-31 07:30:00+00', '2025-07-31 12:00:00+00', 'premium', 4300, 40, 35, NOW(), NOW()),
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Yaoundé', 'Garoua', '2025-07-31 08:00:00+00', '2025-07-31 16:30:00+00', 'classique', 6000, 45, 42, NOW(), NOW()),
(gen_random_uuid(), '88888888-8888-8888-8888-888888888888', 'Yaoundé', 'Bertoua', '2025-07-31 09:00:00+00', '2025-07-31 15:00:00+00', 'premium', 5200, 40, 37, NOW(), NOW()),

-- Trajets pour le 1er août 2025
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Yaoundé', 'Douala', '2025-08-01 06:00:00+00', '2025-08-01 09:45:00+00', 'classique', 3100, 45, 41, NOW(), NOW()),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Douala', 'Yaoundé', '2025-08-01 08:00:00+00', '2025-08-01 11:30:00+00', 'premium', 3800, 40, 38, NOW(), NOW()),
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Bafoussam', 'Yaoundé', '2025-08-01 10:00:00+00', '2025-08-01 14:00:00+00', 'classique', 3400, 45, 43, NOW(), NOW()),
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'Ebolowa', 'Yaoundé', '2025-08-01 11:00:00+00', '2025-08-01 13:00:00+00', 'premium', 2600, 40, 39, NOW(), NOW()),

-- Trajets pour le 2 août 2025
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Yaoundé', 'Douala', '2025-08-02 07:00:00+00', '2025-08-02 10:30:00+00', 'vip', 4600, 35, 31, NOW(), NOW()),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Douala', 'Buea', '2025-08-02 08:30:00+00', '2025-08-02 10:00:00+00', 'classique', 2200, 45, 44, NOW(), NOW()),
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Bamenda', 'Yaoundé', '2025-08-02 09:00:00+00', '2025-08-02 14:30:00+00', 'premium', 4100, 40, 36, NOW(), NOW()),
(gen_random_uuid(), '88888888-8888-8888-8888-888888888888', 'Bertoua', 'Yaoundé', '2025-08-02 10:00:00+00', '2025-08-02 16:00:00+00', 'classique', 5000, 45, 40, NOW(), NOW()),

-- Trajets pour le 3 août 2025 (date actuelle)
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Yaoundé', 'Douala', '2025-08-03 06:30:00+00', '2025-08-03 10:00:00+00', 'classique', 3000, 45, 43, NOW(), NOW()),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Douala', 'Yaoundé', '2025-08-03 07:30:00+00', '2025-08-03 11:15:00+00', 'vip', 4700, 35, 32, NOW(), NOW()),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Yaoundé', 'Bamenda', '2025-08-03 08:00:00+00', '2025-08-03 13:30:00+00', 'premium', 4200, 40, 37, NOW(), NOW()),
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Douala', 'Bafoussam', '2025-08-03 09:30:00+00', '2025-08-03 12:30:00+00', 'classique', 3600, 45, 42, NOW(), NOW()),
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'Kribi', 'Douala', '2025-08-03 11:00:00+00', '2025-08-03 13:30:00+00', 'premium', 2700, 40, 38, NOW(), NOW()),

-- Trajets pour le 4 août 2025
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Yaoundé', 'Douala', '2025-08-04 06:00:00+00', '2025-08-04 09:45:00+00', 'premium', 3900, 40, 35, NOW(), NOW()),
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Garoua', 'Yaoundé', '2025-08-04 07:00:00+00', '2025-08-04 15:30:00+00', 'classique', 6100, 45, 41, NOW(), NOW()),
(gen_random_uuid(), '88888888-8888-8888-8888-888888888888', 'Yaoundé', 'Ebolowa', '2025-08-04 10:00:00+00', '2025-08-04 12:00:00+00', 'premium', 2550, 40, 39, NOW(), NOW()),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Douala', 'Yaoundé', '2025-08-04 14:00:00+00', '2025-08-04 17:30:00+00', 'classique', 3150, 45, 40, NOW(), NOW()),

-- Trajets pour le 5 août 2025
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Yaoundé', 'Douala', '2025-08-05 08:00:00+00', '2025-08-05 11:45:00+00', 'vip', 4500, 35, 33, NOW(), NOW()),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Buea', 'Douala', '2025-08-05 09:00:00+00', '2025-08-05 10:30:00+00', 'classique', 2100, 45, 44, NOW(), NOW()),
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Yaoundé', 'Bafoussam', '2025-08-05 10:30:00+00', '2025-08-05 14:30:00+00', 'premium', 3700, 40, 36, NOW(), NOW()),
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'Douala', 'Kribi', '2025-08-05 12:00:00+00', '2025-08-05 14:30:00+00', 'classique', 2600, 45, 43, NOW(), NOW());

-- Ajouter des services pour les trajets (trip_services)
-- Services pour quelques trajets VIP et Premium pour rendre l'app plus réaliste

-- Services pour les trajets VIP (WiFi + Climatisation + Repas + Divertissement)
INSERT INTO trip_services (id, trip_id, service_name, description, icon_name, is_included, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'WiFi gratuit',
    'Connexion Internet haut débit',
    'wifi',
    true,
    NOW()
FROM trips t WHERE t.bus_type = 'vip';

INSERT INTO trip_services (id, trip_id, service_name, description, icon_name, is_included, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'Climatisation',
    'Air conditionné pour votre confort',
    'snow',
    true,
    NOW()
FROM trips t WHERE t.bus_type = 'vip';

INSERT INTO trip_services (id, trip_id, service_name, description, icon_name, is_included, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'Repas inclus',
    'Collation et boisson offerte',
    'restaurant',
    true,
    NOW()
FROM trips t WHERE t.bus_type = 'vip';

INSERT INTO trip_services (id, trip_id, service_name, description, icon_name, is_included, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'Divertissement',
    'Écrans individuels avec films',
    'tv',
    true,
    NOW()
FROM trips t WHERE t.bus_type = 'vip';

-- Services pour les trajets Premium (WiFi + Climatisation + parfois Repas)
INSERT INTO trip_services (id, trip_id, service_name, description, icon_name, is_included, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'WiFi gratuit',
    'Connexion Internet disponible',
    'wifi',
    true,
    NOW()
FROM trips t WHERE t.bus_type = 'premium';

INSERT INTO trip_services (id, trip_id, service_name, description, icon_name, is_included, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'Climatisation',
    'Air conditionné',
    'snow',
    true,
    NOW()
FROM trips t WHERE t.bus_type = 'premium';

-- Repas seulement pour certains trajets premium (trajets longs)
INSERT INTO trip_services (id, trip_id, service_name, description, icon_name, is_included, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'Collation',
    'Rafraîchissement offert',
    'restaurant',
    true,
    NOW()
FROM trips t 
WHERE t.bus_type = 'premium' 
AND (
    (t.departure_city = 'Yaoundé' AND t.arrival_city IN ('Garoua', 'Bertoua', 'Bamenda')) 
    OR (t.departure_city IN ('Garoua', 'Bertoua', 'Bamenda') AND t.arrival_city = 'Yaoundé')
    OR (t.departure_city = 'Douala' AND t.arrival_city = 'Bamenda')
    OR (t.departure_city = 'Bamenda' AND t.arrival_city = 'Douala')
);

-- Services basiques pour les trajets classiques (seulement Climatisation)
INSERT INTO trip_services (id, trip_id, service_name, description, icon_name, is_included, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'Climatisation',
    'Air conditionné',
    'snow',
    true,
    NOW()
FROM trips t WHERE t.bus_type = 'classique';

-- TEMPORAIRE : Commenter les seat_maps en cas d'erreur de structure
-- Décommenter après vérification de la structure de la table

-- DELETE FROM seat_maps;

/*
-- Ajouter des plans de sièges (seat_maps) pour différents types de bus
-- Plan pour bus classique (45 places) - 5 colonnes, 9 rangées
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    (r.row_num - 1) * 5 + c.col_num as seat_number,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 5 THEN 'window'
        WHEN c.col_num = 2 OR c.col_num = 4 THEN 'aisle'
        ELSE 'middle'
    END as seat_type,
    (RANDOM() > 0.2) as is_available, -- 80% des sièges disponibles
    0 as price_modifier_fcfa, -- Pas de supplément pour les sièges classiques
    r.row_num,
    c.col_num,
    NOW()
FROM trips t
CROSS JOIN generate_series(1, 9) as r(row_num)
CROSS JOIN generate_series(1, 5) as c(col_num)
WHERE t.bus_type = 'classique';

-- Plan pour bus premium (40 places) - 4 colonnes, 10 rangées  
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at)
SELECT 
    gen_random_uuid(),
    t.id,
    (r.row_num - 1) * 4 + c.col_num as seat_number,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 4 THEN 'window'
        ELSE 'aisle'
    END as seat_type,
    (RANDOM() > 0.15) as is_available, -- 85% des sièges disponibles
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 4 THEN 500 -- Supplément fenêtre
        ELSE 0
    END as price_modifier_fcfa,
    r.row_num,
    c.col_num,
    NOW()
FROM trips t
CROSS JOIN generate_series(1, 10) as r(row_num)
CROSS JOIN generate_series(1, 4) as c(col_num)
WHERE t.bus_type = 'premium';

-- Plan pour bus VIP (35 places) - 5 colonnes, 7 rangées (configuration 2+1+2)
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at)
SELECT 
    gen_random_uuid(),
    t.id,
    (r.row_num - 1) * 5 + c.col_num as seat_number,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 5 THEN 'window'
        WHEN c.col_num = 3 THEN 'premium' -- Siège central VIP
        ELSE 'aisle'
    END as seat_type,
    (RANDOM() > 0.1) as is_available, -- 90% des sièges disponibles
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 5 THEN 1000 -- Supplément fenêtre VIP
        WHEN c.col_num = 3 THEN 1500 -- Supplément siège central premium
        ELSE 500 -- Supplément couloir
    END as price_modifier_fcfa,
    r.row_num,
    c.col_num,
    NOW()
FROM trips t
CROSS JOIN generate_series(1, 7) as r(row_num)
CROSS JOIN generate_series(1, 5) as c(col_num)
WHERE t.bus_type = 'vip';
*/

-- Afficher un résumé des données créées
SELECT 
    COUNT(*) as total_trajets,
    COUNT(DISTINCT CONCAT(departure_city, ' -> ', arrival_city)) as routes_uniques,
    COUNT(DISTINCT CAST(departure_time AS DATE)) as jours_couverts,
    MIN(CAST(departure_time AS DATE)) as premiere_date,
    MAX(CAST(departure_time AS DATE)) as derniere_date,
    COUNT(CASE WHEN bus_type = 'vip' THEN 1 END) as trajets_vip,
    COUNT(CASE WHEN bus_type = 'premium' THEN 1 END) as trajets_premium,
    ROUND(AVG(price_fcfa)) as prix_moyen
FROM trips;

-- Afficher les trajets par date pour vérification
SELECT 
    CAST(departure_time AS DATE) as date_voyage,
    COUNT(*) as nb_trajets,
    COUNT(DISTINCT CONCAT(departure_city, ' -> ', arrival_city)) as routes_ce_jour
FROM trips 
GROUP BY CAST(departure_time AS DATE)
ORDER BY CAST(departure_time AS DATE);
