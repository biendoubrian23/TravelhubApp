import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { bookingService } from '../services/bookingService'
import logger from '../utils/logger'

// Store d'authentification
export const useAuthStore = create(devtools((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isSigningIn: false, // Flag pour indiquer qu'une connexion est en cours

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),

  signOut: async () => {
    try {
      console.log('🚪 Début de la déconnexion...');
      
      // Importer Supabase
      const { supabase } = await import('../services/supabase')
      
      // Déconnecter de Supabase
      console.log('🔄 Déconnexion de Supabase...');
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Erreur lors de la déconnexion Supabase:', error)
        // Même en cas d'erreur, nettoyer le store local
      } else {
        console.log('✅ Déconnexion Supabase réussie');
      }
      
      // Nettoyer le store
      console.log('🧹 Nettoyage du store local...');
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false,
        isSigningIn: false
      })
      
      // Nettoyer aussi le store des réservations
      const { useBookingsStore } = await import('./index')
      useBookingsStore.setState({
        bookings: [],
        isLoading: false
      })
      
      console.log('✅ Déconnexion complète réussie');
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error)
      // Nettoyer le store même en cas d'erreur
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false,
        isSigningIn: false
      })
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  // Fonction de connexion
  signIn: async (email, password) => {
    try {
      set({ isLoading: true, isSigningIn: true })
      
      // Importer Supabase et authService
      const { supabase } = await import('../services/supabase')
      const { authService } = await import('../services/supabase')
      
      console.log('Tentative de connexion pour:', email)
      
      // Appeler la fonction de connexion du service
      const { data, error } = await authService.signIn(email, password)
      
      if (error) {
        // Log simple pour le débogage, pas d'erreur
        console.log('Connexion échouée pour:', email, '- Raison:', error.message)
        set({ isLoading: false, isAuthenticated: false, user: null, isSigningIn: false })
        return { data, error } // Retourner l'erreur sans throw
      }
      
      if (data?.user) {
        console.log('Connexion réussie pour:', data.user.email)
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false,
          isSigningIn: false 
        })
        return { data, error: null }
      }
      
      set({ isLoading: false, isAuthenticated: false, user: null, isSigningIn: false })
      return { data, error }
    } catch (error) {
      // Log pour les erreurs système uniquement
      console.log('Erreur système lors de la connexion:', error.message)
      set({ isLoading: false, isAuthenticated: false, user: null, isSigningIn: false })
      return { data: null, error }
    }
  },

  // Fonction d'inscription
  signUp: async (email, password, userData = {}) => {
    try {
      set({ isLoading: true })
      
      // Importer authService
      const { authService } = await import('../services/supabase')
      
      console.log('Tentative d\'inscription pour:', email)
      
      // Appeler la fonction d'inscription du service
      const { data, error } = await authService.signUp(email, password, userData)
      
      if (error) {
        console.error('Erreur d\'inscription:', error)
        set({ isLoading: false })
        throw error
      }
      
      if (data?.user) {
        console.log('Inscription réussie pour:', data.user.email)
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false 
        })
        return { data, error: null }
      }
      
      set({ isLoading: false })
      return { data, error }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      set({ isLoading: false })
      throw error
    }
  },

  // Fonction d'initialisation pour vérifier l'état d'authentification
  initialize: async () => {
    try {
      set({ isLoading: true })
      
      // Importer Supabase ici pour éviter les imports circulaires
      const { supabase } = await import('../services/supabase')
      
      // Utiliser getSession au lieu de getUser pour éviter l'erreur "Auth session missing!"
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.warn('Erreur lors de la récupération de la session:', error)
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }
      
      if (session?.user) {
        console.log('Session utilisateur trouvée:', session.user.email)
        set({ user: session.user, isAuthenticated: true, isLoading: false })
      } else {
        console.log('Aucune session utilisateur active')
        set({ user: null, isAuthenticated: false, isLoading: false })
      }

      // Écouter les changements d'état d'authentification
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Changement d\'état auth:', event, session?.user?.email || 'Aucun utilisateur')
        
        // Ne pas réagir aux changements d'état si on est en train de se connecter manuellement
        const currentState = get()
        if (currentState.isSigningIn) {
          console.log('Connexion manuelle en cours, ignorer le changement d\'état auth')
          return
        }
        
        // Filtrer strictement les événements - ignorer INITIAL_SESSION complètement
        if (event === 'INITIAL_SESSION') {
          console.log('Événement INITIAL_SESSION ignoré pour éviter la navigation')
          return
        }
        
        // Ne réagir qu'aux événements de connexion/déconnexion réels
        if (event === 'SIGNED_IN' && session?.user) {
          // Vérifier si l'utilisateur est déjà connecté pour éviter les boucles
          if (currentState.isAuthenticated && currentState.user?.id === session.user.id) {
            console.log('Utilisateur déjà connecté, ignorer SIGNED_IN')
            return
          }
          console.log('Utilisateur connecté avec succès via listener')
          set({ user: session.user, isAuthenticated: true })
        } else if (event === 'SIGNED_OUT') {
          console.log('Utilisateur déconnecté via listener')
          set({ user: null, isAuthenticated: false })
        }
        // Tous les autres événements sont ignorés
      })
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'auth:', error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  }
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
    // Protection contre les doublons basée sur tripId et userId
    const tripId = booking.trip?.id || booking.tripId || booking.trip_id;
    if (!tripId) {
      console.error('❌ Aucun trip_id trouvé dans:', booking);
      throw new Error('trip_id manquant pour la sauvegarde');
    }

    // Vérifier s'il y a déjà une réservation pour ce voyage et cet utilisateur
    const { bookings } = get();
    const existingBooking = bookings.find(b => 
      (b.trip?.id === tripId || b.tripId === tripId || b.trip_id === tripId) && 
      (b.userId === user?.id || b.user_id === user?.id)
    );

    if (existingBooking) {
      console.log('🛑 Réservation existante trouvée, pas de duplication:', existingBooking);
      return existingBooking;
    }

    console.log('🚀 Création nouvelle réservation pour trip:', tripId, 'user:', user?.id);

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
        const bookingData = {
          tripId: tripId,
          userId: user.id,
          seatNumber: booking.seatNumber,
          // Ne plus passer les infos génériques - le service les récupérera depuis la table users
          totalPrice: booking.total_price_fcfa || booking.price || booking.totalPrice || 0,
          paymentMethod: booking.paymentMethod || booking.payment_method || 'orange_money',
          selectedSeats: booking.selectedSeats // Pour les sièges VIP
        }
        
        console.log('💾 Sauvegarde réservation en BD avec données mappées:', bookingData)
        
        // Utiliser createMultipleBookings pour créer une réservation par siège
        const data = await bookingService.createMultipleBookings(bookingData)
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`✅ ${data.length} réservations sauvegardées dans Supabase:`, data)
          
          // Supprimer la réservation locale temporaire et la remplacer par les données BD
          set((state) => {
            const filteredBookings = state.bookings.filter(b => b.id !== newBooking.id);
            console.log('🧹 Suppression réservation locale temporaire, reste:', filteredBookings.length);
            return { bookings: filteredBookings };
          })
          
          // Recharger les réservations depuis Supabase pour avoir les vraies données
          logger.info('🔄 Rechargement des réservations depuis BD après sauvegarde');
          setTimeout(() => {
            get().loadBookings(user);
          }, 500);
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
      const currentState = get();
      const currentBookings = Array.isArray(currentState.bookings) ? currentState.bookings : []; // Préserver les réservations existantes
      
      if (user?.id) {
        logger.info('🔄 Chargement des réservations depuis Supabase pour:', user.email);
        
        try {
          // Charger depuis Supabase pour les utilisateurs connectés
          const data = await bookingService.getUserBookings(user.id)
          
          if (data && data.length > 0) {
            logger.info('📋 Données brutes de Supabase:', data.length, 'réservations');
            
            // 🚫 SUPPRESSION DU GROUPEMENT - Chaque réservation reste séparée
            // Transformer chaque réservation individuellement (PAS de groupement)
            const transformedBookings = data.map((booking) => {
              const trip = booking.trips || {};
              const agency = trip.agencies || {};
              
              console.log('🔄 Transformation individuelle:', {
                bookingId: booking.id,
                bookingRef: booking.booking_reference,
                siege: booking.seat_number,
                prix: booking.total_price_fcfa,
                ville_depart: trip.ville_depart,
                ville_arrivee: trip.ville_arrivee
              });
              
              
              return {
                id: booking.id,
                departure: trip.ville_depart || 'Ville inconnue',
                arrival: trip.ville_arrivee || 'Ville inconnue', 
                date: trip.date || new Date().toISOString().split('T')[0],
                time: trip.heure_dep || '00:00',
                price: booking.total_price_fcfa || 0, // Prix individuel de la réservation
                status: booking.booking_status === 'confirmed' ? 'upcoming' : (booking.booking_status || 'pending'),
                busType: trip.bus_type || 'standard',
                agency: agency.nom || 'TravelHub',
                seatNumber: booking.seat_number || 'N/A', // UN SEUL siège
                seatNumbers: [booking.seat_number], // Array avec UN seul siège
                bookingDate: booking.created_at,
                bookingReference: booking.booking_reference,
                passengerName: booking.passenger_name || 'Nom non défini',
                passengerPhone: booking.passenger_phone || 'Non défini',
                paymentMethod: booking.payment_method || 'Non spécifié',
                paymentStatus: booking.payment_status || 'pending',
                // Informations du trajet pour affichage détaillé
                trip: trip,
                trip_id: booking.trip_id,
                supabaseId: booking.id, // ID de la BD
                syncedWithDB: true,
                multiSeat: false, // Toujours false maintenant - chaque réservation est individuelle
                allBookingIds: [booking.id] // Un seul ID par réservation
              };
            }).filter(booking => booking.id); // Filtrer les réservations sans ID
            
            // Pour éviter les doublons, on privilégie UNIQUEMENT les données Supabase
            // ✅ SUPPRESSION COMPLÈTE des réservations locales temporaires
            // Les données Supabase sont la source de vérité unique
            
            logger.info(`📋 Réservations Supabase: ${transformedBookings.length}`);
            
            const allBookings = transformedBookings; // ✅ Seulement Supabase
            
            logger.info(`📋 Total réservations: ${allBookings.length} (toutes depuis BD)`);
            
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
    if (!Array.isArray(bookings)) {
      console.warn('getBookingsByStatus - bookings is not an array:', typeof bookings);
      return [];
    }
    return bookings.filter(booking => booking.status === status)
  },

  removeBooking: (bookingId) => set(state => ({
    bookings: Array.isArray(state.bookings) ? state.bookings.filter(booking => booking.id !== bookingId) : []
  })),

  updateBookingStatus: (bookingId, status) => set(state => ({
    bookings: state.bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status } : booking
    )
  })),

  cancelBooking: async (bookingId) => {
    try {
      console.log('🗑️ Annulation de la réservation:', bookingId);
      
      // Importer le service
      const { bookingService } = await import('../services/bookingService');
      
      // Annuler dans la base de données
      await bookingService.cancelBooking(bookingId);
      console.log('✅ Réservation annulée en BD');
      
      // Mettre à jour le store local
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === bookingId || booking.supabaseId === bookingId
            ? { ...booking, status: 'cancelled', booking_status: 'cancelled' }
            : booking
        )
      }));
      
      console.log('✅ Store local mis à jour');
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      throw error;
    }
  }
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
  searchResults: [],
  returnSearchResults: [],
  isLoading: false,
  isSearching: false,

  setSearchParams: (params) => set(state => ({
    searchParams: { ...state.searchParams, ...params }
  })),

  setResults: (results) => set({ results }),
  
  setSearchResults: (searchResults) => set({ searchResults: Array.isArray(searchResults) ? searchResults : [] }),
  
  setReturnSearchResults: (returnSearchResults) => set({ returnSearchResults: Array.isArray(returnSearchResults) ? returnSearchResults : [] }),

  setLoading: (isLoading) => set({ isLoading }),
  
  setIsSearching: (isSearching) => set({ isSearching }),

  clearResults: () => set({ results: [], searchResults: [], returnSearchResults: [] })
}))

// Store de sélection de sièges
export const useSeatSelectionStore = create((set, get) => ({
  selectedSeats: [],
  seatMap: [],
  tripId: null,

  setTripId: (tripId) => set({ tripId }),

  setSeatMap: (seatMap) => set({ seatMap }),

  selectSeat: (seat) => set(state => {
    const safeSelectedSeats = Array.isArray(state.selectedSeats) ? state.selectedSeats : [];
    const isSelected = safeSelectedSeats.find(s => s.id === seat.id)
    if (isSelected) {
      return {
        selectedSeats: safeSelectedSeats.filter(s => s.id !== seat.id)
      }
    } else {
      return {
        selectedSeats: [...safeSelectedSeats, seat]
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
  currentTrip: null,
  
  // Sièges sélectionnés
  selectedSeats: [],
  returnSelectedSeats: [],
  
  // Étape de réservation
  bookingStep: 'outbound', // 'outbound', 'return', 'seats', 'payment', 'confirmation'
  
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
  setCurrentTrip: (currentTrip) => set({ currentTrip }),
  setSelectedSeats: (seats) => set({ selectedSeats: seats }),
  setReturnSelectedSeats: (seats) => set({ returnSelectedSeats: seats }),
  setBookingStep: (step) => set({ bookingStep: step }),
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
