-- Configuration complète de la table invoices pour TravelHub
-- Ce script crée la table, configure la sécurité RLS et ajoute les politiques

-- Suppression et recréation de la table invoices
DROP TABLE IF EXISTS public.invoices CASCADE;

-- Création de la table invoices
CREATE TABLE public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'FCFA',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'sent', 'cancelled')),
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    file_path TEXT,
    file_url TEXT,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    trip_details JSONB, -- Détails du voyage (départ, arrivée, date, etc.)
    payment_details JSONB, -- Détails du paiement (méthode, référence, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date DESC);

-- Activation de Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;

-- Politiques RLS pour la sécurité
-- Les utilisateurs peuvent voir leurs propres factures
CREATE POLICY "Users can view own invoices"
    ON public.invoices
    FOR SELECT
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres factures
CREATE POLICY "Users can insert own invoices"
    ON public.invoices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres factures
CREATE POLICY "Users can update own invoices"
    ON public.invoices
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres factures
CREATE POLICY "Users can delete own invoices"
    ON public.invoices
    FOR DELETE
    USING (auth.uid() = user_id);

-- Fonction pour générer automatiquement le numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    counter INTEGER;
    invoice_num TEXT;
BEGIN
    -- Obtenir les 2 derniers chiffres de l'année
    year_suffix := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
    
    -- Compter le nombre de factures créées cette année
    SELECT COUNT(*) + 1 
    INTO counter
    FROM public.invoices 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    -- Générer le numéro de facture au format FAC-YY-NNNN
    invoice_num := 'FAC-' || year_suffix || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de facture
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON public.invoices;
CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_invoices_updated_at ON public.invoices;
CREATE TRIGGER trigger_update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ajout de commentaires pour documentation
COMMENT ON TABLE public.invoices IS 'Table des factures générées automatiquement pour chaque réservation';
COMMENT ON COLUMN public.invoices.invoice_number IS 'Numéro de facture unique généré automatiquement (FAC-YY-NNNN)';
COMMENT ON COLUMN public.invoices.status IS 'Statut de la facture: pending, paid, sent, cancelled';
COMMENT ON COLUMN public.invoices.trip_details IS 'Détails du voyage en format JSON';
COMMENT ON COLUMN public.invoices.payment_details IS 'Détails du paiement en format JSON';

-- Test d'insertion pour vérifier le bon fonctionnement
-- (Cette section sera commentée en production)
/*
INSERT INTO public.invoices (
    user_id,
    booking_id,
    total_amount,
    customer_name,
    customer_email,
    customer_phone,
    trip_details,
    payment_details
) VALUES (
    auth.uid(), -- Remplacer par un UUID valide lors du test
    gen_random_uuid(),
    25000.00,
    'Test User',
    'test@example.com',
    '+237600000000',
    '{"departure": "Yaoundé", "arrival": "Douala", "date": "2024-01-15", "time": "08:00"}'::jsonb,
    '{"method": "Orange Money", "reference": "OM123456789"}'::jsonb
);
*/

-- Vérification finale
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;

-- Affichage des politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'invoices';

COMMIT;
