// Script pour créer un utilisateur client dans Supabase
import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = 'https://dqoncbnvyviurirsdtyu.supabase.co'
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_KEY' // ⚠️ REMPLACEZ par votre SERVICE KEY (pas l'anon key)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUser() {
  try {
    console.log('Création de l\'utilisateur...')
    
    // Créer l'utilisateur avec l'API admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'clarjybrian@outlook.fr',
      password: 'TempPassword123!', // Mot de passe temporaire
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        nom: 'BRIAN',
        prenom: 'CLARJY',
        telephone: '',
        role: 'client'
      }
    })

    if (authError) {
      console.error('Erreur lors de la création de l\'utilisateur:', authError)
      return
    }

    console.log('✅ Utilisateur créé avec succès!')
    console.log('📧 Email:', authData.user.email)
    console.log('🆔 ID:', authData.user.id)
    console.log('👤 Role:', authData.user.user_metadata?.role)
    
    // Optionnel: Insérer dans une table de profils si elle existe
    // Vous pouvez décommenter et adapter selon votre schéma de base de données
    /*
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        nom: 'BRIAN',
        prenom: 'CLARJY',
        telephone: '',
        role: 'client',
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Erreur lors de la création du profil:', profileError)
    } else {
      console.log('✅ Profil utilisateur créé!')
    }
    */
    
    console.log('\n🔑 L\'utilisateur peut maintenant se connecter avec:')
    console.log('📧 Email: clarjybrian@outlook.fr')
    console.log('🔒 Mot de passe temporaire: TempPassword123!')
    console.log('\n⚠️  Il est recommandé de changer le mot de passe lors de la première connexion.')
    
  } catch (error) {
    console.error('Erreur inattendue:', error)
  }
}

// Instructions d'utilisation
console.log(`
📋 INSTRUCTIONS POUR UTILISER CE SCRIPT:

1. Installez @supabase/supabase-js si pas déjà fait:
   npm install @supabase/supabase-js

2. Remplacez les variables de configuration:
   - YOUR_SUPABASE_URL par votre URL Supabase
   - YOUR_SUPABASE_SERVICE_KEY par votre clé de service Supabase
   
   ⚠️  Attention: Utilisez la SERVICE KEY (pas l'anon key) pour créer des utilisateurs

3. Exécutez le script:
   node create-user.js

4. L'utilisateur pourra se connecter avec:
   📧 Email: clarjybrian@outlook.fr  
   🔒 Mot de passe: TempPassword123!
`)

// Exécuter seulement si les variables sont configurées
if (supabaseServiceKey !== 'YOUR_SUPABASE_SERVICE_KEY') {
  createUser()
} else {
  console.log('❌ Veuillez d\'abord configurer votre SERVICE KEY Supabase dans le script.')
  console.log('🔑 Pour obtenir votre Service Key:')
  console.log('1. Allez sur https://supabase.com/dashboard/project/dqoncbnvyviurirsdtyu/settings/api')
  console.log('2. Dans la section "Project API keys", copiez la "service_role" key')
  console.log('3. Remplacez YOUR_SUPABASE_SERVICE_KEY dans ce script')
  console.log('4. Exécutez: node create-user.js')
}
