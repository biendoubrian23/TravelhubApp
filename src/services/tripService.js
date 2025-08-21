import { supabase } from './supabaseClient'

export const tripService = {
  // Rechercher les trajets selon les critères
  async searchTrips(searchParams) {
    try {
      const { departure, arrival, date } = searchParams
      
      // Validation et création de la date de recherche
      let searchDate
      if (typeof date === 'string') {
        // Si c'est une chaîne, essayer de la parser
        searchDate = new Date(date)
      } else if (date instanceof Date) {
        searchDate = new Date(date)
      } else {
        // Par défaut, utiliser la date d'aujourd'hui
        searchDate = new Date()
      }
      
      // Vérifier si la date est valide
      if (isNaN(searchDate.getTime())) {
        console.warn('Date invalide, utilisation de la date actuelle')
        searchDate = new Date()
      }
      
      const startOfDay = new Date(searchDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(searchDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          *,
          agencies:agency_id (
            name,
            id
          ),
          buses!inner (
            id,
            name,
            total_seats,
            is_vip
          )
        `)
        .eq('departure_city', departure)
        .eq('arrival_city', arrival)
        .gte('departure_time', startOfDay.toISOString())
        .lte('departure_time', endOfDay.toISOString())
        .eq('is_active', true)
        .order('departure_time', { ascending: true })

      if (error) {
        console.error('Erreur lors de la recherche des trajets:', error)
        throw error
      }

      // Vérifier si on a trouvé des trajets
      if (!trips || trips.length === 0) {
        console.log(`Aucun trajet trouvé pour ${departure} → ${arrival} le ${date}`)
        return []
      }

      console.log(`${trips.length} trajets trouvés dans la base de données`)

      // Transformer les données pour correspondre au format attendu par l'interface
      const formattedTrips = await Promise.all(trips.map(async (trip) => {
        // Récupérer les vraies données de sièges depuis seat_maps
        const { data: seatMaps, error: seatError } = await supabase
          .from('seat_maps')
          .select('seat_number, seat_type, is_available, position_row, position_column')
          .eq('trip_id', trip.id)

        let availableSeats = 0
        let totalSeats = 0
        let occupiedSeats = 0

        if (seatMaps && !seatError) {
          totalSeats = seatMaps.length
          availableSeats = seatMaps.filter(seat => seat.is_available).length
          occupiedSeats = seatMaps.filter(seat => !seat.is_available).length
          
          console.log(`🚌 Trajet ${trip.id}: ${availableSeats}/${totalSeats} places disponibles (${Math.round(availableSeats/totalSeats*100)}%)`)
        } else {
          // Fallback vers l'ancienne méthode si pas de seat_maps
          const { data: bookings } = await supabase
            .from('bookings')
            .select('seat_number, payment_status')
            .eq('trip_id', trip.id)
            .eq('payment_status', 'completed')

          occupiedSeats = bookings ? bookings.length : 0
          totalSeats = trip.buses?.total_seats || trip.total_seats || 0
          availableSeats = totalSeats - occupiedSeats
        }

        return {
          id: trip.id,
          ville_depart: trip.departure_city,
          ville_arrivee: trip.arrival_city,
          date: new Date(trip.departure_time).toISOString().split('T')[0],
          heure_dep: new Date(trip.departure_time).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          heure_arr: new Date(trip.arrival_time).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          prix: trip.price_fcfa,
          is_vip: trip.buses?.is_vip || false,
          bus_type: trip.bus_type,
          agencies: {
            nom: trip.agencies?.name || 'Agence inconnue',
            id: trip.agencies?.id
          },
          bus_info: {
            id: trip.buses?.id,
            name: trip.buses?.name,
            total_seats: totalSeats,
            is_vip: trip.buses?.is_vip || false
          },
          trip_services: [{
            wifi: trip.amenities?.includes('wifi') || false,
            repas: trip.amenities?.includes('repas') || false,
            clim: trip.amenities?.includes('climatisation') || false,
            divertissement: trip.amenities?.includes('divertissement') || false
          }],
          available_seats: availableSeats,
          total_seats: totalSeats,
          occupied_seats: occupiedSeats,
          description: trip.description,
          amenities: trip.amenities || []
        }
      }))

      return formattedTrips
    } catch (error) {
      console.error('Erreur dans searchTrips:', error)
      throw error
    }
  },

  // Récupérer les détails d'un trajet spécifique
  async getTripDetails(tripId) {
    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          *,
          agencies:agency_id (
            name,
            id,
            phone,
            email
          ),
          buses!inner (
            id,
            name,
            total_seats,
            is_vip,
            license_plate
          )
        `)
        .eq('id', tripId)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du trajet:', error)
        throw error
      }

      return trip
    } catch (error) {
      console.error('Erreur dans getTripDetails:', error)
      throw error
    }
  },

  // Récupérer les sièges occupés pour un trajet
  async getOccupiedSeats(tripId) {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('trip_id', tripId)
        .eq('payment_status', 'completed')

      if (error) {
        console.error('Erreur lors de la récupération des sièges occupés:', error)
        throw error
      }

      return bookings ? bookings.map(booking => booking.seat_number) : []
    } catch (error) {
      console.error('Erreur dans getOccupiedSeats:', error)
      throw error
    }
  },

  // Récupérer la configuration des sièges pour un bus
  async getBusSeatingLayout(busId) {
    try {
      const { data: seatMaps, error } = await supabase
        .from('seat_maps')
        .select('*')
        .eq('bus_id', busId)
        .order('seat_number', { ascending: true })

      if (error) {
        console.error('Erreur lors de la récupération de la configuration des sièges:', error)
        throw error
      }

      return seatMaps || []
    } catch (error) {
      console.error('Erreur dans getBusSeatingLayout:', error)
      throw error
    }
  },

  // Vérifier la disponibilité d'un siège
  async isSeatAvailable(tripId, seatNumber) {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('trip_id', tripId)
        .eq('seat_number', seatNumber)
        .eq('payment_status', 'completed')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors de la vérification de disponibilité du siège:', error)
        throw error
      }

      return !booking // Retourne true si aucune réservation trouvée
    } catch (error) {
      console.error('Erreur dans isSeatAvailable:', error)
      throw error
    }
  },

  // Récupérer les trajets populaires (pour suggestions)
  async getPopularTrips(limit = 10) {
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          departure_city,
          arrival_city,
          agencies:agency_id (name)
        `)
        .eq('is_active', true)
        .limit(limit)

      if (error) {
        console.error('Erreur lors de la récupération des trajets populaires:', error)
        throw error
      }

      return trips || []
    } catch (error) {
      console.error('Erreur dans getPopularTrips:', error)
      throw error
    }
  },

  // Souscrire aux changements de trajets en temps réel
  subscribeToTrips(departure, arrival, date, callback) {
    try {
      const channelName = `trips_${departure}_${arrival}_${date}`.replace(/\s+/g, '_')
      
      return supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'trips',
            filter: `departure_city=eq.${departure}&arrival_city=eq.${arrival}`
          }, 
          callback
        )
        .subscribe()
    } catch (error) {
      console.error('Erreur dans subscribeToTrips:', error)
      return null
    }
  },

  // Fonction pour réinitialiser les places d'un trajet (test/debug)
  async resetTripSeats(tripId, availabilityPercentage = 0.8) {
    try {
      // Récupérer tous les sièges du trajet
      const { data: seats, error: fetchError } = await supabase
        .from('seat_maps')
        .select('id, seat_number')
        .eq('trip_id', tripId)

      if (fetchError) {
        console.error('Erreur lors de la récupération des sièges:', fetchError)
        throw fetchError
      }

      if (!seats || seats.length === 0) {
        console.log('Aucun siège trouvé pour ce trajet')
        return { message: 'Aucun siège trouvé' }
      }

      // Calculer combien de sièges rendre disponibles
      const totalSeats = seats.length
      const availableSeatsCount = Math.floor(totalSeats * availabilityPercentage)
      
      // Mélanger les sièges et en rendre certains disponibles
      const shuffledSeats = [...seats].sort(() => Math.random() - 0.5)
      const seatsToMakeAvailable = shuffledSeats.slice(0, availableSeatsCount)
      const seatsToMakeOccupied = shuffledSeats.slice(availableSeatsCount)

      // Mettre à jour les sièges disponibles
      if (seatsToMakeAvailable.length > 0) {
        const { error: updateAvailableError } = await supabase
          .from('seat_maps')
          .update({ is_available: true })
          .in('id', seatsToMakeAvailable.map(s => s.id))

        if (updateAvailableError) {
          console.error('Erreur lors de la mise à jour des sièges disponibles:', updateAvailableError)
        }
      }

      // Mettre à jour les sièges occupés
      if (seatsToMakeOccupied.length > 0) {
        const { error: updateOccupiedError } = await supabase
          .from('seat_maps')
          .update({ is_available: false })
          .in('id', seatsToMakeOccupied.map(s => s.id))

        if (updateOccupiedError) {
          console.error('Erreur lors de la mise à jour des sièges occupés:', updateOccupiedError)
        }
      }

      console.log(`Trajet ${tripId}: ${seatsToMakeAvailable.length} sièges disponibles sur ${totalSeats}`)
      
      return {
        tripId,
        totalSeats,
        availableSeats: seatsToMakeAvailable.length,
        occupiedSeats: seatsToMakeOccupied.length,
        availableSeatsNumbers: seatsToMakeAvailable.map(s => s.seat_number),
        occupiedSeatsNumbers: seatsToMakeOccupied.map(s => s.seat_number)
      }
    } catch (error) {
      console.error('Erreur dans resetTripSeats:', error)
      throw error
    }
  },

  // Réinitialiser TOUS les trajets pour avoir plus de places disponibles
  async resetAllTripsSeats() {
    try {
      console.log('🔄 Réinitialisation de tous les trajets...')
      
      // Récupérer tous les trajets
      const { data: allTrips, error: tripsError } = await supabase
        .from('trips')
        .select('id')
        .limit(20) // Limiter pour éviter les timeouts

      if (tripsError) {
        console.error('Erreur lors de la récupération des trajets:', tripsError)
        throw tripsError
      }

      console.log(`📋 ${allTrips.length} trajets trouvés`)

      // Réinitialiser chaque trajet
      const results = []
      for (const trip of allTrips) {
        try {
          const result = await this.resetTripSeats(trip.id, 0.75) // 75% de places disponibles
          results.push(result)
          console.log(`✅ Trajet ${trip.id}: ${result.availableSeats}/${result.totalSeats} places libres`)
        } catch (error) {
          console.error(`❌ Erreur pour trajet ${trip.id}:`, error)
        }
      }

      const totalAvailable = results.reduce((sum, r) => sum + r.availableSeats, 0)
      const totalSeats = results.reduce((sum, r) => sum + r.totalSeats, 0)
      
      console.log(`🎉 Réinitialisation terminée: ${totalAvailable}/${totalSeats} places disponibles au total`)
      
      return {
        message: 'Réinitialisation réussie',
        tripsUpdated: results.length,
        totalAvailableSeats: totalAvailable,
        totalSeats: totalSeats,
        availabilityPercentage: Math.round((totalAvailable / totalSeats) * 100)
      }
    } catch (error) {
      console.error('Erreur dans resetAllTripsSeats:', error)
      throw error
    }
  },

  // Se désabonner d'un channel
  unsubscribe(subscription) {
    try {
      if (subscription) {
        return supabase.removeChannel(subscription)
      }
    } catch (error) {
      console.error('Erreur dans unsubscribe:', error)
    }
  }
}
