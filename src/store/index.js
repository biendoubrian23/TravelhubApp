import { create } from 'zustand'
import { authService, bookingService } from '../services/supabase'

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
    set(state => ({
      bookings: [newBooking, ...state.bookings]
    }))
    
    // Sauvegarder dans Supabase si l'utilisateur est connecté
    if (user?.id) {
      try {
        const bookingData = {
          trip_id: booking.trip?.id,
          selectedSeats: booking.seatNumber ? [booking.seatNumber] : [],
          totalPrice: booking.price,
          paymentMethod: booking.paymentMethod,
          booking_reference: newBooking.id
        }
        
        const { data, error } = await bookingService.createBooking(bookingData, user.id)
        
        if (error) {
          console.error('Erreur lors de la sauvegarde dans Supabase:', error)
        } else {
          console.log('Réservation sauvegardée dans Supabase:', data)
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
      }
    }
    
    return newBooking
  },

  loadBookings: async (user) => {
    set({ isLoading: true })
    try {
      if (user?.id) {
        // Charger depuis Supabase pour les utilisateurs connectés
        const { data, error } = await bookingService.getUserBookings(user.id)
        
        if (error) {
          console.error('Erreur lors du chargement des réservations:', error)
          // Fallback vers les données fictives
          const mockBookings = [
            {
              id: 'BK001',
              departure: 'Yaoundé',
              arrival: 'Douala',
              date: '2025-07-28',
              time: '08:00',
              price: 3500,
              status: 'completed',
              busType: 'VIP',
              agency: 'Central Voyages',
              seatNumber: 'A12',
              paymentMethod: 'Orange Money',
              bookingDate: '2025-07-25',
              duration: '3h 30min'
            }
          ]
          set({ bookings: mockBookings, isLoading: false })
        } else {
          // Transformer les données Supabase au format attendu
          const transformedBookings = data.map(booking => ({
            id: booking.id,
            departure: booking.trips.departure_city,
            arrival: booking.trips.arrival_city,
            date: booking.trips.departure_time.split('T')[0],
            time: booking.trips.departure_time.split('T')[1].substring(0, 5),
            price: booking.total_price,
            status: booking.booking_status === 'confirmed' ? 'upcoming' : booking.booking_status,
            busType: booking.trips.bus_type || 'VIP',
            agency: booking.trips.agencies?.name || 'TravelHub',
            seatNumber: booking.seat_numbers.join(', '),
            paymentMethod: booking.payment_method,
            bookingDate: booking.created_at.split('T')[0],
            duration: booking.trips.duration || '3h 30min'
          }))
          
          set({ bookings: transformedBookings, isLoading: false })
        }
      } else {
        // Pour l'instant, on utilise des données fictives pour les utilisateurs non connectés
        const mockBookings = [
          {
            id: 'BK001',
            departure: 'Yaoundé',
            arrival: 'Douala',
            date: '2025-07-28',
            time: '08:00',
            price: 3500,
            status: 'completed',
            busType: 'VIP',
            agency: 'Central Voyages',
            seatNumber: 'A12',
            paymentMethod: 'Orange Money',
            bookingDate: '2025-07-25',
            duration: '3h 30min'
          },
          {
            id: 'BK002',
            departure: 'Douala',
            arrival: 'Yaoundé',
            date: '2025-08-05',
            time: '14:30',
            price: 3500,
            status: 'upcoming',
            busType: 'Classique',
            agency: 'Garantie Express',
            seatNumber: 'B05',
            paymentMethod: 'MTN MoMo',
            bookingDate: '2025-08-02',
            duration: '3h 45min'
          }
        ]
        
        set({ bookings: mockBookings, isLoading: false })
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
      set({ isLoading: false })
    }
  },

  getBookingsByStatus: (status) => {
    const { bookings } = get()
    if (status === 'all') return bookings
    return bookings.filter(booking => booking.status === status)
  },

  cancelBooking: (bookingId) => {
    set(state => ({
      bookings: state.bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'cancelled', cancelReason: 'Annulé par le client' }
          : booking
      )
    }))
  }
}))

// Store de recherche de trajets
export const useSearchStore = create((set) => ({
  searchParams: {
    departure: '',
    arrival: '',
    date: new Date(), // Date actuelle du téléphone
    returnDate: null,
    passengers: 1,
    isRoundTrip: false
  },
  
  searchResults: [],
  returnSearchResults: [],
  isSearching: false,

  // Actions
  setSearchParams: (params) => set((state) => ({
    searchParams: { ...state.searchParams, ...params }
  })),

  setSearchResults: (results) => set({ searchResults: results }),

  setReturnSearchResults: (results) => set({ returnSearchResults: results }),

  setIsSearching: (isSearching) => set({ isSearching }),

  clearSearch: () => set({ 
    searchResults: [],
    returnSearchResults: [],
    searchParams: {
      departure: '',
      arrival: '',
      date: new Date(),
      returnDate: null,
      passengers: 1,
      isRoundTrip: false
    }
  })
}))

// Store de réservation
export const useBookingStore = create((set) => ({
  currentTrip: null,
  selectedSeats: [],
  bookingData: null,
  paymentMethod: null,
  returnTrip: null,
  returnSelectedSeats: [],
  bookingStep: 'outbound', // 'outbound', 'return', 'seats', 'recap', 'payment'

  // Actions
  setCurrentTrip: (trip) => set({ currentTrip: trip }),

  setSelectedSeats: (seats) => set({ selectedSeats: seats }),

  setBookingData: (data) => set({ bookingData: data }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setReturnTrip: (trip) => set({ returnTrip: trip }),

  setReturnSelectedSeats: (seats) => set({ returnSelectedSeats: seats }),

  setBookingStep: (step) => set({ bookingStep: step }),

  clearBooking: () => set({
    currentTrip: null,
    selectedSeats: [],
    bookingData: null,
    paymentMethod: null,
    returnTrip: null,
    returnSelectedSeats: [],
    bookingStep: 'outbound'
  }),

  getTotalPrice: () => {
    const { currentTrip, selectedSeats, returnTrip, returnSelectedSeats } = useBookingStore.getState()
    let total = 0
    
    if (currentTrip && selectedSeats.length) {
      total += currentTrip.prix * selectedSeats.length
    }
    
    if (returnTrip && returnSelectedSeats.length) {
      total += returnTrip.prix * returnSelectedSeats.length
    }
    
    return total
  }
}))

// Store pour les agences
export const useAgencyStore = create((set) => ({
  agency: null,
  trips: [],
  isLoading: false,

  // Actions
  setAgency: (agency) => set({ agency }),

  setTrips: (trips) => set({ trips }),

  setIsLoading: (isLoading) => set({ isLoading }),

  addTrip: (trip) => set((state) => ({
    trips: [...state.trips, trip]
  })),

  updateTrip: (updatedTrip) => set((state) => ({
    trips: state.trips.map(trip => 
      trip.id === updatedTrip.id ? updatedTrip : trip
    )
  })),

  removeTrip: (tripId) => set((state) => ({
    trips: state.trips.filter(trip => trip.id !== tripId)
  }))
}))
