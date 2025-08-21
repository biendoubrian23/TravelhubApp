import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { bookingService } from '../services/bookingService';
import { supabase } from '../services/supabaseClient';

const RealtimeTestScreen = () => {
  const [output, setOutput] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Récupérer l'utilisateur connecté
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setOutput(`Utilisateur connecté: ${user?.email || 'Aucun'}\n\n`);
    };
    getUser();
  }, []);

  // Test rapide spécifique au problème utilisateur
  const runQuickTest = async () => {
    try {
      const { quickBookingTest, cleanupQuickTest } = await import('../tests/quickBookingTest');
      
      setOutput(prev => prev + '🧪 DÉMARRAGE TEST RAPIDE\n');
      setOutput(prev => prev + '=================================\n\n');
      
      const result = await quickBookingTest();
      
      setOutput(prev => prev + '📊 RÉSULTAT DU TEST RAPIDE:\n');
      setOutput(prev => prev + `✅ Succès: ${result.success ? 'OUI' : 'NON'}\n`);
      
      if (result.reservationId) {
        setOutput(prev => prev + `🎫 ID Réservation BD: ${result.reservationId}\n`);
      }
      
      if (result.error) {
        setOutput(prev => prev + `❌ Erreur: ${result.error}\n`);
      }
      
      // Nettoyage automatique
      setOutput(prev => prev + '\n🧹 Nettoyage automatique...\n');
      await cleanupQuickTest();
      
      setOutput(prev => prev + '=================================\n');
      setOutput(prev => prev + '🧪 TEST RAPIDE TERMINÉ\n\n');
      
    } catch (error) {
      setOutput(prev => prev + `❌ Erreur test rapide: ${error.message}\n`);
    }
  };

  // Test automatisé complet
  const runFullTest = async () => {
    try {
      const { testBookingSystem } = await import('../tests/bookingSystemTest');
      
      setOutput(prev => prev + '🚀 DÉMARRAGE TEST AUTOMATISÉ COMPLET\n');
      setOutput(prev => prev + '================================================\n\n');
      
      const result = await testBookingSystem();
      
      setOutput(prev => prev + '📊 RÉSULTATS DU TEST:\n');
      setOutput(prev => prev + `✅ Succès: ${result.success ? 'OUI' : 'NON'}\n`);
      
      if (result.validStatuses) {
        setOutput(prev => prev + `📋 Statuts valides: [${result.validStatuses.join(', ')}]\n`);
      }
      
      if (result.reservationId) {
        setOutput(prev => prev + `🎫 ID Réservation: ${result.reservationId}\n`);
      }
      
      setOutput(prev => prev + `💬 Message: ${result.message}\n`);
      
      if (result.error) {
        setOutput(prev => prev + `❌ Erreur: ${result.error}\n`);
      }
      
      setOutput(prev => prev + '================================================\n');
      setOutput(prev => prev + '🏁 TEST AUTOMATISÉ TERMINÉ\n\n');
      
    } catch (error) {
      setOutput(prev => prev + `❌ Erreur test automatisé: ${error.message}\n`);
    }
  };

  // Tester les valeurs enum payment_status
  const testEnums = async () => {
    try {
      setOutput(prev => prev + '=== TEST DES VALEURS ENUM PAYMENT_STATUS ===\n');
      
      const testValues = ['pending', 'completed', 'failed', 'refunded', 'processing', 'cancelled'];
      
      for (const value of testValues) {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .insert({
              trip_id: '5f546f00-833a-4e7a-a675-b37f4de9696e',
              user_id: user?.id || 'test-user',
              seat_number: '1',
              passenger_name: 'Test Enum',
              total_price_fcfa: 5000,
              booking_reference: `TEST_${Date.now()}_${value}`,
              booking_status: 'confirmed',
              payment_status: value
            })
            .select()
            .single();
            
          if (error) {
            setOutput(prev => prev + `❌ "${value}": ${error.message}\n`);
          } else {
            setOutput(prev => prev + `✅ "${value}": VALIDE (ID: ${data.id})\n`);
            await supabase.from('bookings').delete().eq('id', data.id);
          }
        } catch (err) {
          setOutput(prev => prev + `❌ "${value}": ${err.message}\n`);
        }
      }
      
      setOutput(prev => prev + '=== FIN TEST ENUMS ===\n\n');
    } catch (error) {
      setOutput(prev => prev + `Erreur générale: ${error.message}\n`);
    }
  };

  // Lister les réservations existantes
  const listBookings = async () => {
    try {
      setOutput(prev => prev + '=== LISTE DES RÉSERVATIONS ===\n');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        setOutput(prev => prev + `Erreur: ${error.message}\n`);
        return;
      }
      
      if (!data || data.length === 0) {
        setOutput(prev => prev + '📋 Aucune réservation trouvée\n');
      } else {
        setOutput(prev => prev + `📋 ${data.length} réservation(s) trouvée(s):\n`);
        data.forEach((booking, index) => {
          setOutput(prev => prev + 
            `${index + 1}. ID: ${booking.id} | Siège: ${booking.seat_number} | ` +
            `Status: ${booking.booking_status} | Paiement: ${booking.payment_status} | ` +
            `Passager: ${booking.passenger_name}\n`
          );
        });
      }
      
      setOutput(prev => prev + '=== FIN LISTE ===\n\n');
    } catch (error) {
      setOutput(prev => prev + `Erreur: ${error.message}\n`);
    }
  };

  // Tester la création d'une réservation complète
  const testCreateBooking = async () => {
    try {
      setOutput(prev => prev + '=== TEST CRÉATION RÉSERVATION ===\n');
      
      if (!user) {
        setOutput(prev => prev + '❌ Aucun utilisateur connecté\n');
        return;
      }
      
      const bookingData = {
        tripId: '5f546f00-833a-4e7a-a675-b37f4de9696e',
        userId: user.id,
        selectedSeats: [{ seat_number: 7 }],
        passengerName: 'Test Passager',
        passengerPhone: '+237123456789',
        totalPrice: 5500,
        paymentMethod: 'Orange Money'
      };
      
      setOutput(prev => prev + '📝 Tentative de création de réservation...\n');
      setOutput(prev => prev + `📝 Données: ${JSON.stringify(bookingData, null, 2)}\n`);
      
      const result = await bookingService.createBooking(bookingData);
      
      if (result && result.id) {
        if (result.id.startsWith('MOCK_')) {
          setOutput(prev => prev + `⚠️ Réservation mock créée (problème BD)\n`);
          setOutput(prev => prev + `   ID Mock: ${result.id}\n`);
        } else {
          setOutput(prev => prev + `✅ Réservation créée avec succès!\n`);
          setOutput(prev => prev + `   ID: ${result.id}\n`);
          setOutput(prev => prev + `   Référence: ${result.booking_reference}\n`);
          setOutput(prev => prev + `   Siège: ${result.seat_number}\n`);
        }
      } else {
        setOutput(prev => prev + `❌ Aucun résultat retourné\n`);
      }
      
      setOutput(prev => prev + '=== FIN TEST CRÉATION ===\n\n');
    } catch (error) {
      setOutput(prev => prev + `❌ Erreur: ${error.message}\n`);
    }
  };

  // Vérifier l'état des sièges
  const checkSeats = async () => {
    try {
      setOutput(prev => prev + '=== ÉTAT DES SIÈGES ===\n');
      
      const { data, error } = await supabase
        .from('seat_maps')
        .select('seat_number, is_available')
        .eq('trip_id', '5f546f00-833a-4e7a-a675-b37f4de9696e')
        .order('seat_number');
        
      if (error) {
        setOutput(prev => prev + `Erreur: ${error.message}\n`);
        return;
      }
      
      const occupied = data.filter(seat => !seat.is_available);
      const available = data.filter(seat => seat.is_available);
      
      setOutput(prev => prev + `💺 Total sièges: ${data.length}\n`);
      setOutput(prev => prev + `✅ Disponibles: ${available.length}\n`);
      setOutput(prev => prev + `❌ Occupés: ${occupied.length}\n`);
      
      if (occupied.length > 0) {
        setOutput(prev => prev + `Sièges occupés: ${occupied.map(s => s.seat_number).join(', ')}\n`);
      }
      
      setOutput(prev => prev + '=== FIN ÉTAT SIÈGES ===\n\n');
    } catch (error) {
      setOutput(prev => prev + `Erreur: ${error.message}\n`);
    }
  };

  // Nettoyer les données de test
  const cleanup = async () => {
    try {
      Alert.alert(
        'Confirmation',
        'Voulez-vous supprimer toutes les réservations de test ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                setOutput(prev => prev + '\n🧹 Nettoyage en cours...\n');
                
                // Supprimer les réservations de test
                const { error: bookingError } = await supabase
                  .from('bookings')
                  .delete()
                  .or('passenger_name.eq.Test Passager,passenger_name.eq.Test Enum,passenger_name.eq.Test User');
                  
                if (bookingError) {
                  setOutput(prev => prev + `❌ Erreur suppression bookings: ${bookingError.message}\n`);
                } else {
                  setOutput(prev => prev + `✅ Réservations de test supprimées\n`);
                }
                
                // Libérer tous les sièges du trip de test
                const { error: seatError } = await supabase
                  .from('seat_maps')
                  .update({ is_available: true })
                  .eq('trip_id', '5f546f00-833a-4e7a-a675-b37f4de9696e');
                  
                if (seatError) {
                  setOutput(prev => prev + `❌ Erreur libération sièges: ${seatError.message}\n`);
                } else {
                  setOutput(prev => prev + `✅ Tous les sièges libérés\n`);
                }
                
                setOutput(prev => prev + '🧹 Nettoyage terminé!\n\n');
              } catch (error) {
                setOutput(prev => prev + `❌ Erreur lors du nettoyage: ${error.message}\n`);
              }
            }
          }
        ]
      );
    } catch (error) {
      setOutput(prev => prev + `Erreur: ${error.message}\n`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Réservations TravelHub</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="🧪 Test Rapide" onPress={runQuickTest} color="#2196F3" />
        <Button title="🚀 Test Complet" onPress={runFullTest} color="#4CAF50" />
        <Button title="📋 Lister BD" onPress={listBookings} />
        <Button title="🔧 Tester Enums" onPress={testEnums} />
        <Button title="📝 Créer Test" onPress={testCreateBooking} />
        <Button title="💺 État Sièges" onPress={checkSeats} />
        <Button title="🧹 Nettoyer" onPress={cleanup} color="#ff6b6b" />
        <Button title="🗑️ Vider" onPress={() => setOutput('')} color="#ffa726" />
      </View>
      
      <ScrollView style={styles.output} showsVerticalScrollIndicator={true}>
        <Text style={styles.outputText}>{output}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  output: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    maxHeight: 500,
  },
  outputText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 14,
  },
});

export default RealtimeTestScreen;
