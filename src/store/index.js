import { create } from 'zustand'
import { authService } from '../services'
import { bookingService } from '../services/bookingService'

// Store d'authentification
export const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),

  signIn: async (email, password) => {
    const { data, error } = await authService.signIn(email, password)
    if (data.user) {
      get().setUser(data.user)
    }
    return { data, error }
  },

  signUp: async (email, password, userData) => {
    const { data, error } = await authService.signUp(email, password, userData)
    if (data.user) {
      get().setUser(data.user)
    }
    return { data, error }
  },

  signOut: async () => {
    const { error } = await authService.signOut()
    if (!error) {
      set({ user: null, isAuthenticated: false })
    }
    return { error }
  },

  initialize: async () => {
    try {
      const user = await authService.getCurrentUser()
      get().setUser(user)
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ isLoading: false })
    }
  },

  updateProfile: async (profileData) => {
    try {
      const { user } = get()
      if (!user) throw new Error('User not authenticated')
      
      // TODO: Mettre à jour le profil via Supabase
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...profileData
        }
      }
      
      set({ user: updatedUser })
      return { data: updatedUser, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}))

// Store des réservations
export const useBookingsStore = create((set, get) => ({
  bookings: [],
  isLoading: false,

  // Actions
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
          paymentMethod: booking.paymentMethod || 'mobile_money',
          selectedSeats: booking.selectedSeats // Pour les sièges VIP
        }
        
        console.log('💾 Sauvegarde réservation en BD avec données mappées:', bookingData)
        const data = await bookingService.createBooking(bookingData)
        
        if (data) {
          console.log('✅ Réservation sauvegardée dans Supabase:', data)
          
          // Mettre à jour la réservation locale avec l'ID de la BD
          set((state) => {
            const updatedBookings = state.bookings.map(b => 
              b.id === booking.id 
                ? { ...b, supabaseId: data.id, syncedWithDB: true }
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
            console.log('📋 Aucune réservation trouvée en BD, création de données de test...');
            
            // Créer quelques réservations de test avec de vraies villes
            const testBookings = [
              {
                id: 'test-1',
                departure: 'Douala',
                arrival: 'Yaoundé',
                date: '2025-08-25',
                time: '08:00',
                price: 5500,
                status: 'confirmed',
                busType: 'VIP',
                agency: 'Central Voyages',
                seatNumber: '12A',
                bookingDate: new Date().toISOString(),
                bookingReference: 'TV001',
                passengerName: user.user_metadata?.full_name || 'Test User',
                passengerPhone: user.user_metadata?.phone || '+237600000000',
                paymentMethod: 'Orange Money',
                paymentStatus: 'confirmed',
                syncedWithDB: false
              },
              {
                id: 'test-2', 
                departure: 'Bafoussam',
                arrival: 'Douala',
                date: '2025-08-26',
                time: '14:30',
                price: 3000,
                status: 'upcoming',
                busType: 'Standard',
                agency: 'TravelHub',
                seatNumber: '8B',
                bookingDate: new Date().toISOString(),
                bookingReference: 'TV002',
                passengerName: user.user_metadata?.full_name || 'Test User',
                passengerPhone: user.user_metadata?.phone || '+237600000000',
                paymentMethod: 'Stripe',
                paymentStatus: 'confirmed',
                syncedWithDB: false
              }
            ];
            
            const allBookings = [...testBookings, ...currentBookings];
            
            set({ 
              bookings: allBookings,
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
}))

// Store de recherche
export const useSearchStore = create((set) => ({
  searchParams: {
    departure: '',
    arrival: '',
    date: new Date(),
    returnDate: null,
    passengers: 1,
    busType: 'all',
    isRoundTrip: false
  },
  searchResults: [],
  isLoading: false,

  // Actions
  setSearchParams: (params) => set(state => ({
    searchParams: { ...state.searchParams, ...params }
  })),

  setSearchResults: (results) => set({ searchResults: results }),

  setLoading: (isLoading) => set({ isLoading })
}))

// Store de sélection de siège
export const useSeatSelectionStore = create((set, get) => ({
  selectedSeats: [],
  seatMap: [],
  isLoading: false,

  // Actions
  selectSeat: (seatNumber) => set(state => {
    const isSelected = state.selectedSeats.includes(seatNumber)
    return {
      selectedSeats: isSelected
        ? state.selectedSeats.filter(seat => seat !== seatNumber)
        : [...state.selectedSeats, seatNumber]
    }
  }),

  clearSelectedSeats: () => set({ selectedSeats: [] }),

  setSeatMap: (seatMap) => set({ seatMap }),

  setLoading: (isLoading) => set({ isLoading })
}))

// Store de réservation en cours
export const useBookingStore = create((set, get) => ({
  currentTrip: null,
  returnTrip: null,
  bookingStep: 'selection', // 'selection', 'seats', 'payment', 'confirmation'
  
  // Actions
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  
  setReturnTrip: (trip) => set({ returnTrip: trip }),
  
  setBookingStep: (step) => set({ bookingStep: step }),
  
  clearBooking: () => set({ 
    currentTrip: null, 
    returnTrip: null, 
    bookingStep: 'selection' 
  })
}))
