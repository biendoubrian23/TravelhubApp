import { useState, useEffect, useRef } from 'react';
import { tripService } from '../services/supabase';

// Hook pour les trajets en temps réel
export const useRealtimeTrips = (departure, arrival, date) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Chargement initial
        const { data, error: fetchError } = await tripService.searchTrips(departure, arrival, date);
        
        if (fetchError) {
          setError(fetchError);
          return;
        }

        if (isMounted) {
          setTrips(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const setupSubscription = () => {
      // Callback pour les changements en temps réel
      const handleRealtimeChange = (payload) => {
        console.log('🔄 Changement de trajet détecté:', payload);

        if (!isMounted) return;

        switch (payload.eventType) {
          case 'INSERT':
            // Nouveau trajet ajouté
            setTrips(prev => {
              const exists = prev.find(trip => trip.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new].sort((a, b) => a.departure_time.localeCompare(b.departure_time));
            });
            break;

          case 'UPDATE':
            // Trajet modifié (prix, places disponibles, etc.)
            setTrips(prev => prev.map(trip => 
              trip.id === payload.new.id 
                ? { ...trip, ...payload.new }
                : trip
            ));
            break;

          case 'DELETE':
            // Trajet supprimé
            setTrips(prev => prev.filter(trip => trip.id !== payload.old.id));
            break;
        }
      };

      // Démarrer la subscription
      subscriptionRef.current = tripService.subscribeToTrips(
        departure, 
        arrival, 
        date, 
        handleRealtimeChange
      );
    };

    // Lancer le chargement et la subscription
    if (departure && arrival && date) {
      loadTrips().then(() => {
        setupSubscription();
      });
    }

    // Nettoyage
    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        tripService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [departure, arrival, date]);

  const refreshTrips = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await tripService.searchTrips(departure, arrival, date);
      if (fetchError) {
        setError(fetchError);
      } else {
        setTrips(data || []);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    trips,
    loading,
    error,
    refreshTrips
  };
};

// Hook pour les sièges en temps réel
export const useRealtimeSeatMaps = (tripId) => {
  const [seatMaps, setSeatMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadSeatMaps = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Chargement initial via getTripById
        const { data, error: fetchError } = await tripService.getTripById(tripId);
        
        if (fetchError) {
          setError(fetchError);
          return;
        }

        if (isMounted) {
          setSeatMaps(data?.seat_maps || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const setupSubscription = () => {
      // Callback pour les changements de sièges
      const handleSeatChange = (payload) => {
        console.log('💺 Changement de siège détecté:', payload);

        if (!isMounted) return;

        switch (payload.eventType) {
          case 'INSERT':
            // Nouveau siège ajouté
            setSeatMaps(prev => {
              const exists = prev.find(seat => seat.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
            break;

          case 'UPDATE':
            // Siège modifié (disponibilité, réservation, etc.)
            setSeatMaps(prev => prev.map(seat => 
              seat.id === payload.new.id 
                ? { ...seat, ...payload.new }
                : seat
            ));
            break;

          case 'DELETE':
            // Siège supprimé
            setSeatMaps(prev => prev.filter(seat => seat.id !== payload.old.id));
            break;
        }
      };

      // Démarrer la subscription
      subscriptionRef.current = tripService.subscribeToSeatMaps(
        tripId, 
        handleSeatChange
      );
    };

    // Lancer le chargement et la subscription
    if (tripId) {
      loadSeatMaps().then(() => {
        setupSubscription();
      });
    }

    // Nettoyage
    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        tripService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [tripId]);

  const refreshSeatMaps = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await tripService.getTripById(tripId);
      if (fetchError) {
        setError(fetchError);
      } else {
        setSeatMaps(data?.seat_maps || []);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    seatMaps,
    loading,
    error,
    refreshSeatMaps
  };
};
