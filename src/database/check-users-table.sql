-- Script pour vérifier la structure de la table users
-- Exécuter dans Supabase SQL Editor pour voir les colonnes existantes

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Si certaines colonnes manquent, utilisez ces commandes :

-- Pour ajouter la colonne role si elle n'existe pas :
-- ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'client';

-- Pour ajouter la colonne is_active si elle n'existe pas :
-- ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Pour ajouter la colonne last_login si elle n'existe pas :
-- ALTER TABLE users ADD COLUMN last_login TIMESTAMP;

-- Pour ajouter la colonne phone si elle n'existe pas :
-- ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Pour ajouter la colonne ville si elle n'existe pas :
-- ALTER TABLE users ADD COLUMN ville VARCHAR(100);

-- Pour ajouter la colonne avatar_url si elle n'existe pas :
-- ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Pour ajouter la colonne date_of_birth si elle n'existe pas :
-- ALTER TABLE users ADD COLUMN date_of_birth DATE;
