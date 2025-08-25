-- Script de correction pour augmenter la taille du champ currency
-- Exécuter dans Supabase SQL Editor si vous préférez utiliser 'FCFA' au lieu de 'XAF'

-- Option 1: Augmenter la taille du champ currency
ALTER TABLE public.invoices 
ALTER COLUMN currency TYPE VARCHAR(5);

-- Option 2: Changer la valeur par défaut pour utiliser le code ISO
UPDATE public.invoices 
SET currency = 'XAF' 
WHERE currency = 'FCFA';

-- Changer la valeur par défaut pour les futures insertions
ALTER TABLE public.invoices 
ALTER COLUMN currency SET DEFAULT 'XAF';

-- Vérification
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'currency';
