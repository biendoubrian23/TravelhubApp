// Script alternatif pour créer un utilisateur via l'inscription normale
import { createClient } from '@supabase/supabase-js'

// Configuration Supabase (depuis votre .env)
const supabaseUrl = 'https://dqoncbnvyviurirsdtyu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb25jYm52eXZpdXJpcnNkdHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNzc4NDEsImV4cCI6MjA2OTc1Mzg0MX0.gsvrCIlp0NIaCmssExkbslbJjiZJ_A4u5lD0XG_ncY0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function signUpUser() {
  try {
    console.log('🔄 Inscription de l\'utilisateur...')
    
    // Inscription normale comme dans l'application
    const { data, error } = await supabase.auth.signUp({
      email: 'clarjybrian@outlook.fr',
      password: 'TravelHub2025!', // Mot de passe fort
      options: {
        data: {
          nom: 'BRIAN',
          prenom: 'CLARJY', 
          telephone: '',
          role: 'client'
        }
      }
    })

    if (error) {
      console.error('❌ Erreur lors de l\'inscription:', error.message)
      
      if (error.message.includes('User already registered')) {
        console.log('ℹ️  L\'utilisateur existe déjà. Tentative de connexion...')
        
        // Tenter la connexion
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'clarjybrian@outlook.fr',
          password: 'TravelHub2025!'
        })
        
        if (signInError) {
          console.error('❌ Erreur de connexion:', signInError.message)
          console.log('💡 L\'utilisateur existe mais avec un autre mot de passe.')
        } else {
          console.log('✅ Connexion réussie!')
          console.log('👤 Utilisateur:', signInData.user.email)
        }
      }
      return
    }

    console.log('✅ Inscription réussie!')
    console.log('📧 Email:', data.user?.email)
    console.log('🆔 ID:', data.user?.id)
    console.log('👤 Métadonnées:', data.user?.user_metadata)
    
    if (data.user && !data.user.email_confirmed_at) {
      console.log('\n📬 Un email de confirmation a été envoyé à:', data.user.email)
      console.log('⚠️  L\'utilisateur doit confirmer son email avant de pouvoir se connecter.')
    }
    
    console.log('\n🔑 Informations de connexion:')
    console.log('📧 Email: clarjybrian@outlook.fr')
    console.log('🔒 Mot de passe: TravelHub2025!')
    
  } catch (error) {
    console.error('💥 Erreur inattendue:', error)
  }
}

console.log(`
🚀 CRÉATION D'UTILISATEUR - MÉTHODE NORMALE

Ce script utilise la méthode d'inscription normale (pas l'API admin).
L'utilisateur devra peut-être confirmer son email selon votre configuration Supabase.

📋 Informations de l'utilisateur à créer:
📧 Email: clarjybrian@outlook.fr
🔒 Mot de passe: TravelHub2025!
👤 Rôle: client
📝 Nom: BRIAN CLARJY

`)

signUpUser()
