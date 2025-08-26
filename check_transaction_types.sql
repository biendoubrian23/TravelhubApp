-- Vérifier les types de transaction autorisés
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%transaction_type%';

-- Ou voir la définition de la table
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'balance_transactions' 
AND column_name = 'transaction_type';
