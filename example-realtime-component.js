// Exemple d'utilisation dans un composant React
import React, { useState, useEffect } from 'react';
import { tripService } from '../services/supabase';

const TripSearchScreen = () => {
  const [trips, setTrips] = useState([]);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Recherche initiale
    loadTrips();

    // 🔥 Mise à jour temps réel
    const sub = tripService.subscribeToTrips(
      departure, 
      arrival, 
      date, 
      (payload) => {
        console.log('Changement détecté:', payload);
        
        if (payload.eventType === 'INSERT') {
          // Nouveau trajet ajouté
          setTrips(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          // Trajet modifié (places disponibles, prix, etc.)
          setTrips(prev => prev.map(trip => 
            trip.id === payload.new.id ? payload.new : trip
          ));
        } else if (payload.eventType === 'DELETE') {
          // Trajet supprimé
          setTrips(prev => prev.filter(trip => trip.id !== payload.old.id));
        }
      }
    );

    setSubscription(sub);

    // Nettoyage
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [departure, arrival, date]);

  const loadTrips = async () => {
    const { data, error } = await tripService.searchTrips(departure, arrival, date);
    if (data) setTrips(data);
  };

  return (
    // Votre UI ici
    <View>
      {trips.map(trip => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </View>
  );
};
