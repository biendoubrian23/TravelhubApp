import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { bookingService } from '../services/bookingService'

// Store d'authentification
export const useAuthStore = create(devtools((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),

  signOut: () => set({ 
    user: null, 
    isAuthenticated: false 
  }),

  setLoading: (isLoading) => set({ isLoading })
}), {
  name: 'auth-store'
}))

// Store des agences (pour les agences)
export const useAgencyStore = create(devtools((set, get) => ({
  agency: null,
  trips: [],
  bookings: [],
  analytics: {
    totalRevenue: 0,
    totalTrips: 0,
    totalBookings: 0,
    occupancyRate: 0
  },
  isLoading: false,

  setAgency: (agency) => set({ agency }),

  loadTrips: async () => {
    set({ isLoading: true })
    try {
      // TODO: Intégrer avec l'API Supabase
      set({ isLoading: false })
    } catch (error) {
      console.error('Erreur lors du chargement des trajets:', error)
      set({ isLoading: false })
    }
  },

  loadBookings: async () => {
    set({ isLoading: true })
    try {
      // TODO: Intégrer avec l'API Supabase
      set({ isLoading: false })
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error)
      set({ isLoading: false })
    }
  },

  addTrip: (trip) => set(state => ({
    trips: [trip, ...state.trips]
  })),

  updateTrip: (tripId, updates) => set(state => ({
    trips: state.trips.map(trip =>
      trip.id === tripId ? { ...trip, ...updates } : trip
    )
  })),

  deleteTrip: (tripId) => set(state => ({
    trips: state.trips.filter(trip => trip.id !== tripId)
  }))
}), {
  name: 'agency-store'
}))

// Store des réservations
export const useBookingsStore = create(devtools((set, get) => ({
  bookings: [],
  isLoading: false,

  addBooking: async (booking, user) => {
    const newBooking = {
      ...booking,
      id: `BK${Date.now()}`,
      bookingDate: new Date().toISOString().split('T')[0],
    }
    
    // Ajouter au store local
    set(state => {
      const updatedBookings = [newBooking, ...state.bookings];
      console.log('Store - Ajout réservation, total après ajout:', updatedBookings.length);
      console.log('Store - Nouvelle réservation ajoutée:', newBooking);
      return { bookings: updatedBookings };
    })
    
    // Sauvegarde Supabase ACTIVE
    if (user?.id) {
      try {
        // Mapping et validation des données pour Supabase
        const tripId = booking.trip?.id || booking.trip_id;
        if (!tripId) {
          console.error('❌ Aucun trip_id trouvé dans:', booking);
          throw new Error('trip_id manquant pour la sauvegarde Supabase');
        }

        const bookingData = {
          tripId: tripId,
          userId: user.id,
          seatNumber: booking.seatNumber,
          // Ne plus passer les infos génériques - le service les récupérera depuis la table users
          totalPrice: booking.price || 0,
          paymentMethod: booking.paymentMethod || 'orange_money',
          selectedSeats: booking.selectedSeats // Pour les sièges VIP
        }
        
        console.log('💾 Sauvegarde réservation en BD avec données mappées:', bookingData)
        const data = await bookingService.createMultipleBookings(bookingData)
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`✅ ${data.length} réservations sauvegardées dans Supabase:`, data)
          
          // Mettre à jour la réservation locale avec les IDs de la BD
          set((state) => {
            const updatedBookings = state.bookings.map(b => 
              b.id === booking.id 
                ? { ...b, supabaseIds: data.map(d => d.id), syncedWithDB: true }
                : b
            );
            return { bookings: updatedBookings };
          })
        }
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error)
        
        // Marquer la réservation comme non synchronisée
        set((state) => {
          const updatedBookings = state.bookings.map(b => 
            b.id === booking.id 
              ? { ...b, syncedWithDB: false, syncError: error.message }
              : b
          );
          return { bookings: updatedBookings };
        })
      }
    } else {
      console.log('⚠️ Utilisateur non connecté - sauvegarde locale seulement')
    }
    
    return newBooking
  },

  loadBookings: async (user) => {
    set({ isLoading: true })
    try {
      const currentBookings = get().bookings; // Préserver les réservations existantes
      
      if (user?.id) {
        console.log('🔄 Chargement des réservations depuis Supabase pour:', user.email);
        
        try {
          // Charger depuis Supabase pour les utilisateurs connectés
          const data = await bookingService.getUserBookings(user.id)
          console.log('✅ Réservations récupérées depuis Supabase:', data);
          
          if (data && data.length > 0) {
            // Transformer les données Supabase au format attendu avec protection
            const transformedBookings = data.map(booking => {
              // Protection contre les relations manquantes
              const trip = booking.trips || {};
              const agency = trip.agencies || {};
              
              console.log('🔄 Transformation booking:', {
                bookingId: booking.id,
                trip: trip,
                ville_depart: trip.ville_depart,
                ville_arrivee: trip.ville_arrivee,
                date: trip.date,
                heure_dep: trip.heure_dep,
                agency: agency
              });
              
              return {
                id: booking.id,
                departure: trip.ville_depart || 'Ville inconnue',
                arrival: trip.ville_arrivee || 'Ville inconnue', 
                date: trip.date || new Date().toISOString().split('T')[0],
                time: trip.heure_dep || '00:00',
                price: booking.total_price_fcfa || 0,
                status: booking.booking_status === 'confirmed' ? 'upcoming' : (booking.booking_status || 'pending'),
                busType: trip.bus_type || 'standard',
                agency: agency.nom || 'TravelHub',
                seatNumber: booking.seat_number || 'N/A',
                bookingDate: booking.created_at,
                bookingReference: booking.booking_reference || booking.id,
                passengerName: booking.passenger_name || 'Nom non défini',
                passengerPhone: booking.passenger_phone || 'Non défini',
                paymentMethod: booking.payment_method || 'Non spécifié',
                paymentStatus: booking.payment_status || 'pending',
                // Informations du trajet pour affichage détaillé
                trip: trip,
                trip_id: booking.trip_id,
                supabaseId: booking.id, // ID de la BD
                syncedWithDB: true
              };
            }).filter(booking => booking.id); // Filtrer les réservations sans ID
            
            // Combiner avec les réservations locales (si elles ne sont pas déjà synchronisées)
            const localOnlyBookings = currentBookings.filter(local => 
              !transformedBookings.find(db => db.supabaseId === local.supabaseId)
            );
            
            const allBookings = [...transformedBookings, ...localOnlyBookings];
            
            console.log(`📋 Total réservations: ${allBookings.length} (${transformedBookings.length} BD + ${localOnlyBookings.length} locales)`);
            
            set({ 
              bookings: allBookings,
              isLoading: false 
            });
          } else {
            console.log('📭 Aucune réservation trouvée pour cet utilisateur');
            
            // Ne plus créer de données de test automatiquement
            set({ 
              bookings: [],
              isLoading: false 
            });
          }
        } catch (supabaseError) {
          console.error('❌ Erreur lors du chargement des réservations:', supabaseError)
          // Garder les réservations locales existantes en cas d'erreur
          set({ isLoading: false })
        }
      } else {
        console.log('👤 Utilisateur non connecté - mode local uniquement');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('❌ Erreur générale loadBookings:', error);
      set({ isLoading: false });
    }
  },

  getBookingsByStatus: (status) => {
    const { bookings } = get()
    return bookings.filter(booking => booking.status === status)
  },

  removeBooking: (bookingId) => set(state => ({
    bookings: state.bookings.filter(booking => booking.id !== bookingId)
  })),

  updateBookingStatus: (bookingId, status) => set(state => ({
    bookings: state.bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status } : booking
    )
  }))
}), {
  name: 'bookings-store'
}))

// Store de recherche
export const useSearchStore = create((set) => ({
  searchParams: {
    departure: '',
    arrival: '',
    date: null,
    returnDate: null,
    passengers: 1,
    isRoundTrip: false,
    busType: 'all' // 'all', 'standard', 'vip'
  },
  results: [],
  isLoading: false,

  setSearchParams: (params) => set(state => ({
    searchParams: { ...state.searchParams, ...params }
  })),

  setResults: (results) => set({ results }),

  setLoading: (isLoading) => set({ isLoading }),

  clearResults: () => set({ results: [] })
}))

// Store de sélection de sièges
export const useSeatSelectionStore = create((set, get) => ({
  selectedSeats: [],
  seatMap: [],
  tripId: null,

  setTripId: (tripId) => set({ tripId }),

  setSeatMap: (seatMap) => set({ seatMap }),

  selectSeat: (seat) => set(state => {
    const isSelected = state.selectedSeats.find(s => s.id === seat.id)
    if (isSelected) {
      return {
        selectedSeats: state.selectedSeats.filter(s => s.id !== seat.id)
      }
    } else {
      return {
        selectedSeats: [...state.selectedSeats, seat]
      }
    }
  }),

  clearSelection: () => set({ selectedSeats: [] }),

  getTotalPrice: () => {
    const { selectedSeats } = get()
    return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0)
  }
}))

// Store de réservation (pour le flow de réservation)
export const useBookingStore = create((set, get) => ({
  // Données du trajet sélectionné
  trip: null,
  returnTrip: null,
  
  // Sièges sélectionnés
  selectedSeats: [],
  returnSelectedSeats: [],
  
  // Données de recherche
  searchParams: {
    departure: '',
    arrival: '',
    date: null,
    returnDate: null,
    passengers: 1,
    isRoundTrip: false,
    busType: 'all'
  },
  
  // Prix total
  totalPrice: 0,
  
  // État du voyage (aller simple ou aller-retour)
  isRoundTrip: false,
  
  // Actions
  setTrip: (trip) => set({ trip }),
  setReturnTrip: (returnTrip) => set({ returnTrip }),
  setSelectedSeats: (seats) => set({ selectedSeats: seats }),
  setReturnSelectedSeats: (seats) => set({ returnSelectedSeats: seats }),
  setSearchParams: (params) => set(state => ({
    searchParams: { ...state.searchParams, ...params }
  })),
  setTotalPrice: (price) => set({ totalPrice: price }),
  setIsRoundTrip: (isRoundTrip) => set({ isRoundTrip }),
  
  // Calculer le prix total automatiquement
  calculateTotalPrice: () => {
    const { selectedSeats, returnSelectedSeats, trip, returnTrip } = get()
    
    const outboundPrice = selectedSeats.reduce((total, seat) => {
      const basePrice = trip?.prix || 0
      const modifier = seat.price_modifier_fcfa || 0
      return total + basePrice + modifier
    }, 0)
    
    const returnPrice = returnSelectedSeats.reduce((total, seat) => {
      const basePrice = returnTrip?.prix || 0
      const modifier = seat.price_modifier_fcfa || 0
      return total + basePrice + modifier
    }, 0)
    
    const totalPrice = outboundPrice + returnPrice
    set({ totalPrice })
    return totalPrice
  },
  
  // Réinitialiser le store
  reset: () => set({
    trip: null,
    returnTrip: null,
    selectedSeats: [],
    returnSelectedSeats: [],
    totalPrice: 0,
    isRoundTrip: false
  }),
  
  // Obtenir toutes les données de réservation
  getBookingData: () => {
    const state = get()
    return {
      trip: state.trip,
      returnTrip: state.returnTrip,
      selectedSeats: state.selectedSeats,
      returnSelectedSeats: state.returnSelectedSeats,
      searchParams: state.searchParams,
      totalPrice: state.totalPrice,
      isRoundTrip: state.isRoundTrip,
      outboundTrip: state.trip, // Alias pour compatibilité
    }
  }
}))
