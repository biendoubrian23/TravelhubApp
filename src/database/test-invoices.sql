-- Script pour créer des factures de test
-- Exécuter APRÈS avoir créé une réservation dans l'application

-- 1. D'abord, trouvez un user_id et booking_id réels
SELECT 
    u.id as user_id,
    u.email,
    b.id as booking_id,
    b.booking_reference,
    b.total_price_fcfa
FROM auth.users u
LEFT JOIN public.bookings b ON u.id = b.user_id
WHERE u.email = 'votre-email@example.com' -- Remplacez par votre email
LIMIT 1;

-- 2. Ensuite, insérez une facture de test (remplacez les UUIDs)
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
(
    'REMPLACER-PAR-USER-ID-REEL', 
    'REMPLACER-PAR-BOOKING-ID-REEL', 
    15000,
    2885,
    17885,
    'generated',
    '{
        "booking_reference": "TH001234",
        "passenger_name": "Test User", 
        "trip_details": {
            "departure": "Douala",
            "arrival": "Yaoundé",
            "date": "2025-08-25T08:00:00.000Z",
            "bus_type": "vip",
            "seat_number": "A12",
            "agency": "TravelHub"
        },
        "payment_method": "Orange Money"
    }'::jsonb
);
*/

-- 3. Vérifier que la facture a été créée
SELECT 
    invoice_number,
    total_amount,
    currency,
    status,
    generated_at,
    metadata->>'booking_reference' as booking_ref
FROM public.invoices 
ORDER BY generated_at DESC 
LIMIT 5;
