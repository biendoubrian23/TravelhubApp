// Test d'inscription simple
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testSignUp() {
  console.log('🔄 Test d\'inscription...');
  
  const testEmail = `test${Date.now()}@test.com`;
  const testPassword = 'test123456';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'client'
        }
      }
    });
    
    if (error) {
      console.log('❌ Erreur inscription:', error.message);
      return false;
    }
    
    console.log('✅ Inscription réussie!');
    console.log('📧 Email:', data.user?.email);
    console.log('🆔 ID:', data.user?.id);
    
    // Vérifier si le profil utilisateur a été créé
    await checkUserProfile(data.user?.id);
    
    return true;
  } catch (err) {
    console.log('❌ Erreur:', err.message);
    return false;
  }
}

async function checkUserProfile(userId) {
  console.log('🔄 Vérification du profil utilisateur...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (error) {
      console.log('❌ Erreur lecture profil:', error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Profil utilisateur créé automatiquement');
      console.log('👤 Données:', data[0]);
    } else {
      console.log('❌ Aucun profil trouvé - Le trigger ne fonctionne pas');
    }
    
    return true;
  } catch (err) {
    console.log('❌ Erreur vérification profil:', err.message);
    return false;
  }
}

async function testSignIn() {
  console.log('\n🔄 Test de connexion avec compte existant...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@test.com',
      password: 'test123'
    });
    
    if (error) {
      console.log('❌ Erreur connexion:', error.message);
      return false;
    }
    
    console.log('✅ Connexion réussie!');
    console.log('📧 Email:', data.user?.email);
    
    return true;
  } catch (err) {
    console.log('❌ Erreur:', err.message);
    return false;
  }
}

// Exécuter les tests
async function runAuthTests() {
  await testSignIn();
  await testSignUp();
}

runAuthTests();
