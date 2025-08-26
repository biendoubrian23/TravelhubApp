import { supabase } from './supabaseClient'

// Service pour gérer le solde utilisateur
export const balanceService = {
  // Récupérer le solde d'un utilisateur
  async getUserBalance(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du solde:', error)
        return { balance: 0, error }
      }

      return { balance: data?.balance || 0, error: null }
    } catch (error) {
      console.error('Erreur service balance:', error)
      return { balance: 0, error }
    }
  },

  // Récupérer les paramètres de l'application (comme les frais d'annulation)
  async getAppSettings(settingKey = null) {
    try {
      let query = supabase.from('app_settings').select('*')
      
      if (settingKey) {
        query = query.eq('setting_key', settingKey).single()
      }

      const { data, error } = await query

      if (error) {
        console.error('Erreur lors de la récupération des paramètres:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erreur service paramètres:', error)
      return { data: null, error }
    }
  },

  // Calculer les frais d'annulation et le remboursement
  async calculateCancellationFees(bookingPrice) {
    try {
      // Récupérer le pourcentage de frais d'annulation
      const { data: setting, error } = await this.getAppSettings('cancellation_fee_percent')
      
      if (error) {
        console.error('Erreur lors de la récupération des frais d\'annulation:', error)
        // Utiliser 30% par défaut en cas d'erreur
        const feePercent = 30
        const fee = (bookingPrice * feePercent) / 100
        const refund = bookingPrice - fee
        
        return {
          feePercent,
          fee,
          refund,
          error: null
        }
      }

      const feePercent = parseFloat(setting?.setting_value || '30')
      const fee = (bookingPrice * feePercent) / 100
      const refund = bookingPrice - fee

      return {
        feePercent,
        fee,
        refund,
        error: null
      }
    } catch (error) {
      console.error('Erreur calcul frais d\'annulation:', error)
      return {
        feePercent: 30,
        fee: (bookingPrice * 30) / 100,
        refund: bookingPrice - (bookingPrice * 30) / 100,
        error
      }
    }
  },

  // Annuler une réservation avec remboursement au solde
  async cancelBookingWithRefund(bookingId, userId) {
    console.log('🔄 Début annulation:', { bookingId, userId });
    
    try {
      // Vérifier que les paramètres sont valides
      if (!bookingId || !userId) {
        console.error('❌ Paramètres manquants:', { bookingId, userId });
        return { success: false, error: 'ID de réservation ou utilisateur manquant' };
      }

      console.log('📋 Récupération des détails de la réservation...');
      
      // Récupérer les détails de la réservation
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('total_price_fcfa, booking_status')
        .eq('id', bookingId)
        .eq('user_id', userId)
        .single()

      console.log('📋 Résultat requête booking:', { booking, bookingError });

      if (bookingError || !booking) {
        console.error('❌ Erreur récupération booking:', bookingError);
        return { success: false, error: bookingError || 'Réservation non trouvée' }
      }

      if (booking.booking_status === 'cancelled') {
        console.log('⚠️ Réservation déjà annulée');
        return { success: false, error: 'Cette réservation est déjà annulée' }
      }

      console.log('💰 Calcul des frais d\'annulation...');
      // Calculer les frais et le remboursement
      const { feePercent, fee, refund, error: calcError } = await this.calculateCancellationFees(booking.total_price_fcfa)

      console.log('💰 Résultat calcul frais:', { feePercent, fee, refund, calcError });

      if (calcError) {
        console.warn('⚠️ Erreur calcul frais, utilisation des valeurs par défaut')
      }

      console.log('🔄 Mise à jour du statut de la réservation...');
      // Mettre à jour SEULEMENT le statut - le trigger se chargera du reste
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({ 
          booking_status: 'cancelled'
        })
        .eq('id', bookingId)
        .eq('user_id', userId)
        .select()

      console.log('🔄 Résultat mise à jour:', { updatedBooking, updateError });

      if (updateError) {
        console.error('❌ Erreur lors de l\'annulation:', updateError)
        return { success: false, error: updateError }
      }

      console.log('✅ Annulation réussie');
      return {
        success: true,
        data: {
          booking: updatedBooking[0],
          refundAmount: refund,
          cancellationFee: fee,
          feePercent
        },
        error: null
      }
    } catch (error) {
      console.error('❌ Erreur service annulation:', error)
      return { success: false, error }
    }
  },

  // Traiter un paiement en utilisant le solde si possible
  async processPaymentWithBalance(userId, tripId, seatNumbers, totalPrice, paymentMethod) {
    try {
      console.log('🔍 Traitement paiement avec solde:', { userId, tripId, seatNumbers, totalPrice, paymentMethod });
      
      // 🔥 CORRECTION TEMPORAIRE: Utiliser bookingService au lieu de la fonction PostgreSQL
      // pour éviter les problèmes de références BK et d'accolades
      
      // Vérifier le solde de l'utilisateur d'abord
      const { balance: userBalance } = await this.getUserBalance(userId);
      console.log('💰 Solde utilisateur:', userBalance);
      
      if (userBalance < totalPrice) {
        return { 
          success: false, 
          error: { message: 'Solde insuffisant' },
          data: {
            amountFromBalance: userBalance,
            amountToPay: totalPrice - userBalance,
            balanceSufficient: false
          }
        };
      }
      
      // Utiliser bookingService pour créer les réservations (génère des références TH)
      const { bookingService } = await import('./bookingService');
      
      const bookingData = {
        userId: userId,
        tripId: tripId,
        seatNumbers: Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers],
        totalPrice: totalPrice,
        paymentMethod: paymentMethod || 'balance'
      };
      
      console.log('🚀 Création réservations via bookingService:', bookingData);
      
      const result = await bookingService.createMultipleBookings(bookingData);
      
      if (result.success && result.bookings) {
        // Débiter le solde après création réussie des réservations
        const debitResult = await this.debitBalance(
          userId, 
          totalPrice, 
          `Paiement réservation ${result.bookingReference}`,
          result.bookings[0]?.id || result.bookings[0]?.supabaseId
        );
        
        if (debitResult.success) {
          return {
            success: true,
            data: {
              bookingId: result.bookingReference,
              amountFromBalance: totalPrice,
              amountToPay: 0,
              balanceSufficient: true,
              bookings: result.bookings,
              newBalance: debitResult.newBalance || 0
            },
            error: null
          };
        } else {
          // Si le débit échoue, on pourrait annuler les réservations ici
          console.error('❌ Échec du débit, mais réservations créées');
          return { success: false, error: debitResult.error };
        }
      } else {
        return { success: false, error: result.error || 'Échec création réservations' };
      }
      
    } catch (error) {
      console.error('Erreur service paiement avec solde:', error)
      return { success: false, error }
    }
  },

  // Débiter le solde utilisateur
  async debitBalance(userId, amount, description, bookingId = null) {
    try {
      console.log('💳 Débit solde:', { userId, amount, description, bookingId });
      
      // Vérifier le solde actuel
      const { balance: currentBalance } = await this.getUserBalance(userId);
      if (currentBalance < amount) {
        return { success: false, error: 'Solde insuffisant' };
      }
      
      // Débiter le solde
      const { data, error } = await supabase
        .from('users')
        .update({ balance: currentBalance - amount })
        .eq('id', userId)
        .select('balance')
        .single();
        
      if (error) {
        console.error('❌ Erreur débit solde:', error);
        return { success: false, error };
      }
      
      // Enregistrer la transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('balance_transactions')
        .insert({
          user_id: userId,
          booking_id: bookingId,
          transaction_type: 'payment',
          amount: -amount,
          description: description
        })
        .select()
        .single();
        
      if (transactionError) {
        console.error('❌ Erreur enregistrement transaction:', transactionError);
        // Même si la transaction échoue, le débit a réussi
      }
      
      console.log('✅ Solde débité avec succès, nouveau solde:', data.balance);
      return { success: true, newBalance: data.balance, transaction };
      
    } catch (error) {
      console.error('❌ Erreur débit solde:', error);
      return { success: false, error };
    }
  },

  // Récupérer l'historique des transactions de solde
  async getBalanceTransactions(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('balance_transactions')
        .select(`
          *,
          booking_id,
          bookings(booking_reference, total_price_fcfa, trips(departure_city, arrival_city))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erreur lors de la récupération des transactions:', error)
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Erreur service transactions:', error)
      return { data: [], error }
    }
  },

  // Récupérer le résumé du solde utilisateur
  async getUserBalanceSummary(userId) {
    try {
      const { data, error } = await supabase
        .from('user_balance_summary')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du résumé de solde:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erreur service résumé solde:', error)
      return { data: null, error }
    }
  },

  // Mettre à jour les paramètres de l'application (pour les admins)
  async updateAppSetting(settingKey, settingValue, description = null) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: settingValue,
          description: description,
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Erreur lors de la mise à jour du paramètre:', error)
        return { success: false, error }
      }

      return { success: true, data: data[0], error: null }
    } catch (error) {
      console.error('Erreur service mise à jour paramètre:', error)
      return { success: false, error }
    }
  }
}

export default balanceService
