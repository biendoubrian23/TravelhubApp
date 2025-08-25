-- Script de création de la table invoices pour TravelHub
-- Exécuter ce script dans votre console Supabase SQL

-- Créer la table invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    -- Champs principaux
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    
    -- Montants
    amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'FCFA',
    
    -- Statut
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid', 'cancelled')),
    
    -- Chemin du fichier PDF
    file_path TEXT,
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Métadonnées JSON pour flexibilité
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_generated_at ON public.invoices(generated_at DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurer la sécurité RLS (Row Level Security)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne peuvent voir que leurs propres factures
CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent insérer que leurs propres factures
CREATE POLICY "Users can insert their own invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent modifier que leurs propres factures
CREATE POLICY "Users can update their own invoices" ON public.invoices
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent supprimer que leurs propres factures
CREATE POLICY "Users can delete their own invoices" ON public.invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour générer un numéro de facture automatique
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    sequence_num INT;
    invoice_num TEXT;
BEGIN
    -- Format YYYY-MM
    year_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Trouver le prochain numéro de séquence pour ce mois
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(invoice_number FROM 'TH-' || year_month || '-([0-9]+)') 
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM public.invoices 
    WHERE invoice_number LIKE 'TH-' || year_month || '-%';
    
    -- Formater le numéro avec zéros de padding
    invoice_num := 'TH-' || year_month || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de facture si vide
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number_trigger ON public.invoices;
CREATE TRIGGER set_invoice_number_trigger
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Insérer quelques exemples de factures pour les tests (optionnel)
-- Décommentez les lignes suivantes si vous souhaitez des données de test

/*
INSERT INTO public.invoices (
    user_id, 
    booking_id, 
    amount, 
    tax_amount, 
    total_amount,
    status,
    metadata
) VALUES 
-- Remplacez ces UUIDs par des IDs réels de votre base de données
(
    '00000000-0000-0000-0000-000000000000', -- Remplacer par un user_id réel
    '00000000-0000-0000-0000-000000000000', -- Remplacer par un booking_id réel
    15000,
    2800,
    17800,
    'generated',
    '{
        "booking_reference": "TH001234",
        "passenger_name": "Test User", 
        "trip_details": {
            "departure": "Douala",
            "arrival": "Yaoundé",
            "date": "2025-01-15T08:00:00.000Z",
            "bus_type": "vip",
            "seat_number": "A12",
            "agency": "TravelHub"
        },
        "payment_method": "Orange Money"
    }'::jsonb
);
*/

-- Vérification de la création
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Afficher la structure de la table créée
\d public.invoices;
