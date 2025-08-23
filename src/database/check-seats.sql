-- Script de vérification des sièges pour diagnostiquer le problème
-- À exécuter dans Supabase SQL Editor

-- 1. Voir les types de bus et leurs sièges
SELECT 
    t.bus_type,
    t.id as trip_id,
    COUNT(sm.id) as total_seats,
    MIN(sm.seat_number) as premier_siege,
    MAX(sm.seat_number) as dernier_siege,
    ARRAY_AGG(sm.seat_number ORDER BY LENGTH(sm.seat_number), sm.seat_number) as exemples_sieges
FROM trips t
LEFT JOIN seat_maps sm ON t.id = sm.trip_id
GROUP BY t.id, t.bus_type
ORDER BY t.bus_type;

-- 2. Vérifier spécifiquement les bus classiques
SELECT 
    seat_number,
    seat_type,
    position_row,
    position_column
FROM seat_maps sm
JOIN trips t ON sm.trip_id = t.id
WHERE t.bus_type = 'classique'
LIMIT 20;

-- 3. Compter les sièges par type de numérotation
SELECT 
    t.bus_type,
    CASE 
        WHEN sm.seat_number ~ '^[0-9]+$' THEN 'Numéros simples'
        WHEN sm.seat_number ~ '^[0-9]+[A-Z]$' THEN 'Numéros avec lettres'
        ELSE 'Autre format'
    END as format_numerotation,
    COUNT(*) as nombre_sieges
FROM trips t
JOIN seat_maps sm ON t.id = sm.trip_id
GROUP BY t.bus_type, format_numerotation
ORDER BY t.bus_type, format_numerotation;
