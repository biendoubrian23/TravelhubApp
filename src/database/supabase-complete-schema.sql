-- ============================================================================
-- SCHEMA COMPLET TRAVELHUB AVEC DONNÉES DE TEST
-- ============================================================================

-- Création des types énumérés
CREATE TYPE public.user_role AS ENUM ('client', 'agence', 'admin');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.seat_type AS ENUM ('standard', 'vip', 'premium');
CREATE TYPE public.bus_type AS ENUM ('classique', 'vip', 'premium');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table des utilisateurs
CREATE TABLE public.users (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    phone text,
    role user_role DEFAULT 'client',
    avatar_url text,
    date_of_birth date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des agences de transport
CREATE TABLE public.agencies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    logo_url text,
    phone text NOT NULL,
    email text,
    address text,
    license_number text UNIQUE,
    rating numeric(3,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des voyages
CREATE TABLE public.trips (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
    departure_city text NOT NULL,
    arrival_city text NOT NULL,
    departure_time timestamp with time zone NOT NULL,
    arrival_time timestamp with time zone NOT NULL,
    bus_type bus_type DEFAULT 'classique',
    total_seats integer NOT NULL DEFAULT 40,
    available_seats integer NOT NULL,
    price_fcfa integer NOT NULL,
    description text,
    amenities text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des réservations
CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    passenger_name text NOT NULL,
    passenger_phone text NOT NULL,
    seat_number text NOT NULL,
    total_price_fcfa integer NOT NULL,
    booking_status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method text,
    payment_reference text,
    booking_reference text UNIQUE NOT NULL,
    special_requests text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table des favoris
CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, trip_id)
);

-- Table des plans de sièges
CREATE TABLE public.seat_maps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    seat_number text NOT NULL,
    seat_type seat_type DEFAULT 'standard',
    is_available boolean DEFAULT true,
    price_modifier_fcfa integer DEFAULT 0,
    position_row integer NOT NULL,
    position_column integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(trip_id, seat_number)
);

-- Table des services de voyage
CREATE TABLE public.trip_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    service_name text NOT NULL,
    description text,
    icon_name text,
    is_included boolean DEFAULT true,
    additional_cost_fcfa integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_services ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Utilisateurs peuvent voir leurs propres données" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent modifier leurs propres données" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policies pour agencies
CREATE POLICY "Tout le monde peut voir les agences" ON public.agencies
    FOR SELECT USING (true);

CREATE POLICY "Agences peuvent modifier leurs données" ON public.agencies
    FOR ALL USING (auth.uid() = user_id);

-- Policies pour trips
CREATE POLICY "Tout le monde peut voir les voyages" ON public.trips
    FOR SELECT USING (true);

CREATE POLICY "Agences peuvent gérer leurs voyages" ON public.trips
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.agencies 
            WHERE agencies.id = trips.agency_id 
            AND agencies.user_id = auth.uid()
        )
    );

-- Policies pour bookings
CREATE POLICY "Utilisateurs peuvent voir leurs réservations" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer des réservations" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs réservations" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour favorites
CREATE POLICY "Utilisateurs peuvent voir leurs favoris" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent gérer leurs favoris" ON public.favorites
    FOR ALL USING (auth.uid() = user_id);

-- Policies pour seat_maps
CREATE POLICY "Tout le monde peut voir les plans de sièges" ON public.seat_maps
    FOR SELECT USING (true);

CREATE POLICY "Agences peuvent gérer leurs plans de sièges" ON public.seat_maps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trips 
            JOIN public.agencies ON agencies.id = trips.agency_id
            WHERE trips.id = seat_maps.trip_id 
            AND agencies.user_id = auth.uid()
        )
    );

-- Policies pour trip_services
CREATE POLICY "Tout le monde peut voir les services de voyage" ON public.trip_services
    FOR SELECT USING (true);

CREATE POLICY "Agences peuvent gérer les services de leurs voyages" ON public.trip_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trips 
            JOIN public.agencies ON agencies.id = trips.agency_id
            WHERE trips.id = trip_services.trip_id 
            AND agencies.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client'::user_role)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil utilisateur
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- DONNÉES DE TEST
-- ============================================================================

-- Insertion des agences de test
INSERT INTO public.agencies (id, name, description, logo_url, phone, email, address, license_number, rating, total_reviews, is_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Voyage Express Cameroun', 'Leader du transport inter-urbain au Cameroun avec plus de 20 ans d''expérience', NULL, '+237 677 123 456', 'contact@voyageexpress.cm', 'Avenue Kennedy, Douala', 'AGE001CM', 4.5, 1250, true),
('550e8400-e29b-41d4-a716-446655440002', 'Garantie Express', 'Transport de qualité avec des bus modernes et climatisés', NULL, '+237 678 234 567', 'info@garantieexpress.cm', 'Rue de la Réunification, Yaoundé', 'AGE002CM', 4.2, 890, true),
('550e8400-e29b-41d4-a716-446655440003', 'Finexs Transport', 'Service VIP et classique pour tous vos déplacements', NULL, '+237 679 345 678', 'booking@finexs.cm', 'Carrefour Warda, Douala', 'AGE003CM', 4.0, 567, true),
('550e8400-e29b-41d4-a716-446655440004', 'Central Express', 'Liaisons rapides entre les grandes villes du Cameroun', NULL, '+237 680 456 789', 'info@centralexpress.cm', 'Marché Central, Yaoundé', 'AGE004CM', 3.8, 445, true),
('550e8400-e29b-41d4-a716-446655440005', 'Musango Transport', 'Transport confortable et sécurisé 24h/24', NULL, '+237 681 567 890', 'contact@musango.cm', 'Rond-point Deido, Douala', 'AGE005CM', 4.3, 723, true);

-- Insertion des voyages de test
INSERT INTO public.trips (id, agency_id, departure_city, arrival_city, departure_time, arrival_time, bus_type, total_seats, available_seats, price_fcfa, description, amenities, is_active) VALUES
-- Voyage Express Cameroun
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Douala', 'Yaoundé', '2025-08-04 06:00:00+00', '2025-08-04 09:30:00+00', 'vip', 32, 28, 4500, 'Bus VIP climatisé avec sièges inclinables', ARRAY['WiFi', 'Climatisation', 'Sièges inclinables', 'Boissons'], true),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Yaoundé', 'Douala', '2025-08-04 14:00:00+00', '2025-08-04 17:30:00+00', 'classique', 40, 35, 3500, 'Bus classique confortable et fiable', ARRAY['Climatisation', 'Musique'], true),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Douala', 'Bafoussam', '2025-08-04 07:30:00+00', '2025-08-04 11:00:00+00', 'vip', 32, 30, 5500, 'Liaison directe vers l''Ouest', ARRAY['WiFi', 'Climatisation', 'Collation'], true),

-- Garantie Express
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Yaoundé', 'Douala', '2025-08-04 08:00:00+00', '2025-08-04 11:30:00+00', 'vip', 32, 25, 4800, 'Service premium Garantie Express', ARRAY['WiFi', 'Climatisation', 'Sièges cuir', 'Boissons'], true),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Douala', 'Yaoundé', '2025-08-04 16:00:00+00', '2025-08-04 19:30:00+00', 'classique', 40, 38, 3200, 'Départ en soirée, arrivée confortable', ARRAY['Climatisation'], true),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Yaoundé', 'Bamenda', '2025-08-04 06:30:00+00', '2025-08-04 11:30:00+00', 'vip', 32, 29, 6500, 'Route vers le Nord-Ouest', ARRAY['WiFi', 'Climatisation', 'Collation'], true),

-- Finexs Transport
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Douala', 'Yaoundé', '2025-08-04 05:30:00+00', '2025-08-04 09:00:00+00', 'premium', 28, 26, 5500, 'Bus premium Finexs avec service de luxe', ARRAY['WiFi', 'Climatisation', 'Sièges premium', 'Petit-déjeuner', 'Divertissement'], true),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Yaoundé', 'Douala', '2025-08-04 15:30:00+00', '2025-08-04 19:00:00+00', 'vip', 32, 31, 4200, 'Départ après-midi confortable', ARRAY['WiFi', 'Climatisation', 'Boissons'], true),

-- Central Express
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Douala', 'Yaoundé', '2025-08-04 09:00:00+00', '2025-08-04 12:30:00+00', 'classique', 40, 36, 3000, 'Prix abordable, qualité garantie', ARRAY['Climatisation'], true),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'Yaoundé', 'Bertoua', '2025-08-04 07:00:00+00', '2025-08-04 12:00:00+00', 'vip', 32, 28, 7500, 'Liaison vers l''Est du Cameroun', ARRAY['WiFi', 'Climatisation', 'Collation'], true),

-- Musango Transport
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440005', 'Douala', 'Yaoundé', '2025-08-04 12:00:00+00', '2025-08-04 15:30:00+00', 'vip', 32, 30, 4300, 'Départ midi, service Musango', ARRAY['WiFi', 'Climatisation', 'Musique'], true),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440005', 'Yaoundé', 'Garoua', '2025-08-04 20:00:00+00', '2025-08-05 06:00:00+00', 'vip', 32, 27, 12000, 'Voyage de nuit vers le Nord', ARRAY['WiFi', 'Climatisation', 'Couchettes', 'Repas'], true);

-- Génération des plans de sièges pour tous les voyages
DO $$
DECLARE
    trip_record RECORD;
    seat_num TEXT;
    row_num INTEGER;
    col_num INTEGER;
    seat_type_val seat_type;
    price_mod INTEGER;
BEGIN
    FOR trip_record IN SELECT id, bus_type, total_seats FROM public.trips LOOP
        -- Configuration selon le type de bus
        IF trip_record.bus_type = 'premium' THEN
            -- Bus premium: 28 sièges (2+1 configuration, 7 rangées de 4)
            FOR row_num IN 1..7 LOOP
                FOR col_num IN 1..4 LOOP
                    IF col_num <= 2 THEN
                        seat_num := row_num || CASE col_num WHEN 1 THEN 'A' WHEN 2 THEN 'B' END;
                        seat_type_val := 'premium';
                        price_mod := 1000;
                    ELSE
                        seat_num := row_num || CASE col_num WHEN 3 THEN 'C' WHEN 4 THEN 'D' END;
                        seat_type_val := 'premium';
                        price_mod := 1000;
                    END IF;
                    
                    INSERT INTO public.seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column)
                    VALUES (trip_record.id, seat_num, seat_type_val, true, price_mod, row_num, col_num);
                END LOOP;
            END LOOP;
            
        ELSIF trip_record.bus_type = 'vip' THEN
            -- Bus VIP: 32 sièges (2+2 configuration, 8 rangées)
            FOR row_num IN 1..8 LOOP
                FOR col_num IN 1..4 LOOP
                    seat_num := row_num || CASE col_num WHEN 1 THEN 'A' WHEN 2 THEN 'B' WHEN 3 THEN 'C' WHEN 4 THEN 'D' END;
                    
                    IF row_num <= 2 THEN
                        seat_type_val := 'vip';
                        price_mod := 500;
                    ELSE
                        seat_type_val := 'standard';
                        price_mod := 0;
                    END IF;
                    
                    INSERT INTO public.seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column)
                    VALUES (trip_record.id, seat_num, seat_type_val, true, price_mod, row_num, col_num);
                END LOOP;
            END LOOP;
            
        ELSE
            -- Bus classique: 40 sièges (2+3 configuration, 8 rangées)
            FOR row_num IN 1..8 LOOP
                FOR col_num IN 1..5 LOOP
                    seat_num := row_num || CASE col_num WHEN 1 THEN 'A' WHEN 2 THEN 'B' WHEN 3 THEN 'C' WHEN 4 THEN 'D' WHEN 5 THEN 'E' END;
                    seat_type_val := 'standard';
                    price_mod := 0;
                    
                    INSERT INTO public.seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column)
                    VALUES (trip_record.id, seat_num, seat_type_val, true, price_mod, row_num, col_num);
                END LOOP;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Insertion des services de voyage
INSERT INTO public.trip_services (trip_id, service_name, description, icon_name, is_included, additional_cost_fcfa) VALUES
-- Services pour voyage VIP Voyage Express
('660e8400-e29b-41d4-a716-446655440001', 'WiFi Gratuit', 'Connexion internet haut débit', 'wifi', true, 0),
('660e8400-e29b-41d4-a716-446655440001', 'Climatisation', 'Bus entièrement climatisé', 'snowflake-o', true, 0),
('660e8400-e29b-41d4-a716-446655440001', 'Boissons', 'Boissons fraîches offertes', 'glass', true, 0),
('660e8400-e29b-41d4-a716-446655440001', 'Sièges Inclinables', 'Sièges confortables inclinables', 'bed', true, 0),
('660e8400-e29b-41d4-a716-446655440001', 'Assurance Voyage', 'Couverture assurance complète', 'shield', false, 1000),

-- Services pour voyage classique
('660e8400-e29b-41d4-a716-446655440002', 'Climatisation', 'Bus climatisé', 'snowflake-o', true, 0),
('660e8400-e29b-41d4-a716-446655440002', 'Musique', 'Divertissement musical', 'music', true, 0),
('660e8400-e29b-41d4-a716-446655440002', 'Assurance Voyage', 'Couverture assurance', 'shield', false, 800),

-- Services pour voyage premium Finexs
('660e8400-e29b-41d4-a716-446655440007', 'WiFi Premium', 'Internet haut débit illimité', 'wifi', true, 0),
('660e8400-e29b-41d4-a716-446655440007', 'Petit-déjeuner', 'Repas du matin inclus', 'cutlery', true, 0),
('660e8400-e29b-41d4-a716-446655440007', 'Sièges Cuir Premium', 'Sièges en cuir de luxe', 'star', true, 0),
('660e8400-e29b-41d4-a716-446655440007', 'Divertissement', 'Écrans individuels', 'tv', true, 0),
('660e8400-e29b-41d4-a716-446655440007', 'Service VIP', 'Accueil et service personnalisé', 'user-circle', true, 0);

-- Marquer quelques sièges comme occupés pour simulation réaliste
UPDATE public.seat_maps SET is_available = false 
WHERE trip_id = '660e8400-e29b-41d4-a716-446655440001' 
AND seat_number IN ('1A', '1B', '2C', '3A');

UPDATE public.seat_maps SET is_available = false 
WHERE trip_id = '660e8400-e29b-41d4-a716-446655440004' 
AND seat_number IN ('1A', '1B', '1C', '2A', '2B', '3D', '4C');

UPDATE public.seat_maps SET is_available = false 
WHERE trip_id = '660e8400-e29b-41d4-a716-446655440007' 
AND seat_number IN ('1A', '1B');

-- Mettre à jour les sièges disponibles
UPDATE public.trips SET available_seats = (
    SELECT COUNT(*) FROM public.seat_maps 
    WHERE seat_maps.trip_id = trips.id AND is_available = true
);

COMMIT;
