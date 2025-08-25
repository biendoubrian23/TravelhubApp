// SCRIPT DE CORRECTION - Statut des parrainages
// Utilisez ce script pour vérifier et corriger les parrainages qui n'ont pas été complétés

const { supabase } = require('../services/supabase');

const fixReferralStatus = async () => {
  console.log('🔧 CORRECTION DES STATUTS DE PARRAINAGE');
  console.log('=' .repeat(50));
  
  try {
    // 1. Trouver tous les parrainages "pending"
    const { data: pendingReferrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id, 
        referrer_id, 
        referred_id, 
        status,
        created_at,
        users:referred_id (
          full_name,
          email
        )
      `)
      .eq('status', 'pending');

    if (referralsError) {
      console.error('❌ Erreur lors de la récupération des parrainages:', referralsError);
      return;
    }

    console.log(`📋 ${pendingReferrals.length} parrainages en attente trouvés`);

    // 2. Pour chaque parrainage pending, vérifier s'il y a des réservations
    for (const referral of pendingReferrals) {
      console.log(`\n🔍 Vérification parrainage ${referral.id}`);
      console.log(`   Filleul: ${referral.users?.email} (${referral.users?.full_name})`);

      // Compter les réservations du filleul
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, created_at, booking_status')
        .eq('user_id', referral.referred_id);

      if (bookingsError) {
        console.error('   ❌ Erreur lors de la vérification des réservations:', bookingsError);
        continue;
      }

      const bookingCount = bookings ? bookings.length : 0;
      console.log(`   📊 Réservations trouvées: ${bookingCount}`);

      if (bookingCount > 0) {
        console.log('   🎯 CORRECTION NÉCESSAIRE - Le filleul a des réservations mais le parrainage est encore pending');
        
        // Vérifier s'il y a déjà une récompense créée
        const { data: existingReward, error: rewardError } = await supabase
          .from('referral_rewards')
          .select('id')
          .eq('referral_id', referral.id)
          .single();

        if (existingReward) {
          console.log('   ✅ Récompense déjà créée, mise à jour du statut seulement');
          
          // Juste mettre à jour le statut
          await supabase
            .from('referrals')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', referral.id);
            
        } else {
          console.log('   🆕 Création de la récompense manquante');
          
          // Créer la récompense manquante
          const { data: newReward, error: createRewardError } = await supabase
            .from('referral_rewards')
            .insert({
              referral_id: referral.id,
              referrer_id: referral.referrer_id,
              reward_amount: 500,
              is_claimed: false,
              expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() // 6 mois
            })
            .select()
            .single();

          if (createRewardError) {
            console.error('   ❌ Erreur lors de la création de la récompense:', createRewardError);
            continue;
          }

          // Mettre à jour le statut du parrainage
          await supabase
            .from('referrals')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', referral.id);

          // Mettre à jour les statistiques du parrain
          const { data: currentUser, error: getUserError } = await supabase
            .from('users')
            .select('total_referrals, total_referral_earnings')
            .eq('id', referral.referrer_id)
            .single();

          if (!getUserError && currentUser) {
            const newTotalReferrals = (currentUser.total_referrals || 0) + 1;
            const newTotalEarnings = (currentUser.total_referral_earnings || 0) + 500;

            await supabase
              .from('users')
              .update({
                total_referrals: newTotalReferrals,
                total_referral_earnings: newTotalEarnings
              })
              .eq('id', referral.referrer_id);

            console.log(`   📊 Statistiques mises à jour: ${newTotalReferrals} parrainages, ${newTotalEarnings} FCFA`);
          }

          console.log('   ✅ Récompense créée et parrainage complété!');
        }
      } else {
        console.log('   ⏳ Aucune réservation - parrainage reste pending');
      }
    }

    console.log('\n🎉 CORRECTION TERMINÉE!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
};

// Fonction pour afficher le statut actuel
const checkReferralStatus = async () => {
  console.log('📊 ÉTAT ACTUEL DES PARRAINAGES');
  console.log('=' .repeat(40));

  try {
    // Statistiques générales
    const { data: stats, error: statsError } = await supabase
      .from('referrals')
      .select('status');

    if (!statsError && stats) {
      const pending = stats.filter(r => r.status === 'pending').length;
      const completed = stats.filter(r => r.status === 'completed').length;
      
      console.log(`📈 Total parrainages: ${stats.length}`);
      console.log(`⏳ En attente: ${pending}`);
      console.log(`✅ Complétés: ${completed}`);
    }

    // Détail des parrainages récents
    const { data: recent, error: recentError } = await supabase
      .from('referrals')
      .select(`
        id,
        status,
        created_at,
        completed_at,
        users!referrals_referrer_id_fkey (
          full_name,
          email
        ),
        referred:users!referrals_referred_id_fkey (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentError && recent) {
      console.log('\n🕒 PARRAINAGES RÉCENTS:');
      recent.forEach(r => {
        console.log(`   ${r.status.toUpperCase()} - ${r.users?.email} → ${r.referred?.email}`);
        console.log(`   Créé: ${new Date(r.created_at).toLocaleDateString()}`);
        if (r.completed_at) {
          console.log(`   Complété: ${new Date(r.completed_at).toLocaleDateString()}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
};

// Exporter les fonctions
module.exports = {
  fixReferralStatus,
  checkReferralStatus
};

// Si le script est exécuté directement
if (require.main === module) {
  (async () => {
    await checkReferralStatus();
    console.log('\n' + '='.repeat(50));
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Voulez-vous corriger les parrainages? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await fixReferralStatus();
        console.log('\n📊 ÉTAT APRÈS CORRECTION:');
        await checkReferralStatus();
      }
      rl.close();
      process.exit(0);
    });
  })();
}
