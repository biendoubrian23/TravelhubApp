// Test simple pour les factures
// Vous pouvez exécuter cette fonction depuis n'importe quel écran pour créer une facture de test

import { supabase } from '../services/supabase';
import invoiceService from '../services/invoiceService';

import { supabase } from '../services/supabase';
import { invoiceService } from '../services/invoiceService';

// Test simple avec données directes dans booking
export const createTestInvoiceSimple = async (userId) => {
  try {
    console.log('🧪 Création d\'une facture de test simple (sans relation trips)...');
    
    // Données de test directement dans le booking
    const testBookingData = {
      user_id: userId,
      booking_reference: `SIMPLE-${Date.now()}`,
      departure: 'Douala',
      arrival: 'Yaoundé', 
      departure_date: new Date().toISOString().split('T')[0],
      departure_time: '14:30',
      selected_seats: 'A15, A16, B12', // 3 sièges
      total_price: 22500,
      payment_method: 'Mobile Money',
      status: 'confirmed',
      busType: 'VIP' // Type de bus directement dans les données
    };

    console.log('📝 Insertion de la réservation simple:', testBookingData);
    
    // Insérer la réservation dans la base de données
    const { data: bookingInserted, error: bookingError } = await supabase
      .from('bookings')
      .insert([testBookingData])
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Erreur insertion réservation:', bookingError);
      throw bookingError;
    }

    console.log('✅ Réservation simple créée:', bookingInserted);

    // Créer la facture avec les données complètes
    const invoice = await invoiceService.createInvoice(
      bookingInserted,
      {
        full_name: 'Utilisateur Test',
        email: 'test@example.com',
        phone: '+237 6XX XXX XXX'
      }
    );

    console.log('✅ Facture simple créée:', invoice);
    return invoice;
    
  } catch (error) {
    console.error('❌ Erreur création facture simple:', error);
    throw error;
  }
};

export const createTestInvoice = async (userId) => {
  try {
    console.log('🧪 Création d\'une facture de test...');
    
    // Alternatif entre réservation simple et multiple
    const isMultiple = Math.random() > 0.5;
    
    const testBookingData = isMultiple ? {
      // Réservation multiple (famille/groupe)
      user_id: userId,
      booking_reference: `MULTI-${Date.now()}`,
      departure: 'Douala',
      arrival: 'Yaoundé',
      departure_date: new Date().toISOString().split('T')[0],
      departure_time: '14:30',
      selected_seats: 'A15, A16, B12', // 3 sièges
      total_price: 22500, // 3 x 7500 FCFA
      payment_method: 'Mobile Money',
      status: 'confirmed'
    } : {
      // Réservation simple
      user_id: userId,
      booking_reference: `SIMPLE-${Date.now()}`,
      departure: 'Bafoussam',
      arrival: 'Douala',
      departure_date: new Date().toISOString().split('T')[0],
      departure_time: '09:15',
      selected_seats: 'C08', // 1 seul siège
      total_price: 6500,
      payment_method: 'Orange Money',
      status: 'confirmed'
    };

    console.log('📝 Insertion de la réservation test:', testBookingData);
    
    // Optionnel: Créer un voyage de test pour avoir des données complètes
    const testTripData = {
      departure_city: testBookingData.departure,
      arrival_city: testBookingData.arrival,
      departure_date: testBookingData.departure_date,
      departure_time: testBookingData.departure_time,
      bus_type: isMultiple ? 'VIP' : 'Standard',
      price: isMultiple ? 7500 : 6500,
      available_seats: 50,
      status: 'active'
    };

    // Essayer d'insérer le voyage (peut échouer si la table n'existe pas)
    let tripId = null;
    try {
      const { data: tripInserted, error: tripError } = await supabase
        .from('trips')
        .insert([testTripData])
        .select()
        .single();

      if (!tripError && tripInserted) {
        tripId = tripInserted.id;
        testBookingData.trip_id = tripId;
        console.log('✅ Voyage test créé:', tripInserted);
      }
    } catch (tripError) {
      console.log('⚠️ Impossible de créer le voyage test (optionnel):', tripError.message);
    }
    
    // Insérer la réservation dans la base de données
    const { data: bookingInserted, error: bookingError } = await supabase
      .from('bookings')
      .insert([testBookingData])
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Erreur insertion réservation:', bookingError);
      throw bookingError;
    }

    console.log('✅ Réservation test créée:', bookingInserted);

    // Maintenant créer la facture avec les vraies données de la réservation
    console.log('🧾 Création de la facture avec les données:', {
      selected_seats: bookingInserted.selected_seats,
      departure: bookingInserted.departure,
      arrival: bookingInserted.arrival,
      bus_type: testTripData.bus_type
    });
    
    const invoice = await invoiceService.createInvoice(
      {
        ...bookingInserted,
        // Injecter directement le type de bus dans les données de booking
        busType: testTripData.bus_type,
        // S'assurer que toutes les données importantes sont présentes
        selected_seats: bookingInserted.selected_seats
      },
      {
        fullName: 'Utilisateur Test',
        email: 'test@example.com',
        phone: '+237 6XX XXX XXX'
      }
    );

    console.log('✅ Facture de test créée:', invoice);
    return invoice;
    
  } catch (error) {
    console.error('❌ Erreur création facture test:', error);
    throw error;
  }
};

export const testInvoiceDisplay = async (userId) => {
  try {
    console.log('📋 Test d\'affichage des factures...');
    
    // Récupérer les factures utilisateur
    const invoices = await invoiceService.getUserInvoices(userId);
    console.log('📄 Factures trouvées:', invoices.length);
    
    if (invoices.length > 0) {
      console.log('🔍 Première facture:', invoices[0]);
      return invoices[0];
    } else {
      console.log('ℹ️ Aucune facture trouvée, création d\'une facture de test...');
      return await createTestInvoice(userId);
    }
    
  } catch (error) {
    console.error('❌ Erreur test factures:', error);
    throw error;
  }
};
