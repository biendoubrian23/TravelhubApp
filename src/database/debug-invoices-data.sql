-- Script de débogage pour analyser le contenu des factures
-- Exécuter dans Supabase SQL Editor pour voir le contenu exact

-- 1. Voir toutes les factures avec leurs détails
SELECT 
    id,
    invoice_number,
    booking_id,
    trip_details,
    payment_details,
    customer_name,
    total_amount,
    currency,
    status,
    created_at
FROM public.invoices 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Voir les réservations liées aux factures
SELECT 
    i.invoice_number,
    i.booking_id,
    b.booking_reference,
    b.selected_seats,
    b.departure,
    b.arrival,
    b.departure_date,
    b.departure_time,
    b.total_price,
    b.payment_method
FROM public.invoices i
LEFT JOIN public.bookings b ON i.booking_id = b.id
ORDER BY i.created_at DESC
LIMIT 10;

-- 3. Voir les voyages liés aux réservations
SELECT 
    i.invoice_number,
    b.booking_reference,
    b.selected_seats,
    t.departure_city,
    t.arrival_city,
    t.departure_date,
    t.departure_time,
    t.bus_type,
    t.price
FROM public.invoices i
LEFT JOIN public.bookings b ON i.booking_id = b.id
LEFT JOIN public.trips t ON b.trip_id = t.id
ORDER BY i.created_at DESC
LIMIT 10;

-- 4. Compter les factures par type de problème
SELECT 
    CASE 
        WHEN booking_id IS NULL THEN 'Pas de booking_id'
        WHEN trip_details IS NULL THEN 'Pas de trip_details'
        WHEN trip_details->>'seat_number' = 'A12' THEN 'Siège par défaut (A12)'
        WHEN trip_details->>'bus_type' = 'Classique' THEN 'Bus Classique (ancien)'
        WHEN trip_details->>'bus_type' = 'Standard' THEN 'Bus Standard (nouveau)'
        WHEN trip_details->>'bus_type' = 'VIP' THEN 'Bus VIP'
        ELSE 'Autres problèmes'
    END as probleme,
    COUNT(*) as nombre
FROM public.invoices
GROUP BY 
    CASE 
        WHEN booking_id IS NULL THEN 'Pas de booking_id'
        WHEN trip_details IS NULL THEN 'Pas de trip_details'
        WHEN trip_details->>'seat_number' = 'A12' THEN 'Siège par défaut (A12)'
        WHEN trip_details->>'bus_type' = 'Classique' THEN 'Bus Classique (ancien)'
        WHEN trip_details->>'bus_type' = 'Standard' THEN 'Bus Standard (nouveau)'
        WHEN trip_details->>'bus_type' = 'VIP' THEN 'Bus VIP'
        ELSE 'Autres problèmes'
    END
ORDER BY nombre DESC;
