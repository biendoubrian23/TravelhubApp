import { balanceService } from './balanceService';
import { useAuthStore } from '../store';

// Service pour gérer les paiements avec intégration du solde utilisateur
export const paymentService = {
  // Calculer la répartition du paiement (solde + externe)
  async calculatePaymentBreakdown(userId, totalAmount) {
    try {
      const { balance, error } = await balanceService.getUserBalance(userId);
      
      if (error) {
        console.error('Erreur lors de la récupération du solde:', error);
        return {
          userBalance: 0,
          amountFromBalance: 0,
          amountToPay: totalAmount,
          canUseBalance: false,
          error
        };
      }

      const userBalance = balance || 0;
      const amountFromBalance = Math.min(userBalance, totalAmount);
      const amountToPay = Math.max(0, totalAmount - amountFromBalance);
      const canUseBalance = userBalance > 0;

      return {
        userBalance,
        amountFromBalance,
        amountToPay,
        canUseBalance,
        error: null
      };
    } catch (error) {
      console.error('Erreur calcul répartition paiement:', error);
      return {
        userBalance: 0,
        amountFromBalance: 0,
        amountToPay: totalAmount,
        canUseBalance: false,
        error
      };
    }
  },

  // Traiter un paiement complet (avec solde + méthode externe si nécessaire)
  async processPayment(paymentData) {
    const {
      userId,
      tripId,
      seatNumbers,
      totalPrice,
      paymentMethod,
      useBalance = true
    } = paymentData;

    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      // Calculer la répartition du paiement
      const breakdown = await this.calculatePaymentBreakdown(userId, totalPrice);
      
      if (breakdown.error) {
        throw breakdown.error;
      }

      // Si l'utilisateur veut utiliser son solde et qu'il en a
      if (useBalance && breakdown.canUseBalance) {
        // Utiliser la fonction Supabase pour traiter le paiement avec solde
        const result = await balanceService.processPaymentWithBalance(
          userId,
          tripId,
          seatNumbers,
          totalPrice,
          paymentMethod
        );

        if (result.success) {
          return {
            success: true,
            bookingId: result.data.bookingId,
            paymentDetails: {
              totalAmount: totalPrice,
              amountFromBalance: result.data.amountFromBalance,
              amountPaidExternal: result.data.amountToPay,
              balanceSufficient: result.data.balanceSufficient,
              method: paymentMethod
            },
            requiresExternalPayment: result.data.amountToPay > 0,
            externalPaymentAmount: result.data.amountToPay,
            error: null
          };
        } else {
          throw new Error(result.error?.message || 'Erreur lors du traitement du paiement');
        }
      } else {
        // Paiement sans utilisation du solde (méthode traditionnelle)
        // TODO: Intégrer avec votre système de paiement existant
        // Pour l'instant, on simule un paiement externe
        
        return {
          success: true,
          bookingId: null, // À définir après création de la réservation
          paymentDetails: {
            totalAmount: totalPrice,
            amountFromBalance: 0,
            amountPaidExternal: totalPrice,
            balanceSufficient: false,
            method: paymentMethod
          },
          requiresExternalPayment: true,
          externalPaymentAmount: totalPrice,
          error: null
        };
      }
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du traitement du paiement'
      };
    }
  },

  // Valider si l'utilisateur peut effectuer un paiement
  async validatePayment(userId, amount) {
    try {
      const breakdown = await this.calculatePaymentBreakdown(userId, amount);
      
      return {
        valid: true,
        breakdown,
        canPayWithBalance: breakdown.amountToPay === 0,
        needsExternalPayment: breakdown.amountToPay > 0,
        error: breakdown.error
      };
    } catch (error) {
      console.error('Erreur validation paiement:', error);
      return {
        valid: false,
        error: error.message || 'Erreur lors de la validation du paiement'
      };
    }
  },

  // Simuler un paiement externe (Orange Money, Stripe, etc.)
  async processExternalPayment(amount, method, additionalData = {}) {
    try {
      // TODO: Remplacer par l'intégration réelle avec Orange Money, Stripe, etc.
      
      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulation d'un succès (90% de chance de succès)
      const success = Math.random() > 0.1;
      
      if (success) {
        return {
          success: true,
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount,
          method,
          processedAt: new Date().toISOString(),
          error: null
        };
      } else {
        throw new Error('Échec du paiement externe');
      }
    } catch (error) {
      console.error('Erreur paiement externe:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du paiement externe'
      };
    }
  },

  // Obtenir les méthodes de paiement disponibles selon le solde
  async getAvailablePaymentMethods(userId, amount) {
    try {
      const breakdown = await this.calculatePaymentBreakdown(userId, amount);
      
      const methods = [];
      
      // Paiement par solde uniquement (si suffisant)
      if (breakdown.canUseBalance && breakdown.amountToPay === 0) {
        methods.push({
          id: 'balance_only',
          name: 'Solde utilisateur',
          description: 'Paiement complet par votre solde',
          icon: 'wallet',
          amount: breakdown.amountFromBalance,
          available: true
        });
      }
      
      // Paiement mixte (solde + externe)
      if (breakdown.canUseBalance && breakdown.amountToPay > 0) {
        methods.push({
          id: 'balance_plus_external',
          name: 'Solde + Mobile Money',
          description: `${breakdown.amountFromBalance.toLocaleString()} FCFA du solde + ${breakdown.amountToPay.toLocaleString()} FCFA par Mobile Money`,
          icon: 'card',
          amount: amount,
          amountFromBalance: breakdown.amountFromBalance,
          amountExternal: breakdown.amountToPay,
          available: true
        });
      }
      
      // Paiement externe uniquement
      methods.push({
        id: 'external_only',
        name: 'Mobile Money / Carte',
        description: 'Paiement complet par Mobile Money ou carte bancaire',
        icon: 'card',
        amount: amount,
        available: true
      });
      
      return {
        methods,
        breakdown,
        error: null
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des méthodes de paiement:', error);
      return {
        methods: [{
          id: 'external_only',
          name: 'Mobile Money / Carte',
          description: 'Paiement par Mobile Money ou carte bancaire',
          icon: 'card',
          amount: amount,
          available: true
        }],
        breakdown: null,
        error
      };
    }
  },

  // Formater les montants pour l'affichage
  formatAmount(amount) {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  },

  // Obtenir le statut d'un paiement
  getPaymentStatusInfo(status) {
    switch (status) {
      case 'completed':
        return {
          color: '#4CAF50',
          icon: 'checkmark-circle',
          text: 'Payé',
          description: 'Paiement effectué avec succès'
        };
      case 'pending':
        return {
          color: '#FF9800',
          icon: 'time',
          text: 'En attente',
          description: 'Paiement en cours de traitement'
        };
      case 'failed':
        return {
          color: '#F44336',
          icon: 'close-circle',
          text: 'Échec',
          description: 'Échec du paiement'
        };
      case 'refunded':
        return {
          color: '#2196F3',
          icon: 'arrow-back-circle',
          text: 'Remboursé',
          description: 'Paiement remboursé'
        };
      default:
        return {
          color: '#757575',
          icon: 'help-circle',
          text: 'Inconnu',
          description: 'Statut inconnu'
        };
    }
  }
};

export default paymentService;
