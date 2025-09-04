import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import logger from '../../utils/logger';

const PaymentScreen = ({ route, navigation }) => {
  const { 
    trip, 
    outboundTrip, 
    returnTrip, 
    selectedSeats, 
    returnSelectedSeats, 
    totalPrice, 
    originalPrice,
    referralDiscount = 0,
    discountApplied = false,
    rewardsToUse = [],
    isRoundTrip = false,
    searchParams,
    userInfo 
  } = route.params;
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showMixedPaymentModal, setShowMixedPaymentModal] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [selectedMixedPaymentMethod, setSelectedMixedPaymentMethod] = useState(null);
  
  // États pour les formulaires de paiement
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Déplacer les logs dans useEffect pour éviter la répétition
  useEffect(() => {
    logger.info('PaymentScreen - searchParams:', searchParams);
    logger.info('PaymentScreen - isRoundTrip:', isRoundTrip);
  }, []); // Exécuter seulement au montage du composant

  // Helper functions pour formater les prix et récupérer les infos méthodes
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '0';
    return Number(price).toLocaleString();
  };
  
  const getPaymentMethodName = (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.name : methodId;
  };
  
  // Fonction pour afficher les options de paiement mixte
  const showMixedPaymentOptions = (amount) => {
    setRemainingAmount(amount);
    setSelectedMixedPaymentMethod(null);
    setShowMixedPaymentModal(true);
  };
  
  // Fonction pour traiter le paiement mixte
  const handleMixedPayment = async () => {
    if (!selectedMixedPaymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement pour le montant restant.');
      return;
    }
    
    // Validation pour mobile money en paiement mixte
    if ((selectedMixedPaymentMethod === 'orange_money' || selectedMixedPaymentMethod === 'mtn_momo') && !phoneNumber) {
      Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone pour le paiement mobile money.');
      return;
    }
    
    try {
      setProcessing(true);
      const { useAuthStore } = require('../../store');
      const { balanceService } = require('../../services/balanceService');
      const { bookingService } = require('../../services/bookingService');
      const { user } = useAuthStore.getState();
      
      console.log('🔄 Début paiement mixte:', {
        userBalance,
        totalPrice,
        remainingAmount,
        selectedMixedPaymentMethod,
        phoneNumber: selectedMixedPaymentMethod.includes('money') ? phoneNumber : 'N/A'
      });
      
      // Mapper les sièges sélectionnés de façon sécurisée (même logique que mobile money)
      let mappedSeats = [];
      if (Array.isArray(selectedSeats)) {
        mappedSeats = selectedSeats.map(seat => {
          const seatNumber = seat.seat_number || seat.number || seat;
          return String(seatNumber);
        });
      } else if (selectedSeats) {
        const seatNumber = selectedSeats.seat_number || selectedSeats.number || selectedSeats;
        mappedSeats = [String(seatNumber)];
      } else {
        console.error('❌ Aucun siège sélectionné trouvé');
        Alert.alert('Erreur', 'Aucun siège sélectionné');
        setProcessing(false);
        return;
      }
      
      // Étape 1: Utiliser le solde disponible pour débiter la partie solde
      const amountFromBalance = Math.min(userBalance, totalPrice);
      const amountToPay = totalPrice - amountFromBalance;
      
      console.log('💰 Calculs paiement mixte:', {
        amountFromBalance,
        amountToPay,
        mappedSeats
      });
      
      // Étape 2: Réserver les sièges d'abord (sans créer les réservations)
      if (amountFromBalance > 0) {
        // Réserver les sièges seulement
        const { busService } = require('../../services/busService');
        const reserveSeatsResult = await busService.reserveSeatsTemporarily(
          trip?.id || outboundTrip?.id,
          mappedSeats
        );
        
        if (!reserveSeatsResult.success) {
          Alert.alert('Erreur', 'Impossible de réserver les sièges. Veuillez réessayer.');
          setProcessing(false);
          return;
        }
        
        console.log('✅ Sièges réservés temporairement');
        
        // Débiter le solde après réservation des sièges
        const debitResult = await balanceService.debitBalance(
          user.id,
          amountFromBalance,
          `Paiement réservation - Partie solde (${mappedSeats.join(', ')})`,
          null // On aura l'ID de réservation plus tard
        );
        
        if (!debitResult.success) {
          // En cas d'échec, libérer les sièges
          await busService.releaseSeatsTemporarily(trip?.id || outboundTrip?.id, mappedSeats);
          Alert.alert('Erreur', 'Échec du débit du solde. Veuillez réessayer.');
          setProcessing(false);
          return;
        }
        
        console.log('✅ Solde débité:', amountFromBalance, 'FCFA');
      }
      
      // Étape 3: Simuler le paiement mobile money pour le montant restant
      if (amountToPay > 0 && (selectedMixedPaymentMethod === 'orange_money' || selectedMixedPaymentMethod === 'mtn_momo')) {
        console.log('🔄 Simulation paiement mobile money pour:', amountToPay, 'FCFA');
        
        // Simuler le temps de traitement mobile money
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Paiement mobile money simulé avec succès');
      }
      
      // Étape 4: Créer les réservations une seule fois avec toutes les informations de paiement
      const bookingData = {
        userId: user?.id,
        tripId: trip?.id || outboundTrip?.id,
        seatNumbers: mappedSeats,
        totalPrice: totalPrice,
        paymentMethod: 'mixed', // Identifier comme paiement mixte
        mixedPaymentDetails: {
          amountFromBalance,
          amountFromMobileMoney: amountToPay,
          mobilMoneyProvider: selectedMixedPaymentMethod,
          phoneNumber: (selectedMixedPaymentMethod === 'orange_money' || selectedMixedPaymentMethod === 'mtn_momo') ? phoneNumber : null
        }
      };
      
      console.log('🚀 Création réservation paiement mixte (une seule fois):', bookingData);
      
      // Créer les réservations avec option pour utiliser les sièges déjà réservés
      const result = await bookingService.createMultipleBookings(bookingData, {
        skipSeatReservation: true, // Ne pas réserver les sièges à nouveau car déjà fait
        seatsAlreadyReserved: true // Indiquer que les sièges sont déjà réservés
      });
      
      if (result.success) {
        // Fermer le modal
        setShowMixedPaymentModal(false);
        
        // Créer le libellé de méthode de paiement
        let paymentMethodLabel = '';
        if (amountFromBalance > 0 && amountToPay > 0) {
          const mobileMethodName = selectedMixedPaymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money';
          paymentMethodLabel = `Mixte: Solde (${amountFromBalance.toLocaleString()} FCFA) + ${mobileMethodName} (${amountToPay.toLocaleString()} FCFA)`;
        } else if (amountFromBalance > 0) {
          paymentMethodLabel = `Solde (${amountFromBalance.toLocaleString()} FCFA)`;
        } else {
          paymentMethodLabel = selectedMixedPaymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money';
        }
        
        // Rediriger vers l'écran de succès
        navigation.replace('PaymentSuccess', {
          bookingReference: result.bookingReference,
          totalPrice: totalPrice,
          amountFromBalance: amountFromBalance,
          amountPaid: amountToPay,
          tripDetails: trip || outboundTrip,
          paymentMethod: paymentMethodLabel,
          reservationDate: new Date().toISOString(),
          selectedSeats: mappedSeats,
          tripId: trip?.id || outboundTrip?.id,
          paymentType: 'mixed_payment',
          mixedPaymentDetails: bookingData.mixedPaymentDetails
        });
        
      } else {
        Alert.alert('Erreur', 'La création de la réservation a échoué. Veuillez réessayer.');
        
        // En cas d'échec, rembourser le solde débité et libérer les sièges
        if (amountFromBalance > 0) {
          console.log('🔄 Remboursement du solde débité suite à l\'échec...');
          await balanceService.addToBalance(
            user.id,
            amountFromBalance,
            'Remboursement suite à échec de réservation'
          );
        }
        
        // Libérer les sièges en cas d'échec
        console.log('🔄 Libération des sièges suite à l\'échec...');
        const { busService } = require('../../services/busService');
        await busService.releaseSeatsTemporarily(trip?.id || outboundTrip?.id, mappedSeats);
      }
    } catch (error) {
      console.error('❌ Erreur lors du paiement mixte:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du paiement.');
      
      // En cas d'erreur, essayer de rembourser le solde si il a été débité
      try {
        const { useAuthStore } = require('../../store');
        const { balanceService } = require('../../services/balanceService');
        const { busService } = require('../../services/busService');
        const { user } = useAuthStore.getState();
        const amountFromBalance = Math.min(userBalance, totalPrice);
        
        if (amountFromBalance > 0) {
          console.log('🔄 Remboursement du solde suite à erreur...');
          await balanceService.addToBalance(
            user.id,
            amountFromBalance,
            'Remboursement suite à erreur de paiement'
          );
        }
        
        // Libérer les sièges si ils ont été réservés
        console.log('🔄 Libération des sièges suite à erreur...');
        await busService.releaseSeatsTemporarily(trip?.id || outboundTrip?.id, mappedSeats);
      } catch (refundError) {
        console.error('❌ Erreur lors du remboursement:', refundError);
      }
    } finally {
      setProcessing(false);
    }
  };

  // État pour stocker le solde utilisateur
  const [userBalance, setUserBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [canUseBalance, setCanUseBalance] = useState(false);
  const [balanceToUse, setBalanceToUse] = useState(0);
  
  // Récupérer le solde de l'utilisateur
  useEffect(() => {
    const getUserBalance = async () => {
      try {
        // Importer dynamiquement le service de solde
        const { balanceService } = require('../../services/balanceService');
        const { useAuthStore } = require('../../store');
        
        const { user } = useAuthStore.getState();
        if (!user?.id) {
          setLoadingBalance(false);
          return;
        }
        
        const result = await balanceService.getUserBalance(user.id);
        const balance = result.balance || 0;
        setUserBalance(balance);
        
        // Déterminer si le solde peut être utilisé
        const canUse = balance > 0;
        setCanUseBalance(canUse);
        
        // Afficher le montant qui sera utilisé (soit tout le solde, soit juste le montant nécessaire)
        const amountToUse = Math.min(balance, totalPrice);
        setBalanceToUse(amountToUse);
        
        // Calculer le montant restant à payer après utilisation du solde
        const remaining = Math.max(0, totalPrice - balance);
        setRemainingAmount(remaining);
        
        console.log('📊 Solde utilisateur récupéré:', balance);
        console.log('💰 Montant à utiliser:', amountToUse);
        console.log('� Montant restant:', remaining);
      } catch (error) {
        console.error('❌ Erreur lors de la récupération du solde:', error);
      } finally {
        setLoadingBalance(false);
      }
    };
    
    getUserBalance();
  }, [totalPrice]);
  
  const paymentMethods = [
    // Afficher l'option de solde seulement si l'utilisateur en a
    ...(canUseBalance ? [{
      id: 'balance',
      name: 'Mon Solde',
      icon: 'wallet',
      color: '#059669', // Vert
      backgroundColor: '#ECFDF5',
      description: userBalance >= totalPrice 
        ? `Solde suffisant: ${userBalance.toLocaleString()} FCFA` 
        : `Solde partiel: ${userBalance.toLocaleString()} FCFA (reste: ${(totalPrice - userBalance).toLocaleString()} FCFA)`
    }] : []),
    {
      id: 'orange_money',
      name: 'Orange Money',
      icon: 'phone-portrait',
      color: '#FF6600', // Orange officiel
      backgroundColor: '#FFF3E0',
      description: 'Paiement mobile Orange'
    },
    {
      id: 'mtn_momo',
      name: 'MTN Mobile Money',
      icon: 'phone-portrait',
      color: '#FFD700', // Jaune doré
      backgroundColor: '#FFFDE7',
      description: 'Paiement mobile MTN'
    },
    {
      id: 'card',
      name: 'Carte bancaire',
      icon: 'card',
      color: '#2196F3', // Bleu
      backgroundColor: '#E3F2FD',
      description: 'Visa, Mastercard'
    }
  ];

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner un moyen de paiement');
      return;
    }

    // Paiement par solde - traitement spécial
    if (selectedPaymentMethod === 'balance') {
      if (userBalance >= totalPrice) {
        // Solde suffisant - traitement direct
        try {
          setProcessing(true);
          const { useAuthStore } = require('../../store');
          const { balanceService } = require('../../services/balanceService');
          const { user } = useAuthStore.getState();
          
          const bookingData = {
            userId: user?.id,
            tripId: trip?.id || outboundTrip?.id,
            seatNumbers: selectedSeats.map(seat => seat.seat_number || seat.number),
            totalPrice: totalPrice,
            paymentMethod: 'balance'
          };
          
          const result = await balanceService.processPaymentWithBalance(
            bookingData.userId, 
            bookingData.tripId, 
            bookingData.seatNumbers, 
            bookingData.totalPrice, 
            bookingData.paymentMethod
          );
          
          if (result.success) {
            navigation.navigate('PaymentSuccess', {
              bookingReference: result.data.bookingId,
              totalPrice,
              tripDetails: trip || outboundTrip,
              paymentMethod: 'Solde utilisateur',
              reservationDate: new Date().toISOString(),
              selectedSeats: selectedSeats, // Ajouter les sièges sélectionnés
              tripId: trip?.id || outboundTrip?.id,
              paymentType: 'balance' // Identifier comme paiement par solde
            });
          } else {
            Alert.alert('Erreur', 'Le paiement par solde a échoué. Veuillez réessayer.');
          }
        } catch (error) {
          console.error('❌ Erreur paiement solde:', error);
          Alert.alert('Erreur', 'Une erreur est survenue lors du paiement par solde.');
        } finally {
          setProcessing(false);
        }
      } else {
        // Solde insuffisant - proposer paiement mixte
        Alert.alert(
          'Solde insuffisant',
          `Votre solde actuel (${userBalance.toLocaleString()} FCFA) est insuffisant pour couvrir le montant total (${totalPrice.toLocaleString()} FCFA). Souhaitez-vous utiliser votre solde et payer le reste (${(totalPrice - userBalance).toLocaleString()} FCFA) avec un autre moyen de paiement?`,
          [
            {
              text: 'Non',
              style: 'cancel'
            },
            {
              text: 'Oui, paiement mixte',
              onPress: () => showMixedPaymentOptions(totalPrice - userBalance)
            }
          ]
        );
      }
      return;
    }

    // Afficher le formulaire de paiement standard pour les autres méthodes
    setShowPaymentForm(true);
  };

  const processPayment = async () => {
    setProcessing(true);

    try {
      const { useAuthStore } = require('../../store');
      const { user } = useAuthStore.getState();

      // Gestion du paiement mixte (solde + autre méthode)
      if (selectedPaymentMethod !== 'balance' && canUseBalance && userBalance > 0) {
        // Si l'utilisateur a un solde mais a choisi une autre méthode, proposer le paiement mixte
        const wantsToUseMixedPayment = await new Promise(resolve => {
          Alert.alert(
            'Utiliser votre solde?',
            `Vous avez un solde de ${userBalance.toLocaleString()} FCFA. Souhaitez-vous l'utiliser pour réduire le montant à payer?`,
            [
              {
                text: 'Non',
                onPress: () => resolve(false)
              },
              {
                text: 'Oui, utiliser mon solde',
                onPress: () => resolve(true)
              }
            ]
          );
        });
        
        if (wantsToUseMixedPayment) {
          // Implémenter la logique de paiement mixte
          try {
            const { balanceService } = require('../../services/balanceService');
            
            const bookingData = {
              userId: user?.id,
              tripId: trip?.id || outboundTrip?.id,
              seatNumbers: selectedSeats.map(seat => seat.seat_number || seat.number),
              totalPrice: totalPrice,
              paymentMethod: selectedPaymentMethod,
              useBalance: true
            };
            
            const result = await balanceService.processPaymentWithBalance(
              bookingData.userId, 
              bookingData.tripId, 
              bookingData.seatNumbers, 
              bookingData.totalPrice, 
              bookingData.paymentMethod
            );
            
            if (result.success) {
              // Si le paiement mixte a réussi
              navigation.navigate('PaymentSuccess', {
                bookingReference: result.data.bookingId,
                totalPrice,
                amountFromBalance: result.data.amountFromBalance,
                amountPaid: result.data.amountToPay,
                tripDetails: trip || outboundTrip,
                paymentMethod: `Solde (${result.data.amountFromBalance.toLocaleString()} FCFA) + ${getPaymentMethodName(selectedPaymentMethod)}`,
                reservationDate: new Date().toISOString(),
                selectedSeats: selectedSeats, // Ajouter les sièges sélectionnés
                tripId: trip?.id || outboundTrip?.id,
                paymentType: 'balance' // Paiement mixte utilise aussi le système de solde
              });
              return;
            }
          } catch (error) {
            console.error('❌ Erreur paiement mixte:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors du paiement mixte.');
          }
        }
      }
      
      // Validation selon le type de paiement standard
      if (selectedPaymentMethod === 'card') {
        if (!cardNumber || !expiryDate || !cvv || !cardName) {
          Alert.alert('Erreur', 'Veuillez remplir tous les champs de la carte');
          setProcessing(false);
          return;
        }
      } else if (selectedPaymentMethod === 'orange_money' || selectedPaymentMethod === 'mtn_momo') {
        if (!phoneNumber) {
          Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone');
          setProcessing(false);
          return;
        }
        
        // Traitement du paiement mobile avec création de réservation réelle
        try {
          const { bookingService } = require('../../services/bookingService');
          
          // DEBUG: Analyser les sièges sélectionnés
          console.log('🔍 DEBUGGING MOBILE PAYMENT - Sièges sélectionnés:');
          console.log('- selectedSeats brut:', selectedSeats);
          console.log('- Type selectedSeats:', typeof selectedSeats);
          console.log('- Array?:', Array.isArray(selectedSeats));
          console.log('- Contenu JSON:', JSON.stringify(selectedSeats, null, 2));
          
          // Mapper les sièges sélectionnés de façon sécurisée
          let mappedSeats = [];
          if (Array.isArray(selectedSeats)) {
            mappedSeats = selectedSeats.map(seat => {
              const seatNumber = seat.seat_number || seat.number || seat;
              console.log(`- Mapping seat:`, seat, '→', seatNumber, `(${typeof seatNumber})`);
              return String(seatNumber);
            });
          } else if (selectedSeats) {
            // Si ce n'est pas un array mais qu'il y a une valeur
            const seatNumber = selectedSeats.seat_number || selectedSeats.number || selectedSeats;
            console.log(`- Mapping single seat:`, selectedSeats, '→', seatNumber, `(${typeof seatNumber})`);
            mappedSeats = [String(seatNumber)];
          } else {
            console.error('❌ Aucun siège sélectionné trouvé');
            Alert.alert('Erreur', 'Aucun siège sélectionné');
            setProcessing(false);
            return;
          }
          
          console.log('🎯 Sièges mappés final:', mappedSeats);
          
          // Simuler le traitement du paiement mobile
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Créer les réservations dans la base de données
          const bookingData = {
            userId: user?.id,
            tripId: trip?.id || outboundTrip?.id,
            seatNumbers: mappedSeats,
            totalPrice: totalPrice,
            paymentMethod: selectedPaymentMethod === 'orange_money' ? 'orange_money' : 'mtn_momo',
            phoneNumber: phoneNumber
          };
          
          console.log('🚀 Création réservation Mobile Money:', bookingData);
          
          const result = await bookingService.createMultipleBookings(bookingData);
          
          if (result.success) {
            // Fermer le modal et rediriger vers l'écran de succès
            setShowPaymentForm(false);
            navigation.replace('PaymentSuccess', {
              bookingReference: result.bookingReference,
              totalPrice: totalPrice,
              tripDetails: trip || outboundTrip,
              paymentMethod: selectedPaymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money',
              reservationDate: new Date().toISOString(),
              selectedSeats: selectedSeats,
              tripId: trip?.id || outboundTrip?.id,
              paymentType: 'mobile_money' // Identifier le type de paiement
            });
          } else {
            Alert.alert('Erreur', 'La création de la réservation a échoué. Veuillez réessayer.');
          }
        } catch (error) {
          console.error('❌ Erreur paiement mobile:', error);
          Alert.alert('Erreur', 'Une erreur est survenue lors du paiement mobile.');
        }
        return;
      }

      // Pour les cartes bancaires, continuer avec la logique normale
      try {
        const { bookingService } = require('../../services/bookingService');
        
        // Simuler le traitement du paiement par carte
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Créer les réservations dans la base de données
        const bookingData = {
          userId: user?.id,
          tripId: trip?.id || outboundTrip?.id,
          seatNumbers: selectedSeats.map(seat => seat.seat_number || seat.number),
          totalPrice: totalPrice,
          paymentMethod: 'stripe'
        };
        
        console.log('🚀 Création réservation Carte:', bookingData);
        
        const result = await bookingService.createMultipleBookings(bookingData);
        
        if (result.success) {
          // Fermer le modal et rediriger vers l'écran de succès
          setShowPaymentForm(false);
          navigation.replace('PaymentSuccess', {
            bookingReference: result.bookingReference,
            totalPrice: totalPrice,
            tripDetails: trip || outboundTrip,
            paymentMethod: 'Carte bancaire',
            reservationDate: new Date().toISOString(),
            selectedSeats: selectedSeats,
            tripId: trip?.id || outboundTrip?.id,
            paymentType: 'card' // Identifier le type de paiement
          });
        } else {
          Alert.alert('Erreur', 'La création de la réservation a échoué. Veuillez réessayer.');
        }
      } catch (error) {
        console.error('❌ Erreur paiement carte:', error);
        Alert.alert('Erreur', 'Une erreur est survenue lors du paiement par carte.');
      }

    } catch (error) {
      Alert.alert('Erreur', 'Le paiement a échoué. Veuillez réessayer.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Résumé simplifié */}
        <View style={styles.section}>
          <View style={styles.simpleSummary}>
            {/* Affichage pour aller-retour */}
            {isRoundTrip && outboundTrip && returnTrip ? (
              <>
                {/* Trajet aller */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    🛫 Aller: {outboundTrip?.ville_depart || outboundTrip?.departure_city || 'Départ'} → {outboundTrip?.ville_arrivee || outboundTrip?.arrival_city || 'Arrivée'}
                  </Text>
                  <Text style={styles.summarySeats}>
                    {(() => {
                      let seatCount = 0;
                      if (selectedSeats) {
                        if (Array.isArray(selectedSeats)) {
                          seatCount = selectedSeats.length;
                        } else if (typeof selectedSeats === 'object') {
                          seatCount = Object.keys(selectedSeats).length;
                        } else if (typeof selectedSeats === 'number') {
                          seatCount = selectedSeats;
                        }
                      }
                      // Si aucun siège n'est défini, on utilise le nombre de passagers depuis searchParams
                      if (seatCount === 0) {
                        seatCount = searchParams?.passengers || searchParams?.passagers || searchParams?.nbPassengers || 1;
                      }
                      return `${seatCount} siège${seatCount > 1 ? 's' : ''}`;
                    })()}
                  </Text>
                </View>

                {/* Sièges aller */}
                {selectedSeats && Array.isArray(selectedSeats) && selectedSeats.length > 0 && (
                  <View style={styles.vipSeatsContainer}>
                    <Text style={styles.vipSeatsTitle}>🪑 Sièges aller :</Text>
                    <View style={styles.seatsList}>
                      {selectedSeats.map((seat, index) => (
                        <View key={seat.id || index} style={styles.seatItem}>
                          <Text style={styles.seatNumber}>
                            Siège {seat.seat_number || seat.number || (index + 1)}
                          </Text>
                          <Text style={styles.seatPassenger}>
                            Passager {index + 1}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Trajet retour */}
                <View style={[styles.summaryRow, { marginTop: SPACING.md }]}>
                  <Text style={styles.summaryLabel}>
                    🛬 Retour: {returnTrip?.ville_depart || returnTrip?.departure_city || 'Départ'} → {returnTrip?.ville_arrivee || returnTrip?.arrival_city || 'Arrivée'}
                  </Text>
                  <Text style={styles.summarySeats}>
                    {(() => {
                      let seatCount = 0;
                      if (returnSelectedSeats) {
                        if (Array.isArray(returnSelectedSeats)) {
                          seatCount = returnSelectedSeats.length;
                        } else if (typeof returnSelectedSeats === 'object') {
                          seatCount = Object.keys(returnSelectedSeats).length;
                        } else if (typeof returnSelectedSeats === 'number') {
                          seatCount = returnSelectedSeats;
                        }
                      }
                      // Si aucun siège n'est défini, on utilise le nombre de passagers depuis searchParams
                      if (seatCount === 0) {
                        seatCount = searchParams?.passengers || searchParams?.passagers || searchParams?.nbPassengers || 1;
                      }
                      return `${seatCount} siège${seatCount > 1 ? 's' : ''}`;
                    })()}
                  </Text>
                </View>

                {/* Sièges retour */}
                {returnSelectedSeats && Array.isArray(returnSelectedSeats) && returnSelectedSeats.length > 0 && (
                  <View style={styles.vipSeatsContainer}>
                    <Text style={styles.vipSeatsTitle}>🪑 Sièges retour :</Text>
                    <View style={styles.seatsList}>
                      {returnSelectedSeats.map((seat, index) => (
                        <View key={seat.id || index} style={styles.seatItem}>
                          <Text style={styles.seatNumber}>
                            Siège {seat.seat_number || seat.number || (index + 1)}
                          </Text>
                          <Text style={styles.seatPassenger}>
                            Passager {index + 1}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Affichage pour trajet simple */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {trip?.ville_depart || trip?.departure_city || 'Départ'} → {trip?.ville_arrivee || trip?.arrival_city || 'Arrivée'}
                  </Text>
                  <Text style={styles.summarySeats}>
                    {(() => {
                      let seatCount = 0;
                      if (selectedSeats) {
                        if (Array.isArray(selectedSeats)) {
                          seatCount = selectedSeats.length;
                        } else if (typeof selectedSeats === 'object') {
                          seatCount = Object.keys(selectedSeats).length;
                        } else if (typeof selectedSeats === 'number') {
                          seatCount = selectedSeats;
                        }
                      }
                      // Si aucun siège n'est défini, on utilise le nombre de passagers depuis searchParams
                      if (seatCount === 0) {
                        seatCount = searchParams?.passengers || searchParams?.passagers || searchParams?.nbPassengers || 1;
                      }
                      return `${seatCount} siège${seatCount > 1 ? 's' : ''}`;
                    })()}
                  </Text>
                </View>

                {/* Sièges pour trajet simple */}
                {selectedSeats && Array.isArray(selectedSeats) && selectedSeats.length > 0 && (
                  <View style={styles.vipSeatsContainer}>
                    <Text style={styles.vipSeatsTitle}>🪑 Sièges sélectionnés :</Text>
                    <View style={styles.seatsList}>
                      {selectedSeats.map((seat, index) => (
                        <View key={seat.id || index} style={styles.seatItem}>
                          <Text style={styles.seatNumber}>
                            Siège {seat.seat_number || seat.number || (index + 1)}
                          </Text>
                          <Text style={styles.seatPassenger}>
                            Passager {index + 1}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
            
            {/* Affichage des récompenses de parrainage */}
            {discountApplied && (
              <View style={styles.discountSection}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Sous-total</Text>
                  <Text style={styles.priceValue}>
                    {formatPrice(originalPrice)} FCFA
                  </Text>
                </View>
                <View style={styles.discountRow}>
                  <Text style={styles.discountLabel}>
                    🎁 Récompense de parrainage ({rewardsToUse?.length || 0} récompense{(rewardsToUse?.length || 0) > 1 ? 's' : ''})
                  </Text>
                  <Text style={styles.discountValue}>
                    -{formatPrice(referralDiscount)} FCFA
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.priceContainer}>
              <Text style={styles.totalLabel}>Total à payer</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(totalPrice)} FCFA
              </Text>
            </View>
          </View>
        </View>

        {/* Moyens de paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisir un moyen de paiement</Text>
          
          <View style={styles.paymentMethods}>
            {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
                    selectedPaymentMethod === method.id && { borderColor: method.color, backgroundColor: method.backgroundColor }
                  ]}
                  onPress={() => setSelectedPaymentMethod(method.id)}
                >
                  <View style={[
                    styles.paymentMethodIcon,
                    { backgroundColor: method.backgroundColor || method.color + '20' },
                    method.id === 'balance' && { borderWidth: 1, borderColor: COLORS.success + '30' }
                  ]}>
                    <Ionicons 
                      name={method.icon} 
                      size={24} 
                      color={selectedPaymentMethod === method.id ? method.color : method.color} 
                    />
                  </View>
                  
                  <View style={styles.paymentMethodInfo}>
                    <Text style={[
                      styles.paymentMethodName,
                      selectedPaymentMethod === method.id && { color: method.color, fontWeight: '600' }
                    ]}>
                      {method.name}
                    </Text>
                    <Text style={[
                      styles.paymentMethodDescription,
                      selectedPaymentMethod === method.id && { color: method.color, opacity: 0.8 }
                    ]}>
                      {method.description}
                    </Text>
                  </View>
                  
                  <View style={styles.radioContainer}>
                    <View style={[
                      styles.radio,
                      selectedPaymentMethod === method.id && { borderColor: method.color, borderWidth: 3 }
                    ]}>
                      {selectedPaymentMethod === method.id && (
                        <View style={[styles.radioInner, { backgroundColor: method.color }]} />
                      )}
                    </View>
                  </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informations de sécurité */}
        <View style={styles.section}>
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>
              Vos informations de paiement sont sécurisées et chiffrées
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de formulaire de paiement */}
      <Modal
        visible={showPaymentForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header du modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentForm(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedPaymentMethod === 'card' ? 'Carte bancaire' :
               selectedPaymentMethod === 'orange_money' ? 'Orange Money' :
               selectedPaymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Paiement'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Formulaire carte bancaire */}
            {selectedPaymentMethod === 'card' && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Informations de la carte</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numéro de carte</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="1234 5678 9012 3456"
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                    <Text style={styles.inputLabel}>Date d'expiration</Text>
                    <TextInput
                      style={styles.input}
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      placeholder="MM/AA"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvv}
                      onChangeText={setCvv}
                      placeholder="123"
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom sur la carte</Text>
                  <TextInput
                    style={styles.input}
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="JOHN DOE"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            {/* Formulaire Mobile Money */}
            {(selectedPaymentMethod === 'orange_money' || selectedPaymentMethod === 'mtn_momo') && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>
                  {selectedPaymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money'}
                </Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder={selectedPaymentMethod === 'orange_money' ? "655 XX XX XX" : "67X XX XX XX"}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={COLORS.success || 'green'} />
                  <Text style={styles.infoText}>
                    Mode démo : Le paiement de {formatPrice(totalPrice)} FCFA sera automatiquement accepté après confirmation
                  </Text>
                </View>
              </View>
            )}

            {/* Résumé du paiement */}
            <View style={styles.paymentSummary}>
              <Text style={styles.summaryTitle}>Résumé du paiement</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant total</Text>
                <Text style={styles.summaryAmount}>{formatPrice(totalPrice)} FCFA</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer du modal */}
          <View style={styles.modalFooter}>
            <Button
              title={processing ? "Traitement..." : `Confirmer le paiement`}
              onPress={processPayment}
              loading={processing}
              disabled={processing}
            />
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Modal pour le paiement mixte */}
      <Modal
        visible={showMixedPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header du modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMixedPaymentModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Paiement mixte</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Information sur le paiement mixte */}
            <View style={styles.mixedPaymentInfo}>
              <View style={styles.mixedPaymentHeader}>
                <Ionicons name="wallet" size={24} color={COLORS.success} />
                <Text style={styles.mixedPaymentTitle}>Votre solde est appliqué</Text>
              </View>
              
              <View style={styles.mixedPaymentDetails}>
                <View style={styles.mixedPaymentRow}>
                  <Text style={styles.mixedPaymentLabel}>Solde utilisé:</Text>
                  <Text style={styles.mixedPaymentValueGreen}>
                    {userBalance.toLocaleString()} FCFA
                  </Text>
                </View>
                
                <View style={styles.mixedPaymentRow}>
                  <Text style={styles.mixedPaymentLabel}>Montant restant:</Text>
                  <Text style={styles.mixedPaymentValue}>
                    {remainingAmount.toLocaleString()} FCFA
                  </Text>
                </View>
                
                <View style={styles.mixedPaymentRow}>
                  <Text style={styles.mixedPaymentLabelTotal}>Total:</Text>
                  <Text style={styles.mixedPaymentValueTotal}>
                    {totalPrice.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>
            </View>

            {/* Sélection des méthodes de paiement pour le montant restant */}
            <View style={styles.mixedPaymentMethodsSection}>
              <Text style={styles.mixedPaymentMethodsTitle}>
                Choisissez un moyen de paiement pour le montant restant
              </Text>
              
              {/* Liste des méthodes de paiement (sans l'option solde) */}
              <View style={styles.mixedPaymentMethods}>
                {paymentMethods
                  .filter(method => method.id !== 'balance')
                  .map(method => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethod,
                        selectedMixedPaymentMethod === method.id && styles.selectedPaymentMethod,
                        selectedMixedPaymentMethod === method.id && { borderColor: method.color, backgroundColor: method.backgroundColor }
                      ]}
                      onPress={() => setSelectedMixedPaymentMethod(method.id)}
                    >
                      <View style={[
                        styles.paymentMethodIcon,
                        { backgroundColor: method.backgroundColor || method.color + '20' }
                      ]}>
                        <Ionicons 
                          name={method.icon} 
                          size={24} 
                          color={selectedMixedPaymentMethod === method.id ? method.color : method.color} 
                        />
                      </View>
                      
                      <View style={styles.paymentMethodInfo}>
                        <Text style={[
                          styles.paymentMethodName,
                          selectedMixedPaymentMethod === method.id && { color: method.color, fontWeight: '600' }
                        ]}>
                          {method.name}
                        </Text>
                        <Text style={[
                          styles.paymentMethodDescription,
                          selectedMixedPaymentMethod === method.id && { color: method.color, opacity: 0.8 }
                        ]}>
                          {method.description}
                        </Text>
                      </View>
                      
                      <View style={styles.radioContainer}>
                        <View style={[
                          styles.radio,
                          selectedMixedPaymentMethod === method.id && { borderColor: method.color, borderWidth: 3 }
                        ]}>
                          {selectedMixedPaymentMethod === method.id && (
                            <View style={[styles.radioInner, { backgroundColor: method.color }]} />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            {/* Formulaire pour Mobile Money si sélectionné */}
            {(selectedMixedPaymentMethod === 'orange_money' || selectedMixedPaymentMethod === 'mtn_momo') && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>
                  {selectedMixedPaymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money'}
                </Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Exemple: 6xxxxxxxx"
                    placeholderTextColor={COLORS.text.secondary}
                    keyboardType="phone-pad"
                    maxLength={9}
                  />
                </View>
                
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={COLORS.warning} />
                  <Text style={styles.infoText}>
                    Vous recevrez une notification sur votre téléphone pour valider le paiement de {remainingAmount.toLocaleString()} FCFA.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
          
          {/* Footer avec bouton de paiement */}
          <View style={styles.modalFooter}>
            {processing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.processingText}>Traitement en cours...</Text>
              </View>
            ) : (
              <Button 
                title={`Payer ${remainingAmount.toLocaleString()} FCFA`}
                onPress={handleMixedPayment}
                disabled={!selectedMixedPaymentMethod}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Footer avec bouton de paiement */}
      <View style={styles.footer}>
        <Button
          title={selectedPaymentMethod === 'balance' 
            ? userBalance >= totalPrice 
              ? `Payer ${formatPrice(totalPrice)} FCFA avec mon solde` 
              : `Payer ${formatPrice(totalPrice)} FCFA (solde: ${formatPrice(userBalance)})`
            : `Payer ${formatPrice(totalPrice)} FCFA`
          }
          onPress={handlePayment}
          disabled={!selectedPaymentMethod}
          style={selectedPaymentMethod === 'balance' ? styles.balanceButton : {}}
          color={selectedPaymentMethod === 'balance' ? COLORS.success : COLORS.primary}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  bookingSummary: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },

  simpleSummary: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
  },

  summarySeats: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },

  vipSeatsContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  vipSeatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },

  seatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  seatItem: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },

  seatNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },

  seatPassenger: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  
  bookingReference: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  
  tripInfo: {
    marginBottom: SPACING.md,
  },
  
  route: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  datetime: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  
  seat: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  totalLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  paymentMethods: {
    gap: SPACING.sm,
  },
  
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  
  selectedPaymentMethod: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  paymentMethodInfo: {
    flex: 1,
  },
  
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  paymentMethodDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  
  selectedText: {
    color: COLORS.surface,
  },
  
  radioContainer: {
    marginLeft: SPACING.md,
  },
  
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  
  radioSelected: {
    borderColor: COLORS.primary,
  },
  
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  securityText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // Styles pour le modal de paiement
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },

  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },

  inputGroup: {
    marginBottom: SPACING.md,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.background,
    color: COLORS.text.primary,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
    lineHeight: 20,
  },

  paymentSummary: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },

  summaryLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },

  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  discountSection: {
    marginBottom: SPACING.md,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },

  priceLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },

  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.success + '10',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },

  discountLabel: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
    flex: 1,
  },

  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },

  // Styles pour le paiement mixte
  mixedPaymentInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  
  mixedPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  mixedPaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    color: COLORS.success,
  },
  
  mixedPaymentDetails: {
    backgroundColor: COLORS.success + '08',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.success + '20',
  },
  
  mixedPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  
  mixedPaymentLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  mixedPaymentLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  mixedPaymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  
  mixedPaymentValueGreen: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  
  mixedPaymentValueTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  
  mixedPaymentMethodsSection: {
    marginTop: SPACING.md,
  },
  
  mixedPaymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  mixedPaymentMethods: {
    gap: SPACING.sm,
  },

  modalFooter: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  balanceButton: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
});

export default PaymentScreen;
