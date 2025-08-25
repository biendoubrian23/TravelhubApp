import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard,
  RefreshControl,
  SafeAreaView,
  Dimensions
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants'
import { useAuthStore } from '../../store'
import { supabase } from '../../services/supabase'
import Toast from 'react-native-toast-message'

const { width } = Dimensions.get('window')

const ReferralScreen = ({ navigation }) => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [referralData, setReferralData] = useState({
    referralCode: '',
    totalReferrals: 0,
    pendingRewards: 0,
    totalEarned: 0,
    usedAmount: 0, // Nouveau: montant utilisé
    referralsList: []
  })

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Récupérer le code de parrainage de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Erreur lors de la récupération du code de parrainage:', userError)
        // Utiliser des données par défaut si la table users n'a pas encore les colonnes de parrainage
        setReferralData({
          referralCode: 'ABC123DEF', // Code temporaire
          totalReferrals: 0,
          pendingRewards: 0,
          totalEarned: 0,
          usedAmount: 0,
          referralsList: []
        })
        return
      }

      // Vérifier si les tables de parrainage existent
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('id, referred_id, created_at, users:referred_id(full_name)')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      const { data: rewards, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', user.id)

      // Si les tables n'existent pas, utiliser des données par défaut
      if (referralsError?.code === 'PGRST200' || rewardsError?.code === 'PGRST200') {
        console.log('⚠️ Tables de parrainage pas encore créées, utilisation de données par défaut')
        setReferralData({
          referralCode: userData?.referral_code || 'DEMO123ABC',
          totalReferrals: 0,
          pendingRewards: 0,
          totalEarned: 0,
          usedAmount: 0,
          referralsList: []
        })
        return
      }

      if (referralsError) {
        console.error('Erreur lors de la récupération des parrainages:', referralsError)
        return
      }

      if (rewardsError) {
        console.error('Erreur lors de la récupération des récompenses:', rewardsError)
        return
      }

      // Calculer les statistiques
      const totalReferrals = referrals?.length || 0
      
      // 🆕 MODIFICATION: Calculer les gains totaux en incluant TOUTES les récompenses
      // Gains totaux = toutes les récompenses créées (utilisées ET non utilisées)
      const allRewards = rewards || []
      const totalEarned = allRewards.reduce((sum, reward) => sum + (reward.reward_amount || 0), 0)
      
      // Récompenses en attente = non réclamées seulement
      const pendingRewards = allRewards.filter(r => !r.is_claimed)
      const pendingAmount = pendingRewards.reduce((sum, reward) => sum + (reward.reward_amount || 0), 0)
      
      // Récompenses utilisées = réclamées 
      const usedRewards = allRewards.filter(r => r.is_claimed)
      const usedAmount = usedRewards.reduce((sum, reward) => sum + (reward.reward_amount || 0), 0)

      console.log('📊 Statistiques de parrainage calculées:', {
        totalReferrals,
        totalEarned,
        pendingAmount,
        usedAmount,
        totalRewards: allRewards.length
      })

      setReferralData({
        referralCode: userData?.referral_code || 'DEMO123ABC',
        totalReferrals,
        pendingRewards: pendingAmount, // Montant en attente en FCFA
        totalEarned, // Total gagné (utilisé + non utilisé)
        usedAmount, // Nouveau: montant utilisé
        referralsList: referrals || []
      })

    } catch (error) {
      console.error('Erreur lors du chargement des données de parrainage:', error)
      // En cas d'erreur, afficher des données par défaut au lieu d'une alerte
      setReferralData({
        referralCode: 'DEMO123ABC',
        totalReferrals: 0,
        pendingRewards: 0,
        totalEarned: 0,
        usedAmount: 0,
        referralsList: []
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadReferralData()
  }

  const copyReferralCode = async () => {
    try {
      await Clipboard.setString(referralData.referralCode)
      Toast.show({
        type: 'success',
        text1: 'Code copié !',
        text2: 'Le code de parrainage a été copié dans le presse-papier'
      })
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de copier le code')
    }
  }

  const shareReferralCode = async () => {
    try {
      const message = `🚌 Rejoins TravelHub avec mon code de parrainage ! 

Mon code de parrainage : ${referralData.referralCode}

⚠️ IMPORTANT : 
1️⃣ Colle ce code lors de ta CRÉATION DE COMPTE
2️⃣ Effectue ta PREMIÈRE RÉSERVATION 
3️⃣ Je recevrai alors 500 FCFA ! 💰

✅ Télécharge TravelHub
✅ Crée ton compte avec le code : ${referralData.referralCode}
✅ Réserve ton premier trajet
✅ Tu m'aides à gagner 500 FCFA ! 🇨🇲

👉 https://travelhub.cm/app`

      await Share.share({
        message,
        title: 'Rejoins TravelHub !'
      })
    } catch (error) {
      console.error('Erreur lors du partage:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const StatCard = ({ title, value, subtitle, icon, color = COLORS.primary }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <MaterialIcons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec plus d'espace en haut */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parrainage</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Code de parrainage */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionTitle}>Mon code de parrainage</Text>
          <View style={styles.codeContainer}>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{referralData.referralCode || 'DEMO123ABC'}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={copyReferralCode}>
              <MaterialIcons name="content-copy" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeDescription}>
            Partage ce code avec tes amis. ⚠️ Ils DOIVENT le coller lors de leur création de compte. 
            Tu recevras 500 FCFA de crédit pour chaque ami qui s'inscrit avec ton code !
          </Text>
        </View>

        {/* Trait séparateur bleu */}
        <View style={styles.blueSeparator} />

        {/* Statistiques */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Mes statistiques</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Parrainages"
              value={referralData.totalReferrals.toString()}
              subtitle="amis inscrits"
              icon="group"
              color={COLORS.primary}
            />
            <StatCard
              title="Gains totaux"
              value={`${(referralData.totalEarned || 0).toLocaleString()} FCFA`}
              subtitle="récompenses"
              icon="account-balance-wallet"
              color={COLORS.success}
            />
            <StatCard
              title="En attente"
              value={referralData.pendingRewards.toString()}
              subtitle="récompenses"
              icon="hourglass-empty"
              color={COLORS.warning}
            />
          </View>
        </View>

        {/* Trait séparateur bleu */}
        <View style={styles.blueSeparator} />

        {/* Comment ça marche */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Partage ton code</Text>
                <Text style={styles.stepDescription}>
                  Envoie ton code de parrainage à tes amis
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Ils s'inscrivent</Text>
                <Text style={styles.stepDescription}>
                  Tes amis utilisent ton code lors de leur inscription
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Ils font leur première réservation</Text>
                <Text style={styles.stepDescription}>
                  Ton ami effectue sa première réservation de trajet
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Tu reçois ta récompense</Text>
                <Text style={styles.stepDescription}>
                  Tu reçois 500 FCFA de crédit après sa première réservation !
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Liste des parrainages */}
        {referralData.referralsList.length > 0 && (
          <>
            {/* Trait séparateur bleu */}
            <View style={styles.blueSeparator} />
            
            <View style={styles.referralsSection}>
              <Text style={styles.sectionTitle}>Mes parrainages récents</Text>
              {referralData.referralsList.slice(0, 5).map((referral, index) => (
                <View key={referral.id} style={styles.referralItem}>
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>
                      {referral.users?.full_name || 'Utilisateur'}
                    </Text>
                    <Text style={styles.referralDate}>
                      Inscrit le {formatDate(referral.created_at)}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={COLORS.success}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Espacement pour le bouton fixe */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.fixedFooter}>
        <TouchableOpacity style={styles.shareButton} onPress={shareReferralCode}>
          <MaterialIcons name="share" size={20} color={COLORS.white} />
          <Text style={styles.shareButtonText}>Partager mon code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Gris clair comme dans l'image des notifications
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 100, // Espace pour le bouton fixe
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl, // Plus d'espace en haut
    paddingBottom: SPACING.lg,
    backgroundColor: '#F3F4F6', // Même couleur que le container
  },

  backButton: {
    width: 44, // Légèrement plus grand pour être plus facile à toucher
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: -40,
  },

  headerSpacer: {
    width: 40,
  },

  codeSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: SPACING.lg,
  },

  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  codeBox: {
    flex: 1,
    backgroundColor: '#F0F9FF', // Bleu très clair
    borderRadius: 8,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginRight: SPACING.sm,
    // Pas de bordure
  },

  codeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669', // Vert vif pour la visibilité
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },

  copyButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    // Pas de bordure
  },

  codeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },

  statsSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Fond légèrement différent pour les cartes
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },

  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  statTitle: {
    marginLeft: SPACING.xs,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: SPACING.xs,
    textAlign: 'center',
  },

  statSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },

  howItWorksSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  stepsList: {
    gap: SPACING.lg,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },

  stepNumberText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: SPACING.xs,
  },

  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  referralsSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  referralInfo: {
    flex: 1,
  },

  referralName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: SPACING.xs,
  },

  referralDate: {
    fontSize: 12,
    color: '#6B7280',
  },

  bottomSpacer: {
    height: SPACING.xl,
  },

  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F3F4F6', // Même couleur que le container
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },

  shareButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    // Ombre très légère
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  shareButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },

  // Trait séparateur bleu très fin
  blueSeparator: {
    height: 2, // Doublé de 0.5 à 1
    backgroundColor: COLORS.primary, // Couleur bleue de votre thème
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
    opacity: 0.3, // Légèrement transparent pour être subtil
  },
})

export default ReferralScreen
