-- Script pour supprimer toutes les tables existantes dans Supabase
-- Exécuter ce script dans l'éditeur SQL de Supabase avant de créer les nouvelles tables

-- Supprimer les triggers d'abord
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Supprimer les policies RLS
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs propres données" ON public.users;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leurs propres données" ON public.users;
DROP POLICY IF EXISTS "Tout le monde peut voir les agences" ON public.agencies;
DROP POLICY IF EXISTS "Agences peuvent modifier leurs données" ON public.agencies;
DROP POLICY IF EXISTS "Tout le monde peut voir les voyages" ON public.trips;
DROP POLICY IF EXISTS "Agences peuvent gérer leurs voyages" ON public.trips;
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs réservations" ON public.bookings;
DROP POLICY IF EXISTS "Utilisateurs peuvent créer des réservations" ON public.bookings;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leurs réservations" ON public.bookings;
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs favoris" ON public.favorites;
DROP POLICY IF EXISTS "Utilisateurs peuvent gérer leurs favoris" ON public.favorites;
DROP POLICY IF EXISTS "Tout le monde peut voir les plans de sièges" ON public.seat_maps;
DROP POLICY IF EXISTS "Agences peuvent gérer leurs plans de sièges" ON public.seat_maps;
DROP POLICY IF EXISTS "Tout le monde peut voir les services de voyage" ON public.trip_services;
DROP POLICY IF EXISTS "Agences peuvent gérer les services de leurs voyages" ON public.trip_services;

-- Supprimer les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS public.trip_services CASCADE;
DROP TABLE IF EXISTS public.seat_maps CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Supprimer les enums
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.booking_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.seat_type CASCADE;
DROP TYPE IF EXISTS public.bus_type CASCADE;

COMMIT;
