# 🚀 Guide Rapide - Création Table Invoices

## ⚡ Étapes Urgentes pour Résoudre l'Erreur

### 1. **Aller dans Supabase Dashboard**
```
1. Ouvrir https://supabase.com/dashboard
2. Sélectionner ton projet TravelHub
3. Aller dans "SQL Editor"
```

### 2. **Exécuter le Script SQL**
```sql
-- Copier-coller ce script complet dans SQL Editor

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
    trip_details JSONB,
    payment_details JSONB,
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

-- Politiques RLS pour la sécurité
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour générer automatiquement le numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    counter INTEGER;
    invoice_num TEXT;
BEGIN
    year_suffix := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
    SELECT COUNT(*) + 1 INTO counter FROM public.invoices WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
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

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

COMMIT;
```

### 3. **Cliquer sur "RUN" dans Supabase**

### 4. **Vérifier la Création**
```sql
-- Tester avec cette requête pour vérifier
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;
```

## 🎯 **Après Création de la Table**

L'erreur `Could not find a relationship between 'invoices' and 'bookings'` sera résolue car :

✅ **Table invoices** existera  
✅ **Clé étrangère** booking_id → bookings(id) sera configurée  
✅ **Relations Supabase** seront détectées automatiquement  
✅ **Joins SQL** fonctionneront  

## 📱 **Test Immédiat**

Après création de la table :
1. **Redémarrer l'app**
2. **Aller dans Profil > Mes Factures**
3. **Résultat attendu** : "Aucune facture disponible" (au lieu de l'erreur)

## ⚠️ **Si Problème Persiste**

Vérifier dans Supabase Dashboard :
```
1. Database > Tables
2. Chercher "invoices" 
3. Vérifier que la table existe
4. Onglet "Relationships" : vérifier relation avec bookings
```

**Cette étape est OBLIGATOIRE avant de pouvoir utiliser le système de factures !** 🚀
