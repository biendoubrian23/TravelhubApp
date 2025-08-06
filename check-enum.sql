-- Script pour vérifier l'enum seat_type et corriger les valeurs

-- Vérifier les valeurs de l'enum seat_type
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'seat_type'
ORDER BY e.enumsortorder;
