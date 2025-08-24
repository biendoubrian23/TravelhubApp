-- TravelHub Database Schema
-- À exécuter dans l'éditeur SQL de Supabase

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- Users table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  telephone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'agence')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agencies table
CREATE TABLE public.agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  telephone VARCHAR(20),
  email VARCHAR(100),
  adresse TEXT,
  ville VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trips table
CREATE TABLE public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  ville_depart VARCHAR(50) NOT NULL,
  ville_arrivee VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  heure_dep TIME NOT NULL,
  heure_arr TIME NOT NULL,
  prix INTEGER NOT NULL, -- Prix en FCFA
  is_vip BOOLEAN DEFAULT FALSE,
  places_total INTEGER DEFAULT 50,
  places_disponibles INTEGER DEFAULT 50,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trip services table
CREATE TABLE public.trip_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  wifi BOOLEAN DEFAULT FALSE,
  repas BOOLEAN DEFAULT FALSE,
  clim BOOLEAN DEFAULT TRUE,
  usb BOOLEAN DEFAULT FALSE,
  films BOOLEAN DEFAULT FALSE,
  toilettes BOOLEAN DEFAULT FALSE,
  sieges_inclinables BOOLEAN DEFAULT FALSE,
  espace_jambes BOOLEAN DEFAULT FALSE
);

-- Seat maps table
CREATE TABLE public.seat_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  seat_layout JSONB NOT NULL, -- Configuration des sièges
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  trip_id UUID REFERENCES public.trips(id) NOT NULL,
  seat_numbers INTEGER[] NOT NULL,
  nombre_passagers INTEGER NOT NULL DEFAULT 1,
  prix_total INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_method VARCHAR(20) DEFAULT 'orange_money' CHECK (payment_method IN ('stripe', 'orange_money', 'mtn_momo', 'cash')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  booking_reference VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. Créer une fonction pour synchroniser les utilisateurs automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, telephone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Nom'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Prénom'),
    COALESCE(NEW.raw_user_meta_data->>'telephone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer un trigger qui s'exécute après chaque inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate booking reference function
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_reference := 'TH' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0') || LPAD(NEW.id::TEXT, 8, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking reference
CREATE TRIGGER booking_reference_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_reference();

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Permettre aux utilisateurs de s'insérer automatiquement via le trigger
CREATE POLICY "Enable automatic profile creation" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Agencies policies
CREATE POLICY "Anyone can view agencies" ON public.agencies
  FOR SELECT USING (true);

CREATE POLICY "Agency owners can update their agency" ON public.agencies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create agencies" ON public.agencies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trips policies
CREATE POLICY "Anyone can view active trips" ON public.trips
  FOR SELECT USING (status = 'active');

CREATE POLICY "Agency owners can manage their trips" ON public.trips
  FOR ALL USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE user_id = auth.uid()
    )
  );

-- Trip services policies
CREATE POLICY "Anyone can view trip services" ON public.trip_services
  FOR SELECT USING (true);

CREATE POLICY "Agency owners can manage trip services" ON public.trip_services
  FOR ALL USING (
    trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.agencies a ON t.agency_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Seat maps policies
CREATE POLICY "Anyone can view seat maps" ON public.seat_maps
  FOR SELECT USING (true);

CREATE POLICY "Agency owners can manage seat maps" ON public.seat_maps
  FOR ALL USING (
    trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.agencies a ON t.agency_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Agency owners can view bookings for their trips
CREATE POLICY "Agency owners can view bookings for their trips" ON public.bookings
  FOR SELECT USING (
    trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.agencies a ON t.agency_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Insert sample data
INSERT INTO public.profiles (id, nom, prenom, telephone, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Finexs', 'Voyage', '+237123456789', 'agence'),
  ('00000000-0000-0000-0000-000000000002', 'Garanti', 'Express', '+237987654321', 'agence');

INSERT INTO public.agencies (id, user_id, nom, description, telephone, email, ville) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Finexs Voyage', 'Transport de qualité depuis 20 ans', '+237123456789', 'contact@finexsvoyage.cm', 'Douala'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Garanti Express', 'Votre voyage en toute sécurité', '+237987654321', 'info@garantiexpress.cm', 'Yaoundé');

-- Functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
