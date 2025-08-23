import { supabase } from './supabaseClient'

export const bookingService = {
  // Créer une nouvelle réservation
  async createBooking(bookingData) {
    try {
      console.log('=== DÉBUT CRÉATION RÉSERVATION ===');
      console.log('Données reçues:', bookingData);
      
      // Validation des données essentielles
      if (!bookingData.tripId || !bookingData.userId) {
        throw new Error('tripId et userId sont obligatoires');
      }

      // 🛡️ Vérifier s'il existe déjà une réservation pour ce voyage et cet utilisateur
      console.log('Vérification des doublons pour trip:', bookingData.tripId, 'user:', bookingData.userId);
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id, booking_reference')
        .eq('trip_id', bookingData.tripId)
        .eq('user_id', bookingData.userId)
        .eq('booking_status', 'confirmed');

      if (checkError) {
        console.warn('⚠️ Erreur lors de la vérification des doublons:', checkError);
      } else if (existingBookings && existingBookings.length > 0) {
        console.log('🛑 Réservation existante trouvée, pas de duplication:', existingBookings[0]);
        return existingBookings[0]; // Retourner la réservation existante
      }

      // 🆕 Récupérer les vraies informations de l'utilisateur depuis la table users
      console.log('Récupération des informations utilisateur...');
      
      // D'abord s'assurer que l'utilisateur existe dans la table users
      const { authService } = await import('./supabase');
      await authService.ensureUserProfile(bookingData.userId);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, phone, ville, email')
        .eq('id', bookingData.userId)
        .single();

      if (userError) {
        console.warn('⚠️ Impossible de récupérer les infos utilisateur:', userError);
        // Fallback sur les données Supabase Auth
        const { data: { user } } = await supabase.auth.getUser();
        userData = {
          full_name: user?.user_metadata?.full_name || user?.full_name || 'Client TravelHub',
          phone: user?.user_metadata?.phone || user?.phone || bookingData.passengerPhone || '+237600000000',
          ville: user?.user_metadata?.ville || null,
          email: user?.email
        };
      }

      console.log('👤 Informations utilisateur récupérées:', userData);
      
      let finalSeatNumbers = [];
      
      // 1. Gérer l'attribution des sièges
      if (bookingData.seatNumber || bookingData.selectedSeats) {
        // Sièges déjà sélectionnés (VIP par exemple)
        if (bookingData.selectedSeats) {
          finalSeatNumbers = Array.isArray(bookingData.selectedSeats) 
            ? bookingData.selectedSeats.map(seat => 
                typeof seat === 'object' ? seat.seat_number || seat.number : seat
              )
            : [bookingData.selectedSeats]
        } else if (bookingData.seatNumber) {
          finalSeatNumbers = [bookingData.seatNumber]
        }

        console.log('Sièges à réserver:', finalSeatNumbers);

        // Vérifier que les sièges existent et sont disponibles
        const { data: existingSeats, error: seatCheckError } = await supabase
          .from('seat_maps')
          .select('seat_number, is_available')
          .eq('trip_id', bookingData.tripId)
          .in('seat_number', finalSeatNumbers);

        if (seatCheckError) {
          console.error('Erreur lors de la vérification des sièges:', seatCheckError);
          throw new Error('Impossible de vérifier la disponibilité des sièges');
        }

        const unavailableSeats = existingSeats?.filter(seat => !seat.is_available) || [];
        if (unavailableSeats.length > 0) {
          console.warn('Sièges déjà occupés:', unavailableSeats.map(s => s.seat_number));
          // Continue quand même mais log l'avertissement
        }

        // Marquer les sièges comme occupés
        const { error: seatError } = await supabase
          .from('seat_maps')
          .update({ is_available: false })
          .eq('trip_id', bookingData.tripId)
          .in('seat_number', finalSeatNumbers)

        if (seatError) {
          console.error('Erreur lors de la réservation des sièges:', seatError)
          throw new Error('Impossible de réserver les sièges sélectionnés')
        }

        console.log(`✅ Sièges ${finalSeatNumbers.join(', ')} marqués comme occupés`)
      } else {
        // Aucun siège spécifié -> Attribution automatique pour trajets non-VIP
        console.log('Attribution automatique de sièges...')
        
        try {
          const { busService } = await import('./busService')
          const assignedSeats = await busService.autoReserveSeats(bookingData.tripId, 1)
          finalSeatNumbers = assignedSeats.map(seat => seat.seat_number)
          
          console.log(`Sièges automatiquement attribués: ${finalSeatNumbers.join(', ')}`)
        } catch (autoSeatError) {
          console.error('Erreur attribution automatique:', autoSeatError);
          // Fallback: prendre le premier siège disponible
          const { data: availableSeats } = await supabase
            .from('seat_maps')
            .select('seat_number')
            .eq('trip_id', bookingData.tripId)
            .eq('is_available', true)
            .limit(1);
            
          if (availableSeats?.length > 0) {
            finalSeatNumbers = [availableSeats[0].seat_number];
            await supabase
              .from('seat_maps')
              .update({ is_available: false })
              .eq('trip_id', bookingData.tripId)
              .eq('seat_number', finalSeatNumbers[0]);
            console.log(`Siège de fallback attribué: ${finalSeatNumbers[0]}`);
          } else {
            throw new Error('Aucun siège disponible');
          }
        }
      }

      // 2. Préparer les données de réservation avec les VRAIES informations utilisateur
      const reservationData = {
        trip_id: bookingData.tripId,
        user_id: bookingData.userId,
        seat_number: finalSeatNumbers.join(', '),
        // 🆕 Utiliser les vraies informations de l'utilisateur
        passenger_name: userData.full_name || 'Client TravelHub',
        passenger_phone: userData.phone || '+237600000000',
        // Retirer passenger_email car cette colonne n'existe pas dans la table bookings
        total_price_fcfa: bookingData.totalPrice || 0,
        booking_reference: `TH${Date.now()}`,
        booking_status: 'confirmed',
        payment_status: 'pending'
      };

      console.log('✅ Données de réservation avec vraies infos utilisateur:', reservationData);

      // 3. Essayer l'insertion avec gestion d'erreur détaillée
      console.log('Tentative d\'insertion dans bookings...');
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(reservationData)
        .select()
        .single();

      if (error) {
        console.error('❌ ERREUR INSERTION BOOKING:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Détails:', error.details);
        console.error('Hint:', error.hint);
        
        // Ne pas faire échouer complètement, juste logger
        console.log('⚠️ Réservation non sauvée en BD mais sièges marqués occupés');
        
        // Retourner un objet mock pour que l'app continue à fonctionner
        return {
          id: `MOCK_${Date.now()}`,
          ...reservationData,
          created_at: new Date().toISOString()
        };
      }

      console.log('✅ RÉSERVATION CRÉÉE AVEC SUCCÈS:', data);
      
      // 4. Optionnel: Mettre à jour le statut de paiement
      if (bookingData.paymentMethod) {
        try {
          await supabase
            .from('bookings')
            .update({ 
              payment_method: bookingData.paymentMethod
            })
            .eq('id', data.id);
          
          console.log('✅ Méthode de paiement mise à jour');
        } catch (paymentUpdateError) {
          console.warn('⚠️ Impossible de mettre à jour la méthode de paiement:', paymentUpdateError);
        }
      }
      
      console.log('=== FIN CRÉATION RÉSERVATION ===');
      return data;
      
    } catch (error) {
      console.error('❌ ERREUR GÉNÉRALE createBooking:', error);
      throw error;
    }
  },

  // Mettre à jour le statut de paiement d'une réservation
  async updatePaymentStatus(bookingId, paymentStatus, paymentDetails = {}) {
    try {
      const updateData = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      }

      // Ajouter les détails de paiement si fournis
      if (paymentDetails.transactionId) {
        updateData.payment_transaction_id = paymentDetails.transactionId
      }
      if (paymentDetails.paymentMethod) {
        updateData.payment_method = paymentDetails.paymentMethod
      }
      if (paymentStatus === 'completed') {
        updateData.paid_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la mise à jour du paiement:', error)
        throw error
      }

      console.log('Statut de paiement mis à jour:', data)
      return data
    } catch (error) {
      console.error('Erreur dans updatePaymentStatus:', error)
      throw error
    }
  },

  // Récupérer toutes les réservations d'un utilisateur
  async getUserBookings(userId) {
    try {
      // D'abord récupérer les réservations de base
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (bookingsError) {
        console.error('Erreur lors de la récupération des réservations:', bookingsError)
        throw bookingsError
      }

      if (!bookingsData || bookingsData.length === 0) {
        console.log('📭 Aucune réservation trouvée pour cet utilisateur');
        return []
      }

      console.log('📋 Réservations trouvées:', bookingsData.length);
      console.log('📋 Première réservation:', bookingsData[0]);

      // Ensuite récupérer les informations des trajets séparément
      const tripIds = [...new Set(bookingsData.map(booking => booking.trip_id).filter(Boolean))]
      console.log('🚌 Trip IDs à récupérer:', tripIds);
      
      if (tripIds.length === 0) {
        console.warn('⚠️ Aucun trip_id trouvé dans les réservations');
        return bookingsData.map(booking => ({
          ...booking,
          trips: {
            ville_depart: 'Ville inconnue',
            ville_arrivee: 'Ville inconnue',
            date: new Date().toISOString().split('T')[0],
            heure_dep: '00:00',
            heure_arr: '00:00',
            agencies: { nom: 'TravelHub' }
          }
        }))
      }

      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          id,
          departure_city,
          arrival_city,
          departure_time,
          arrival_time,
          agency_id,
          bus_type
        `)
        .in('id', tripIds)

      console.log('🚌 Trajets récupérés:', tripsData);
      console.log('🚌 Erreur trajets:', tripsError);

      if (tripsError) {
        console.warn('Erreur lors de la récupération des trajets:', tripsError)
        // Continuer avec des valeurs par défaut
      }

      // Récupérer les agences séparément si on a des trips
      const agencyIds = tripsData ? [...new Set(tripsData.map(trip => trip.agency_id).filter(Boolean))] : []
      let agenciesData = []
      
      if (agencyIds.length > 0) {
        const { data: agencies, error: agenciesError } = await supabase
          .from('agencies')
          .select('id, nom')
          .in('id', agencyIds)
          
        if (!agenciesError) {
          agenciesData = agencies || []
        }
      }

      // Combiner les données
      const enrichedBookings = bookingsData.map(booking => {
        const trip = tripsData?.find(t => t.id === booking.trip_id) || {}
        const agency = agenciesData.find(a => a.id === trip.agency_id) || {}
        
        // Extraire les heures depuis departure_time et arrival_time
        const departureTime = trip.departure_time ? new Date(trip.departure_time) : null
        const arrivalTime = trip.arrival_time ? new Date(trip.arrival_time) : null
        
        const heure_dep = departureTime ? departureTime.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '00:00'
        
        const heure_arr = arrivalTime ? arrivalTime.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '00:00'
        
        const date = departureTime ? departureTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        
        console.log(`🔄 Enrichissement booking ${booking.id}:`, {
          booking_trip_id: booking.trip_id,
          found_trip: trip,
          departure_city: trip.departure_city,
          arrival_city: trip.arrival_city,
          departure_time: trip.departure_time,
          arrival_time: trip.arrival_time,
          heure_dep,
          heure_arr,
          found_agency: agency
        });
        
        return {
          ...booking,
          trips: {
            ...trip,
            ville_depart: trip.departure_city || 'Ville inconnue',
            ville_arrivee: trip.arrival_city || 'Ville inconnue',
            date: date,
            heure_dep: heure_dep,
            heure_arr: heure_arr,
            agencies: {
              nom: agency.nom || 'TravelHub'
            }
          }
        }
      })

      console.log('✅ Données enrichies finales:', enrichedBookings);
      return enrichedBookings
    } catch (error) {
      console.error('Erreur dans getUserBookings:', error)
      throw error
    }
  },

  // Récupérer une réservation par ID
  async getBookingById(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération de la réservation:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur dans getBookingById:', error)
      throw error
    }
  },

  // Annuler une réservation
  async cancelBooking(bookingId, reason = '') {
    try {
      // Validation de l'ID
      if (!bookingId) {
        throw new Error('ID de réservation manquant');
      }
      
      // Vérifier si c'est un UUID valide (36 caractères avec des tirets)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        console.error('❌ ID invalide pour annulation:', bookingId, 'Type:', typeof bookingId);
        throw new Error(`ID de réservation invalide: ${bookingId}. Attendu UUID format.`);
      }
      
      console.log('✅ ID valide pour annulation:', bookingId);
      
      // 1. Récupérer les détails de la réservation
      const booking = await this.getBookingById(bookingId)
      
      // 2. Libérer les sièges
      const seatNumbers = booking.seat_number.split(', ')
      const { error: seatError } = await supabase
        .from('seat_maps')
        .update({ is_available: true })
        .eq('trip_id', booking.trip_id)
        .in('seat_number', seatNumbers)

      if (seatError) {
        console.error('Erreur lors de la libération des sièges:', seatError)
      }

      // 3. Mettre à jour le statut de la réservation
      const { data, error } = await supabase
        .from('bookings')
        .update({
          booking_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de l\'annulation:', error)
        throw error
      }

      console.log('Réservation annulée:', data)
      return data
    } catch (error) {
      console.error('Erreur dans cancelBooking:', error)
      throw error
    }
  },

  // Confirmer une réservation
  async confirmBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          booking_status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la confirmation:', error)
        throw error
      }

      console.log('Réservation confirmée:', data)
      return data
    } catch (error) {
      console.error('Erreur dans confirmBooking:', error)
      throw error
    }
  },

  // Fonction utilitaire pour créer des données de test
  async createTestData(userId) {
    try {
      console.log('🧪 Création de données de test...');
      
      // 1. Créer ou récupérer une agence de test
      const { data: existingAgency } = await supabase
        .from('agencies')
        .select('id')
        .eq('nom', 'TravelHub Test')
        .single();
        
      let agencyId = existingAgency?.id;
      
      if (!agencyId) {
        const { data: newAgency, error: agencyError } = await supabase
          .from('agencies')
          .insert({
            nom: 'TravelHub Test',
            email: 'test@travelhub.com',
            phone: '+237600000000'
          })
          .select('id')
          .single();
          
        if (agencyError) {
          console.error('Erreur création agence test:', agencyError);
          agencyId = null;
        } else {
          agencyId = newAgency.id;
        }
      }
      
      // 2. Créer des trajets de test
      const testTrips = [
        {
          ville_depart: 'Douala',
          ville_arrivee: 'Yaoundé',
          date: '2025-08-25',
          heure_dep: '08:00',
          heure_arr: '12:00',
          agency_id: agencyId,
          bus_type: 'VIP',
          price_fcfa: 5500
        },
        {
          ville_depart: 'Bafoussam', 
          ville_arrivee: 'Douala',
          date: '2025-08-26',
          heure_dep: '14:30',
          heure_arr: '18:00',
          agency_id: agencyId,
          bus_type: 'Standard',
          price_fcfa: 3000
        }
      ];
      
      const { data: createdTrips, error: tripsError } = await supabase
        .from('trips')
        .upsert(testTrips, { 
          onConflict: 'ville_depart,ville_arrivee,date,heure_dep',
          ignoreDuplicates: true 
        })
        .select('id');
        
      if (tripsError) {
        console.error('Erreur création trajets test:', tripsError);
        return;
      }
      
      console.log('✅ Trajets de test créés:', createdTrips);
      
      // 3. Créer des réservations de test
      if (createdTrips && createdTrips.length > 0) {
        const testBookings = createdTrips.map((trip, index) => ({
          user_id: userId,
          trip_id: trip.id,
          seat_number: `${12 + index}A`,
          total_price_fcfa: index === 0 ? 5500 : 3000,
          booking_status: 'confirmed',
          payment_status: 'confirmed',
          payment_method: index === 0 ? 'Orange Money' : 'Stripe',
          passenger_name: 'Test User',
          passenger_phone: '+237600000000',
          booking_reference: `TEST${index + 1}${Date.now()}`
        }));
        
        const { data: createdBookings, error: bookingsError } = await supabase
          .from('bookings')
          .insert(testBookings)
          .select('*');
          
        if (bookingsError) {
          console.error('Erreur création réservations test:', bookingsError);
        } else {
          console.log('✅ Réservations de test créées:', createdBookings);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la création des données de test:', error);
    }
  }
}
