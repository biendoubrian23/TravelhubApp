// Test de connectivité Supabase
import { supabase } from './src/services/supabase.js';

// Test de connectivité Supabase
import { supabase } from './src/services/supabase.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement pour Node.js
dotenv.config();

async function testBasicConnection() {
  console.log('🔄 Test de connexion de base...');
  console.log('📍 URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('🔑 Clé:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Configurée' : 'Manquante');
  
  try {
    // Test très basique - juste ping
    const { data, error } = await supabase
      .from('non_existent_table')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.non_existent_table" does not exist')) {
        console.log('✅ Connexion Supabase OK (base de données accessible)');
        return true;
      } else {
        console.error('❌ Erreur Supabase:', error.message);
        return false;
      }
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Erreur de connexion:', err.message);
    return false;
  }
}

async function testTablesExistence() {
  console.log('🔄 Test d\'existence des tables...');
  
  const tables = ['users', 'agencies', 'trips'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table "${table}": ${error.message}`);
      } else {
        console.log(`✅ Table "${table}": OK`);
      }
    } catch (err) {
      console.log(`❌ Table "${table}": ${err.message}`);
    }
  }
}

async function testSupabaseConnection() {
  console.log('🔄 Test de connectivité Supabase...');
  
  try {
    // Test de connexion basique
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return false;
    }
    
    console.log('✅ Connexion Supabase réussie !');
    console.log('📊 Données test:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Erreur de connexion:', err);
    return false;
  }
}

// Test d'authentification
async function testAuthentication() {
  console.log('🔄 Test d\'authentification...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erreur auth:', error);
      return false;
    }
    
    console.log('✅ Service d\'authentification disponible');
    console.log('👤 Session actuelle:', data.session ? 'Connecté' : 'Non connecté');
    return true;
    
  } catch (err) {
    console.error('❌ Erreur auth:', err);
    return false;
  }
}

// Exécuter les tests
async function runAllTests() {
  console.log('🚀 Début des tests Supabase\n');
  
  await testBasicConnection();
  console.log('');
  
  await testTablesExistence();
  console.log('');
  
  await testAuthentication();
  console.log('');
  
  await testSupabaseConnection();
  
  console.log('\n✨ Tests terminés');
}

runAllTests();
