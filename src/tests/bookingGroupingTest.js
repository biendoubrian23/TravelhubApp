// Test pour vérifier le groupement des réservations multi-sièges
// Lancez ce test avec: node src/tests/bookingGroupingTest.js

const testBookingGrouping = () => {
  console.log('🧪 Test du groupement des réservations multi-sièges');
  
  try {
    // Simuler des données de réservation comme celles retournées par Supabase
    const mockSupabaseData = [
      {
        id: '1',
        booking_reference: 'REF123',
        seat_number: 'A1',
        total_price_fcfa: 5000,
        booking_status: 'confirmed',
        passenger_name: 'John Doe',
        passenger_phone: '+237123456789',
        payment_method: 'Orange Money',
        payment_status: 'paid',
        created_at: '2024-01-01T10:00:00Z',
        trip_id: 'trip1',
        trips: {
          ville_depart: 'Yaoundé',
          ville_arrivee: 'Douala',
          date: '2024-01-15',
          heure_dep: '08:00',
          bus_type: 'VIP',
          agencies: {
            nom: 'Garantie Express'
          }
        }
      },
      {
        id: '2',
        booking_reference: 'REF123', // Même référence = même réservation
        seat_number: 'A2',
        total_price_fcfa: 5000,
        booking_status: 'confirmed',
        passenger_name: 'John Doe',
        passenger_phone: '+237123456789',
        payment_method: 'Orange Money',
        payment_status: 'paid',
        created_at: '2024-01-01T10:00:00Z',
        trip_id: 'trip1',
        trips: {
          ville_depart: 'Yaoundé',
          ville_arrivee: 'Douala',
          date: '2024-01-15',
          heure_dep: '08:00',
          bus_type: 'VIP',
          agencies: {
            nom: 'Garantie Express'
          }
        }
      },
      {
        id: '3',
        booking_reference: 'REF124', // Différente référence = réservation séparée
        seat_number: 'B1',
        total_price_fcfa: 3000,
        booking_status: 'confirmed',
        passenger_name: 'Jane Smith',
        passenger_phone: '+237987654321',
        payment_method: 'Stripe',
        payment_status: 'paid',
        created_at: '2024-01-01T11:00:00Z',
        trip_id: 'trip2',
        trips: {
          ville_depart: 'Douala',
          ville_arrivee: 'Bafoussam',
          date: '2024-01-16',
          heure_dep: '14:00',
          bus_type: 'Standard',
          agencies: {
            nom: 'TravelHub'
          }
        }
      }
    ];

    console.log('📋 Données brutes simulées:', mockSupabaseData.length, 'réservations');
    
    // Appliquer la logique de groupement (copie de store/index.js)
    const groupedBookings = mockSupabaseData.reduce((groups, booking) => {
      const trip = booking.trips || {};
      const agency = trip.agencies || {};
      const bookingRef = booking.booking_reference || booking.id;
      
      if (!groups[bookingRef]) {
        groups[bookingRef] = {
          bookings: [],
          trip: trip,
          agency: agency
        };
      }
      
      groups[bookingRef].bookings.push(booking);
      return groups;
    }, {});
    
    console.log('📋 Groupes créés:', Object.keys(groupedBookings));
    
    // Transformer chaque groupe en une seule entrée UI
    const transformedBookings = Object.entries(groupedBookings).map(([bookingRef, group]) => {
      const firstBooking = group.bookings[0];
      const trip = group.trip;
      const agency = group.agency;
      
      // Calculer le prix total et combiner les numéros de siège
      const totalPrice = group.bookings.reduce((sum, b) => sum + (b.total_price_fcfa || 0), 0);
      const seatNumbers = group.bookings.map(b => b.seat_number).filter(s => s).sort((a, b) => a - b);
      const seatDisplay = seatNumbers.length > 1 ? `${seatNumbers.join(', ')}` : seatNumbers[0] || 'N/A';
      
      console.log('🔄 Transformation groupe:', {
        bookingRef: bookingRef,
        nbSieges: group.bookings.length,
        sieges: seatNumbers,
        prixTotal: totalPrice,
        affichageSiege: seatDisplay
      });
      
      return {
        id: firstBooking.id,
        departure: trip.ville_depart || 'Ville inconnue',
        arrival: trip.ville_arrivee || 'Ville inconnue', 
        date: trip.date || new Date().toISOString().split('T')[0],
        time: trip.heure_dep || '00:00',
        price: totalPrice,
        status: firstBooking.booking_status === 'confirmed' ? 'upcoming' : (firstBooking.booking_status || 'pending'),
        busType: trip.bus_type || 'standard',
        agency: agency.nom || 'TravelHub',
        seatNumber: seatDisplay,
        seatNumbers: seatNumbers,
        bookingReference: bookingRef,
        multiSeat: group.bookings.length > 1,
        allBookingIds: group.bookings.map(b => b.id)
      };
    });

    console.log('\n✅ RÉSULTATS DU TEST:');
    console.log(`- Données d'entrée: ${mockSupabaseData.length} réservations en BD`);
    console.log(`- Après groupement: ${transformedBookings.length} entrées UI`);
    
    transformedBookings.forEach((booking, index) => {
      console.log(`\n📱 Entrée UI ${index + 1}:`);
      console.log(`  - Trajet: ${booking.departure} → ${booking.arrival}`);
      console.log(`  - Référence: ${booking.bookingReference}`);
      console.log(`  - Sièges: ${booking.seatNumber} (${booking.seatNumbers.length} siège${booking.seatNumbers.length > 1 ? 's' : ''})`);
      console.log(`  - Prix total: ${booking.price} FCFA`);
      console.log(`  - Multi-sièges: ${booking.multiSeat ? 'Oui' : 'Non'}`);
      console.log(`  - IDs BD: [${booking.allBookingIds.join(', ')}]`);
    });

    // Vérifications
    console.log('\n🔍 VÉRIFICATIONS:');
    
    // Test 1: Nombre correct d'entrées UI
    const expectedUIEntries = 2; // REF123 (groupée) + REF124 (individuelle)
    if (transformedBookings.length === expectedUIEntries) {
      console.log('✅ Test 1 réussi: Nombre correct d\'entrées UI');
    } else {
      console.log(`❌ Test 1 échoué: Attendu ${expectedUIEntries}, obtenu ${transformedBookings.length}`);
    }
    
    // Test 2: Prix total correct pour la réservation groupée
    const groupedBooking = transformedBookings.find(b => b.bookingReference === 'REF123');
    if (groupedBooking && groupedBooking.price === 10000) {
      console.log('✅ Test 2 réussi: Prix total correct pour réservation multi-sièges');
    } else {
      console.log(`❌ Test 2 échoué: Prix attendu 10000, obtenu ${groupedBooking?.price}`);
    }
    
    // Test 3: Affichage des sièges correct
    if (groupedBooking && groupedBooking.seatNumber === 'A1, A2') {
      console.log('✅ Test 3 réussi: Affichage des sièges correct');
    } else {
      console.log(`❌ Test 3 échoué: Sièges attendus "A1, A2", obtenu "${groupedBooking?.seatNumber}"`);
    }
    
    // Test 4: Indicateur multi-sièges correct
    if (groupedBooking && groupedBooking.multiSeat === true) {
      console.log('✅ Test 4 réussi: Indicateur multi-sièges correct');
    } else {
      console.log(`❌ Test 4 échoué: Attendu multiSeat=true, obtenu ${groupedBooking?.multiSeat}`);
    }

    console.log('\n🎉 Test du groupement terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Exécuter le test
testBookingGrouping();
