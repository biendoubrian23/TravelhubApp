# Database Scripts

Ce dossier contient tous les scripts SQL pour la configuration et la gestion de la base de données Supabase.

## Scripts de schéma
- `supabase-schema.sql` - Schéma principal de la base de données
- `supabase-complete-schema.sql` - Schéma complet avec toutes les tables
- `supabase-cleanup.sql` - Script de nettoyage de la base de données

## Scripts de population
- `populate-database.sql` - Population initiale des données
- `populate-seat-maps.sql` - Population des plans de sièges
- `populate-seat-maps-fixed.sql` - Version corrigée des plans de sièges
- `populate-seat-maps-final.sql` - Version finale des plans de sièges

## Scripts de maintenance
- `fix-trigger.sql` - Correction des triggers
- `create-user.sql` - Création d'utilisateurs
- `check-enum.sql` - Vérification des énumérations
- `discover-enum.sql` - Découverte des énumérations
- `test-seat-types.sql` - Test des types de sièges

## Utilisation
Exécutez ces scripts dans l'ordre approprié dans votre interface Supabase ou via l'API SQL.
