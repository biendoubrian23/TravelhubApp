// Test simple de connectivité Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuration Supabase:');
console.log('URL:', supabaseUrl);
console.log('Clé:', supabaseKey ? 'Configurée' : 'Manquante');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('\n🔄 Test de connexion...');
  
  try {
    // Test simple de ping
    const { data, error } = await supabase
      .from('test_table_that_does_not_exist')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('✅ Connexion Supabase réussie! (Base accessible)');
        return true;
      } else {
        console.log('❌ Erreur:', error.message);
        return false;
      }
    }
  } catch (err) {
    console.log('❌ Erreur de connexion:', err.message);
    return false;
  }
}

async function testAuth() {
  console.log('🔄 Test service d\'authentification...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Erreur auth:', error.message);
      return false;
    }
    
    console.log('✅ Service d\'authentification disponible');
    return true;
  } catch (err) {
    console.log('❌ Erreur auth:', err.message);
    return false;
  }
}

async function testTables() {
  console.log('🔄 Test existence des tables...');
  
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
        console.log(`✅ Table "${table}": OK (${data?.length || 0} entrées)`);
      }
    } catch (err) {
      console.log(`❌ Table "${table}": ${err.message}`);
    }
  }
}

// Exécuter tous les tests
async function runTests() {
  await testConnection();
  await testAuth();
  await testTables();
}

runTests();
