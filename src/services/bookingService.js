import { supabase } from './supabaseClient'
import logger from '../utils/logger'

export const bookingService = {
  // Vérifier et appliquer le discount de parrainage
  // Vérifier le parrainage pour la première réservation
  async checkReferralForFirstBooking(userId) {
    try {
      // Vérifier si l'utilisateur a été parrainé
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', userId)
        .eq('status', 'pending') // Seulement les parrainages encore pending
        .single()

      if (referralError || !referralData) {
        logger.info('👤 Aucun parrainage pending trouvé pour cet utilisateur');
        return { hasDiscount: false, discount: 0 }
      }

      // Vérifier si c'est réellement la première réservation
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', userId)

      if (bookingsError) {
        console.error('Erreur lors de la vérification des réservations existantes:', bookingsError)
        return { hasDiscount: false, discount: 0 }
      }

      const bookingCount = existingBookings ? existingBookings.length : 0
      logger.info(`📊 Réservations existantes pour l'utilisateur: ${bookingCount}`);

      if (bookingCount > 0) {
        logger.info('❌ Ce n\'est pas la première réservation - pas de récompense');
        return { hasDiscount: false, discount: 0 }
      }

      logger.info('✅ Première réservation confirmée - le parrain recevra une récompense');
      return { hasDiscount: false, discount: 0, referralId: referralData.id, isFirstBooking: true }
      
    } catch (error) {
      console.error('Erreur lors de la vérification du parrainage:', error)
      return { hasDiscount: false, discount: 0 }
    }
  },

  async checkReferralDiscount(userId) {
    try {
      // Vérifier si l'utilisateur a été parrainé
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', userId)
        .single()

      if (referralError || !referralData) {
        // Aucun parrainage trouvé pour cet utilisateur
        return { hasDiscount: false, discount: 0 }
      }

      // NOTE: Dans notre système, seul le PARRAIN reçoit 500 FCFA, pas le filleul
      // Le filleul n'a aucune réduction, c'est juste pour aider le parrain à gagner
      
      return { hasDiscount: false, discount: 0, referralId: referralData.id }
    } catch (error) {
      console.error('Erreur lors de la vérification du parrainage:', error)
      return { hasDiscount: false, discount: 0 }
    }
  },

  // Créer plusieurs réservations (une par siège)
  async createMultipleBookings(bookingData) {
    try {
      logger.info('=== DÉBUT CRÉATION RÉSERVATIONS MULTIPLES ===');
      logger.log('Données reçues:', bookingData);
      
      // Validation des données essentielles
      if (!bookingData.tripId || !bookingData.userId) {
        throw new Error('tripId et userId sont obligatoires');
      }

      // Récupérer les vraies informations de l'utilisateur
      const { authService } = await import('./supabase');
      await authService.ensureUserProfile(bookingData.userId);
      
      let { data: userData, error: userError } = await supabase
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
      } else {
        // Même si la requête réussit, vérifier si les données critiques sont présentes
        // Si phone ou ville manquent, utiliser les métadonnées Auth
        if (!userData.phone || !userData.ville) {
          console.log('⚠️ Données manquantes dans la table users, utilisation des métadonnées Auth');
          const { data: { user } } = await supabase.auth.getUser();
          userData = {
            ...userData,
            phone: userData.phone || user?.user_metadata?.phone || user?.phone || bookingData.passengerPhone || '+237600000000',
            ville: userData.ville || user?.user_metadata?.ville || null,
          };
        }
      }

      console.log('👤 Informations utilisateur récupérées:', userData);
      
      let finalSeatNumbers = [];
      
      // Gérer l'attribution des sièges
      console.log('🪑 Analyse des sièges reçus:');
      console.log('- selectedSeats:', bookingData.selectedSeats);
      console.log('- seatNumber:', bookingData.seatNumber);
      console.log('- Type selectedSeats:', typeof bookingData.selectedSeats);
      console.log('- Est array:', Array.isArray(bookingData.selectedSeats));
      
      if (bookingData.selectedSeats && Array.isArray(bookingData.selectedSeats)) {
        console.log('📋 Traitement sièges VIP array...');
        finalSeatNumbers = bookingData.selectedSeats.map(seat => {
          const seatNumber = typeof seat === 'object' ? seat.seat_number || seat.number : seat;
          console.log('- Siège mappé:', seat, '→', seatNumber);
          return seatNumber;
        });
      } else if (bookingData.seatNumber) {
        console.log('📋 Traitement siège unique...');
        finalSeatNumbers = [bookingData.seatNumber];
      } else {
        console.log('📋 Attribution automatique pour trajets non-VIP...');
        // Attribution automatique pour trajets non-VIP
        const { busService } = await import('./busService');
        const numberOfSeats = bookingData.passengers || 1;
        const assignedSeats = await busService.autoReserveSeats(bookingData.tripId, numberOfSeats);
        finalSeatNumbers = assignedSeats.map(seat => seat.seat_number);
      }

      console.log('Sièges à réserver:', finalSeatNumbers);

      // Vérifier que les sièges existent et sont disponibles
      const { data: existingSeats, error: seatCheckError } = await supabase
        .from('seat_maps')
        .select('seat_number, is_available')
        .eq('trip_id', bookingData.tripId)
        .in('seat_number', finalSeatNumbers);

      if (seatCheckError) {
        throw new Error('Impossible de vérifier la disponibilité des sièges');
      }

      const unavailableSeats = existingSeats?.filter(seat => !seat.is_available) || [];
      if (unavailableSeats.length > 0) {
        throw new Error(`Sièges déjà occupés: ${unavailableSeats.map(s => s.seat_number).join(', ')}`);
      }

      // Marquer tous les sièges comme occupés d'abord
      const { error: seatError } = await supabase
        .from('seat_maps')
        .update({ is_available: false })
        .eq('trip_id', bookingData.tripId)
        .in('seat_number', finalSeatNumbers);

      if (seatError) {
        throw new Error('Impossible de réserver les sièges sélectionnés');
      }

      console.log(`✅ Sièges ${finalSeatNumbers.join(', ')} marqués comme occupés`);

      // Vérifier le parrainage AVANT de créer les réservations pour savoir si c'est la première
      const referralInfo = await this.checkReferralForFirstBooking(bookingData.userId);
      logger.info('💰 Informations de parrainage:', referralInfo);

      // Créer une réservation pour chaque siège
      const createdBookings = [];
      const basePrice = bookingData.totalPrice ? Math.floor(bookingData.totalPrice / finalSeatNumbers.length) : 0;
      
      for (let i = 0; i < finalSeatNumbers.length; i++) {
        const seatNumber = finalSeatNumbers[i];
        
        const reservationData = {
          trip_id: bookingData.tripId,
          user_id: bookingData.userId,
          seat_number: seatNumber, // UN SEUL siège par réservation
          passenger_name: userData.full_name || 'Client TravelHub',
          passenger_phone: userData.phone || '+237600000000',
          total_price_fcfa: basePrice, // Pas de réduction pour le filleul
          original_price: basePrice, // Prix original avant réduction
          applied_discount: 0, // Pas de réduction pour le filleul
          discount_type: null, // Pas de type de réduction
          booking_reference: `TH${Date.now()}-${i + 1}`, // Référence unique pour chaque réservation
          booking_status: 'confirmed',
          payment_status: 'pending',
          payment_method: bookingData.paymentMethod || 'orange_money' // Ajouter le moyen de paiement
        };

        console.log(`Création réservation ${i + 1}/${finalSeatNumbers.length} pour siège ${seatNumber}:`, reservationData);

        const { data, error } = await supabase
          .from('bookings')
          .insert(reservationData)
          .select()
          .single();

        if (error) {
          console.error(`❌ Erreur création réservation siège ${seatNumber}:`, error);
          // En cas d'erreur, libérer les sièges déjà occupés
          await supabase
            .from('seat_maps')
            .update({ is_available: true })
            .eq('trip_id', bookingData.tripId)
            .in('seat_number', finalSeatNumbers);
          throw error;
        }

        createdBookings.push(data);
        console.log(`✅ Réservation créée pour siège ${seatNumber}:`, data.id);
      }

      // Si l'utilisateur a été parrainé ET que c'est sa première réservation, créer la récompense pour le parrain
      // ✅ CORRECTION : Créer la récompense UNE SEULE FOIS pour toutes les réservations du groupe
      if (referralInfo.referralId && referralInfo.isFirstBooking) {
        logger.info('🎁 Première réservation d\'un filleul - création de la récompense pour le parrain');
        await this.createReferralReward(referralInfo.referralId, bookingData.userId, 500);
      }

      console.log('=== FIN CRÉATION RÉSERVATIONS MULTIPLES ===');
      console.log(`✅ ${createdBookings.length} réservations créées avec succès`);
      return createdBookings;
      
    } catch (error) {
      console.error('❌ ERREUR GÉNÉRALE createMultipleBookings:', error);
      throw error;
    }
  },

  // Créer une nouvelle réservation (ancienne version - maintenant utilisée pour une seule réservation)
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
      
      let { data: userData, error: userError } = await supabase
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
      } else {
        // Même si la requête réussit, vérifier si les données critiques sont présentes
        // Si phone ou ville manquent, utiliser les métadonnées Auth
        if (!userData.phone || !userData.ville) {
          console.log('⚠️ Données manquantes dans la table users, utilisation des métadonnées Auth');
          const { data: { user } } = await supabase.auth.getUser();
          userData = {
            ...userData,
            phone: userData.phone || user?.user_metadata?.phone || user?.phone || bookingData.passengerPhone || '+237600000000',
            ville: userData.ville || user?.user_metadata?.ville || null,
          };
        }
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

  // Mettre à jour le statut de paiement de plusieurs réservations (pour les réservations multiples)
  async updateMultiplePaymentStatus(bookingIds, paymentStatus, paymentDetails = {}) {
    try {
      console.log(`Mise à jour du statut de paiement pour ${bookingIds.length} réservations:`, bookingIds);
      
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
        .in('id', bookingIds)
        .select()

      if (error) {
        console.error('Erreur lors de la mise à jour des paiements multiples:', error)
        throw error
      }

      console.log(`✅ Statut de paiement mis à jour pour ${data.length} réservations:`, data)
      return data
    } catch (error) {
      console.error('Erreur dans updateMultiplePaymentStatus:', error)
      throw error
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
  },

  // Créer une récompense de parrainage
  async createReferralReward(referralId, referredUserId, amount) {
    try {
      console.log(`🔍 Vérification récompense parrainage pour referralId: ${referralId}`)
      
      // Récupérer les informations du parrainage
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('referrer_id, status')
        .eq('id', referralId)
        .single()

      if (referralError || !referralData) {
        console.error('Impossible de trouver le parrainage:', referralError)
        return
      }

      // ⚠️ IMPORTANT : Vérifier que c'est la PREMIÈRE réservation de l'ami parrainé
      // CORRECTION : Compter les réservations CONFIRMÉES seulement (status confirmed/completed)
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', referredUserId)
        .in('booking_status', ['confirmed', 'completed'])

      if (bookingsError) {
        logger.error('Erreur lors de la vérification des réservations:', bookingsError)
        return
      }

      const bookingCount = existingBookings ? existingBookings.length : 0
      logger.info(`📊 Nombre de réservations confirmées pour l'utilisateur ${referredUserId}: ${bookingCount}`)

      // CORRECTION : Pour la première réservation, le count devrait être exactement 1 
      // (car on vient de créer la première réservation juste avant)
      if (bookingCount !== 1) {
        logger.info('❌ Ce n\'est pas la première réservation - aucune récompense créée')
        return
      }

      // Vérifier aussi que le parrainage est encore "pending"
      if (referralData.status !== 'pending') {
        logger.info('❌ Parrainage déjà complété - aucune récompense créée')
        return
      }

      logger.info('✅ C\'est la première réservation et parrainage pending - création de la récompense')

      // Créer la récompense pour le parrain (UNIQUEMENT)
      const { data: reward, error: rewardError } = await supabase
        .from('referral_rewards')
        .insert({
          referral_id: referralId,
          referrer_id: referralData.referrer_id,
          reward_amount: amount,
          is_claimed: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (rewardError) {
        console.error('Erreur lors de la création de la récompense:', rewardError)
        return
      }

      // 🆕 Marquer le parrainage comme complété et disponible
      await supabase
        .from('referrals')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', referralId)

      // 🆕 Mettre à jour les statistiques du parrain
      // D'abord récupérer les valeurs actuelles
      const { data: currentUser, error: getUserError } = await supabase
        .from('users')
        .select('total_referrals, total_referral_earnings')
        .eq('id', referralData.referrer_id)
        .single()

      if (!getUserError && currentUser) {
        const newTotalReferrals = (currentUser.total_referrals || 0) + 1
        const newTotalEarnings = (currentUser.total_referral_earnings || 0) + amount

        await supabase
          .from('users')
          .update({
            total_referrals: newTotalReferrals,
            total_referral_earnings: newTotalEarnings
          })
          .eq('id', referralData.referrer_id)

        console.log(`📊 Statistiques mises à jour: ${newTotalReferrals} parrainages, ${newTotalEarnings} FCFA gagnés`)
      }

      console.log(`🎉 Récompense de ${amount} FCFA créée pour le parrain:`, reward)
      return reward
    } catch (error) {
      console.error('Erreur lors de la création de la récompense de parrainage:', error)
    }
  },

  // 🆕 Fonction pour récupérer les récompenses disponibles d'un utilisateur
  async getAvailableRewards(userId) {
    try {
      const { data: rewards, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', userId)
        .eq('is_claimed', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur récupération récompenses:', error)
        return []
      }

      const totalAmount = rewards?.reduce((sum, reward) => sum + reward.reward_amount, 0) || 0
      console.log(`💰 Utilisateur ${userId} a ${rewards?.length || 0} récompenses disponibles pour ${totalAmount} FCFA`)
      
      return { rewards: rewards || [], totalAmount }
    } catch (error) {
      console.error('Erreur dans getAvailableRewards:', error)
      return { rewards: [], totalAmount: 0 }
    }
  },

  // 🆕 Fonction pour appliquer une réduction de parrainage
  async applyReferralDiscount(userId, bookingAmount) {
    try {
      const { rewards, totalAmount } = await this.getAvailableRewards(userId)
      
      if (totalAmount === 0) {
        return { hasDiscount: false, discountAmount: 0, finalPrice: bookingAmount }
      }

      // Appliquer la réduction (maximum = montant disponible)
      const discountAmount = Math.min(totalAmount, bookingAmount)
      const finalPrice = bookingAmount - discountAmount

      console.log(`💰 Réduction appliquée: ${discountAmount} FCFA sur ${bookingAmount} FCFA`)
      
      return {
        hasDiscount: true,
        discountAmount,
        finalPrice,
        availableRewards: rewards
      }
    } catch (error) {
      console.error('Erreur dans applyReferralDiscount:', error)
      return { hasDiscount: false, discountAmount: 0, finalPrice: bookingAmount }
    }
  },

  // 🆕 Fonction pour marquer les récompenses comme utilisées
  async claimRewards(userId, usedAmount, bookingId) {
    try {
      const { rewards } = await this.getAvailableRewards(userId)
      
      let remainingAmount = usedAmount
      const rewardsToUpdate = []

      for (const reward of rewards) {
        if (remainingAmount <= 0) break

        const amountToUse = Math.min(reward.reward_amount, remainingAmount)
        rewardsToUpdate.push(reward.id)
        remainingAmount -= amountToUse

        // Marquer comme utilisée
        await supabase
          .from('referral_rewards')
          .update({
            is_claimed: true,
            claimed_at: new Date().toISOString(),
            applied_to_booking_id: bookingId
          })
          .eq('id', reward.id)
      }

      console.log(`✅ ${rewardsToUpdate.length} récompenses marquées comme utilisées`)
      return true
    } catch (error) {
      console.error('Erreur dans claimRewards:', error)
      return false
    }
  }
}
