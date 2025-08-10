import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const authService = {
  // Inscription
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          telephone: userData.telephone || '',
          role: userData.role || 'client'
        }
      }
    })
    return { data, error }
  },

  // Connexion
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Connexion Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    })
    return { data, error }
  },

  // Déconnexion
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Écouter les changements d'auth
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Trip services
export const tripService = {
  // Rechercher des trajets
  async searchTrips(departure, arrival, date) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        agencies (
          id,
          name,
          description
        ),
        trip_services (*)
      `)
      .eq('departure_city', departure)
      .eq('arrival_city', arrival)
      .gte('departure_time', `${date}T00:00:00`)
      .lt('departure_time', `${date}T23:59:59`)
      .order('departure_time')
    
    return { data, error }
  },

  // 🆕 NOUVEAU : Écouter les changements de trajets en temps réel
  subscribeToTrips(departure, arrival, date, callback) {
    const channelName = `trips_${departure}_${arrival}_${date}`.replace(/\s+/g, '_');
    
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
  },

  // 🆕 NOUVEAU : Écouter les changements de sièges en temps réel
  subscribeToSeatMaps(tripId, callback) {
    return supabase
      .channel(`seat_maps_${tripId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'seat_maps',
          filter: `trip_id=eq.${tripId}`
        }, 
        callback
      )
      .subscribe()
  },

  // 🆕 NOUVEAU : Se désabonner d'un channel
  unsubscribe(subscription) {
    if (subscription) {
      return supabase.removeChannel(subscription)
    }
  },

  // Récupérer un trajet par ID
  async getTripById(id) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        agencies (
          id,
          nom,
          description,
          logo_url
        ),
        trip_services (*),
        seat_maps (*)
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  // Créer un trajet (agence)
  async createTrip(tripData) {
    const { data, error } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
    
    return { data, error }
  }
}

// Booking services
export const bookingService = {
  // Créer une réservation
  async createBooking(bookingData, userId) {
    // Convertir les sièges sélectionnés en format string pour seat_number
    let seatNumber = 'A1'; // Valeur par défaut
    if (bookingData.selectedSeats) {
      if (Array.isArray(bookingData.selectedSeats)) {
        seatNumber = bookingData.selectedSeats.length > 0 
          ? bookingData.selectedSeats.map(seat => 
              typeof seat === 'object' ? seat.seat_number || seat.number : seat
            ).join(', ')
          : 'A1';
      } else if (typeof bookingData.selectedSeats === 'string') {
        seatNumber = bookingData.selectedSeats;
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        trip_id: bookingData.trip_id || bookingData.trip?.id,
        passenger_name: bookingData.passenger_name || 'Passager',
        passenger_phone: bookingData.passenger_phone || '+237600000000',
        seat_number: seatNumber,
        total_price_fcfa: bookingData.totalPrice || 0,
        payment_method: bookingData.paymentMethod || 'Non spécifié',
        payment_status: 'completed',
        booking_status: 'confirmed',
        booking_reference: bookingData.booking_reference || `TH${Date.now()}`,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        trips!inner(
          *,
          agencies(name)
        )
      `)
      .single()
    
    return { data, error }
  },

  // Récupérer les réservations d'un utilisateur
  async getUserBookings(userId) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        trips!inner(
          *,
          agencies(name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Annuler une réservation
  async cancelBooking(bookingId, cancelReason = 'Annulé par le client') {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        booking_status: 'cancelled',
        cancel_reason: cancelReason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()
    
    return { data, error }
  },

  // Marquer les sièges comme réservés
  async reserveSeats(tripId, seatNumbers) {
    const { data, error } = await supabase
      .from('seat_maps')
      .update({ is_available: false })
      .eq('trip_id', tripId)
      .in('seat_number', seatNumbers)
      .select()
    
    return { data, error }
  },

  // Libérer les sièges (en cas d'annulation)
  async releaseSeats(tripId, seatNumbers) {
    const { data, error } = await supabase
      .from('seat_maps')
      .update({ is_available: true })
      .eq('trip_id', tripId)
      .in('seat_number', seatNumbers)
      .select()
    
    return { data, error }
  },

  // Libérer les sièges (en cas d'annulation)
  async releaseSeats(tripId, seatNumbers) {
    const { data, error } = await supabase
      .from('seat_maps')
      .update({ is_available: true })
      .eq('trip_id', tripId)
      .in('seat_number', seatNumbers)
      .select()
    
    return { data, error }
  }
}

// Agency services
export const agencyService = {
  // Récupérer une agence par ID utilisateur
  async getAgencyByUserId(userId) {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // Créer une agence
  async createAgency(agencyData) {
    const { data, error } = await supabase
      .from('agencies')
      .insert(agencyData)
      .select()
    
    return { data, error }
  }
}
