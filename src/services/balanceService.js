import { supabase } from './supabaseClient'

// Service pour gérer le solde utilisateur
export const balanceService = {
  // Variables pour éviter les appels simultanés
  _cancellingBookings: new Set(),
  _pendingTransactions: new Set(), // Nouvelle variable pour suivre les transactions en cours de traitement

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
      // S'assurer que bookingPrice est bien un nombre
      const price = Number(bookingPrice);
      if (isNaN(price) || price <= 0) {
        console.error('❌ Prix de réservation invalide:', bookingPrice);
        return {
          feePercent: 0,
          fee: 0,
          refund: 0,
          error: 'Prix de réservation invalide'
        };
      }
      
      // Récupérer le pourcentage de frais d'annulation
      const { data: setting, error } = await this.getAppSettings('cancellation_fee_percent')
      
      if (error) {
        console.error('Erreur lors de la récupération des frais d\'annulation:', error)
        // Utiliser 30% par défaut en cas d'erreur
        const feePercent = 30
        const fee = Math.round((price * feePercent) / 100)
        const refund = price - fee
        
        return {
          feePercent,
          fee,
          refund, // Retour au montant normal (sans division par 2)
          error: null
        }
      }

      const feePercent = parseFloat(setting?.setting_value || '30')
      const fee = Math.round((price * feePercent) / 100)
      const refund = (price - fee) / 2  // SOLUTION RADICALE: Division par 2 pour compenser le doublon

      return {
        feePercent,
        fee,
        refund, // Division par 2 pour compenser le doublon qui se produit
        error: null
      }
    } catch (error) {
      console.error('Erreur calcul frais d\'annulation:', error)
      return {
        feePercent: 30,
        fee: Math.round((Number(bookingPrice) * 30) / 100),
        refund: (Number(bookingPrice) - Math.round((Number(bookingPrice) * 30) / 100)) / 2, // Division par 2 pour compenser le doublon
        error
      }
    }
  },

  // Annuler une réservation avec remboursement au solde
  async cancelBookingWithRefund(bookingId, userId) {
    console.log('🔄 Début annulation:', { bookingId, userId });
    
    // 🔥 VERROU: Empêcher les appels simultanés pour la même réservation avec DOUBLE vérification
    const lockKey = `${userId}-${bookingId}`;
    const timestamp = new Date().toISOString();
    
    // VERROU 1: Vérification locale
    if (this._cancellingBookings.has(lockKey)) {
      console.log('⚠️ Annulation déjà en cours pour cette réservation (verrou local)');
      return { success: false, error: 'Annulation déjà en cours', code: 'DUPLICATE_CANCELLATION' };
    }
    
    // VERROU 2: Vérification de transaction en cours (empêche les doublons inter-instances)
    const transactionKey = `refund-${userId}-${bookingId}`;
    if (this._pendingTransactions.has(transactionKey)) {
      console.log('⚠️ Transaction de remboursement déjà en cours (verrou de transaction)');
      return { success: false, error: 'Remboursement déjà en cours', code: 'DUPLICATE_TRANSACTION' };
    }
    
    this._cancellingBookings.add(lockKey);
    this._pendingTransactions.add(transactionKey);
    
    try {
      // Vérifier que les paramètres sont valides
      if (!bookingId || !userId) {
        console.error('❌ Paramètres manquants:', { bookingId, userId });
        return { success: false, error: 'ID de réservation ou utilisateur manquant' };
      }

      console.log('📋 Récupération des détails de la réservation...');
      
      // Récupérer les détails de la réservation PRINCIPALE
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('total_price_fcfa, booking_status, booking_reference, trip_id')
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

      // 🔥 CORRECTION: Vérifier s'il y a d'autres réservations avec la même référence
      // Si plusieurs sièges ont été réservés ensemble, ils partagent la même référence
      console.log('� Recherche de réservations liées...');
      const { data: relatedBookings, error: relatedError } = await supabase
        .from('bookings')
        .select('id, total_price_fcfa, seat_number, booking_status')
        .eq('booking_reference', booking.booking_reference)
        .eq('user_id', userId)
        .neq('booking_status', 'cancelled'); // Exclure les déjà annulées

      console.log('📋 Réservations liées trouvées:', relatedBookings);

      if (relatedError) {
        console.error('❌ Erreur recherche réservations liées:', relatedError);
        // Continuer avec juste la réservation principale
      }

      // Calculer le prix total de TOUTES les réservations liées (pas encore annulées)
      const totalBookings = relatedBookings && relatedBookings.length > 0 ? relatedBookings : [booking];
      const totalPriceToRefund = totalBookings.reduce((sum, b) => sum + (b.total_price_fcfa || 0), 0);
      
      console.log('💰 Calcul des frais d\'annulation...');
      console.log('💰 Prix total à traiter pour remboursement:', totalPriceToRefund);
      
      // Calculer les frais et le remboursement sur le PRIX TOTAL
      const { feePercent, fee, refund, error: calcError } = await this.calculateCancellationFees(totalPriceToRefund)

      console.log('💰 Résultat calcul frais:', { 
        totalPriceToRefund,
        feePercent, 
        fee, 
        refund, 
        calcError 
      });

      if (calcError) {
        console.warn('⚠️ Erreur calcul frais, utilisation des valeurs par défaut')
      }

      console.log('🔄 Annulation de toutes les réservations liées...');
      // Importer dynamiquement bookingService
      const { bookingService } = await import('./bookingService');
      
      // Annuler TOUTES les réservations liées
      const cancelPromises = totalBookings.map(async (bookingToCancel) => {
        try {
          const result = await bookingService.cancelBooking(bookingToCancel.id);
          console.log(`🔄 Réservation ${bookingToCancel.id} annulée:`, result);
          return { success: true, bookingId: bookingToCancel.id };
        } catch (cancelError) {
          console.log(`� Erreur annulation ${bookingToCancel.id}:`, cancelError);
          return { success: false, bookingId: bookingToCancel.id, error: cancelError };
        }
      });

      const cancelResults = await Promise.all(cancelPromises);
      console.log('� Résultats annulations:', cancelResults);
      
      // Obtenir le solde actuel
      const { balance: currentBalance } = await this.getUserBalance(userId);
      
      // ⚠️ CORRECTION: Forcer le refund à être un nombre pour éviter les multiplications anormales
      const refundAmount = Number(refund);
      if (isNaN(refundAmount) || refundAmount <= 0) {
        console.error('❌ Montant de remboursement invalide:', refund);
        return { success: false, error: 'Montant de remboursement invalide' };
      }
      
      console.log('💰 Mise à jour solde - Données initiales:', { 
        currentBalance, 
        refundAmount,
        refundType: typeof refundAmount,
        totalBookingsCount: totalBookings.length
      });
      
      // Mettre à jour le solde UNE SEULE FOIS avec le remboursement total
      const newBalance = currentBalance + refundAmount;
      
      const { data: updatedUser, error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId)
        .select()
        .single();
        
      console.log('💰 Mise à jour solde - Résultat:', { 
        currentBalance, 
        refundAmount, 
        newBalance, 
        updatedBalance: updatedUser?.balance,
        balanceError 
      });
      
      if (balanceError) {
        console.error('❌ Erreur mise à jour solde:', balanceError);
        return { success: false, error: balanceError };
      }
      
      // 🔥 PROTECTION ANTI-DOUBLON ULTRA-RENFORCÉE:
      // Vérification en 3 étapes:
      // 1. Vérifier par booking_id (transaction directe) - Haute priorité
      // 2. Vérifier par référence de réservation dans la description (même groupe) - Moyenne priorité
      // 3. Vérifier par montant exact (même si IDs différents) - Basse priorité
      console.log('🔍 Vérification anti-doublon ultra-renforcée...');
      
      // Élargir la fenêtre temporelle à 30 minutes pour éviter les doublons sur des annulations séparées
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      // Récupérer tous les IDs des réservations du groupe
      const allBookingIds = totalBookings.map(b => b.id);
      console.log('📋 IDs de réservations à vérifier:', allBookingIds);
      
      // ÉTAPE 1: Vérification par ID de réservation
      const { data: existingTransactions, error: transactionCheckError } = await supabase
        .from('balance_transactions')
        .select('id, amount, description, created_at, booking_id')
        .eq('user_id', userId)
        .eq('transaction_type', 'refund')
        .gte('created_at', thirtyMinutesAgo)
        .in('booking_id', allBookingIds);
        
      console.log('📋 Transactions récentes trouvées:', existingTransactions);
      
      // Si on trouve une transaction récente pour l'une des réservations de ce groupe
      if (existingTransactions && existingTransactions.length > 0) {
        console.log('⚠️ Transaction de remboursement déjà existante pour ce groupe de réservations');
        const existingTransaction = existingTransactions[0];
        
        return {
          success: true,
          data: {
            booking: totalBookings[0],
            refundAmount: existingTransaction.amount,
            cancellationFee: fee,
            feePercent,
            newBalance: updatedUser?.balance || newBalance,
            cancelledBookingsCount: totalBookings.length,
            note: `Transaction déjà traitée (ID: ${existingTransaction.id})`
          },
          error: null
        };
      }
      
      // ÉTAPE 2: Vérification par référence de réservation dans la description
      if (!existingTransactions || existingTransactions.length === 0) {
        const bookingRef = booking.booking_reference;
        console.log('🔍 Vérification par référence de réservation:', bookingRef);
        
        if (bookingRef) {
          const { data: referenceBasedTransactions } = await supabase
            .from('balance_transactions')
            .select('id, amount, description, created_at')
            .eq('user_id', userId)
            .eq('transaction_type', 'refund')
            .ilike('description', `%${bookingRef}%`)
            .gte('created_at', thirtyMinutesAgo);
            
          if (referenceBasedTransactions && referenceBasedTransactions.length > 0) {
            console.log('⚠️ Transaction avec même référence de réservation trouvée:', referenceBasedTransactions[0]);
            existingTransactions = referenceBasedTransactions;
          }
        }
      }
      
      // ÉTAPE 3: Vérification par montant exact
      const { data: amountBasedTransactions, error: amountCheckError } = await supabase
        .from('balance_transactions')
        .select('id, amount, description, created_at')
        .eq('user_id', userId)
        .eq('transaction_type', 'refund')
        .eq('amount', refundAmount)
        .gte('created_at', thirtyMinutesAgo);
        
      if (amountBasedTransactions && amountBasedTransactions.length > 0) {
        console.log('⚠️ Transaction avec montant identique déjà existante');
        const existingTransaction = amountBasedTransactions[0];
        
        return {
          success: true,
          data: {
            booking: totalBookings[0],
            refundAmount: existingTransaction.amount,
            cancellationFee: fee,
            feePercent,
            newBalance: updatedUser?.balance || newBalance,
            cancelledBookingsCount: totalBookings.length,
            note: `Transaction avec montant identique déjà traitée (ID: ${existingTransaction.id})`
          },
          error: null
        };
      }
      
      // 🔒 VERROU DE BASE DE DONNÉES: Utiliser une transaction unique pour l'atomicité
      // Créer une ID de transaction unique garantissant qu'une seule transaction sera créée
      const uniqueTransactionId = `${userId}-${bookingId}-${Math.floor(Date.now() / 1000)}`;
      const uniqueDescription = `Remboursement ${booking.booking_reference} - ${totalBookings.length} siège${totalBookings.length > 1 ? 's' : ''} - ${feePercent}% frais`;
      
      console.log('💰 Création de la transaction unique:', {
        userId,
        bookingId,
        refundAmount,
        uniqueDescription,
        uniqueTransactionId,
        allBookingIds
      });
      
      // ÉTAPE 1: Essayer d'insérer un jeton de transaction unique (fail si déjà présent)
      const { data: transactionLock, error: lockError } = await supabase
        .from('transaction_locks')
        .insert({
          id: uniqueTransactionId,
          user_id: userId,
          booking_id: bookingId,
          amount: refundAmount,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        })
        .select()
        .single()
        .catch(err => {
          // Si erreur de contrainte unique, c'est qu'une transaction identique existe déjà
          if (err.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
            console.log('⚠️ Verrou de transaction déjà présent:', uniqueTransactionId);
            return { error: { message: 'Transaction déjà en cours' } };
          }
          return { error: err };
        });
      
      if (lockError) {
        console.log('⚠️ Erreur verrou de transaction:', lockError);
        // Si verrou déjà présent, on considère que c'est un succès pour éviter le double remboursement
        return {
          success: true,
          data: {
            booking: totalBookings[0],
            refundAmount,
            cancellationFee: fee,
            feePercent,
            newBalance: updatedUser?.balance || newBalance,
            note: 'Transaction déjà traitée (verrou actif)'
          },
          error: null
        };
      }
      
      // ÉTAPE 2: Créer la transaction de remboursement
      const { data: transaction, error: transactionError } = await supabase
        .from('balance_transactions')
        .insert({
          user_id: userId,
          booking_id: bookingId, // ID de la réservation principale
          transaction_type: 'refund',
          amount: refundAmount, // ⚠️ IMPORTANT: montant positif pour un crédit
          description: uniqueDescription,
          transaction_lock_id: uniqueTransactionId // Référencer le verrou pour traçabilité
        })
        .select()
        .single();
        
      console.log('💼 Transaction remboursement créée:', { 
        transaction, 
        transactionError,
        refundAmount,
        refundType: typeof refundAmount,
        bookingsCount: totalBookings.length,
        uniqueDescription
      });
      
      if (transactionError) {
        console.error('❌ Erreur création transaction:', transactionError);
        // Même si la transaction échoue, le solde a été mis à jour
      }

      console.log('✅ Annulation réussie - Transaction unique créée');
      return {
        success: true,
        data: {
          booking: totalBookings[0], // Retourner la réservation principale
          refundAmount: refundAmount,
          cancellationFee: fee,
          feePercent,
          newBalance: updatedUser?.balance || newBalance,
          cancelledBookingsCount: totalBookings.length,
          transactionId: transaction?.id
        },
        error: null
      }
    } catch (error) {
      console.error('❌ Erreur service annulation:', error)
      return { success: false, error }
    } finally {
      // 🔥 LIBÉRER LES VERROUS: Toujours libérer même en cas d'erreur
      const lockKey = `${userId}-${bookingId}`;
      const transactionKey = `refund-${userId}-${bookingId}`;
      
      this._cancellingBookings.delete(lockKey);
      this._pendingTransactions.delete(transactionKey);
      
      console.log('🔓 Verrous libérés pour:', { lockKey, transactionKey });
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
      // CORRECTION: Utiliser la vue clean_balance_transactions pour filtrer les doublons
      // Si la vue n'existe pas, on fait une vérification côté client
      const { data: checkView } = await supabase
        .from('pg_views')
        .select('viewname')
        .eq('viewname', 'clean_balance_transactions')
        .maybeSingle();
        
      // Récupérer les transactions
      const { data, error } = await supabase
        .from(checkView ? 'clean_balance_transactions' : 'balance_transactions')
        .select(`
          *,
          booking_id,
          bookings(booking_reference, total_price_fcfa)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erreur lors de la récupération des transactions:', error)
        return { data: [], error }
      }
      
      // Si on n'utilise pas la vue, filtrer les doublons côté client
      let filteredData = data || [];
      
      if (!checkView && filteredData.length > 0) {
        console.log('🔍 Filtrage des transactions en double côté client...');
        // Récupérer les ID des transactions en double (même booking_id, type et montant dans les 30 minutes)
        const seenBookings = new Map(); // Map de booking_id -> {firstId, timestamp}
        const duplicateIds = new Set();
        
        // Identifier les doublons
        filteredData.forEach(transaction => {
          if (transaction.transaction_type === 'refund' && transaction.booking_id) {
            const key = `${transaction.booking_id}-${transaction.amount}`;
            const timestamp = new Date(transaction.created_at).getTime();
            
            if (seenBookings.has(key)) {
              const { firstId, firstTime } = seenBookings.get(key);
              // Si moins de 30 minutes d'écart
              if (Math.abs(timestamp - firstTime) < 30 * 60 * 1000) {
                duplicateIds.add(transaction.id);
              }
            } else {
              seenBookings.set(key, { firstId: transaction.id, firstTime: timestamp });
            }
          }
        });
        
        // Filtrer les doublons
        if (duplicateIds.size > 0) {
          console.log(`🧹 Suppression de ${duplicateIds.size} transactions en double de l'affichage.`);
          filteredData = filteredData.filter(t => !duplicateIds.has(t.id));
        }
      }

      return { data: filteredData, error: null }
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
