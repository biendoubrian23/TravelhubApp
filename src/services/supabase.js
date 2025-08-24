import { supabase } from './supabaseClient'

// Auth helpers
export const authService = {
  // Inscription
  async signUp(email, password, userData) {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name || `${userData.prenom || ''} ${userData.nom || ''}`.trim(),
            phone: userData.telephone || userData.phone || '',
            ville: userData.ville || null, // Ajouter la ville dans les métadonnées Auth
            role: 'client' // Toujours client
          }
        }
      })

      if (error) {
        return { data, error }
      }

      // 2. Si l'inscription Auth réussit, créer l'utilisateur dans la table users
      if (data.user) {
        // Vérifier d'abord si l'utilisateur existe déjà
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // Erreur autre que "not found"
          console.error('Erreur lors de la vérification de l\'utilisateur:', checkError)
        }

        if (!existingUser) {
          // L'utilisateur n'existe pas, on peut l'insérer
          const userRecord = {
            id: data.user.id, // Utiliser le même ID que Supabase Auth
            email: email.toLowerCase().trim(),
            full_name: userData.full_name || `${userData.prenom || ''} ${userData.nom || ''}`.trim(),
            role: 'client', // Toujours client
            phone: userData.telephone || userData.phone || null,
            ville: userData.ville || null,
            date_of_birth: userData.date_of_birth || null,
            avatar_url: null,
            is_active: true,
            last_login: new Date().toISOString(),
            is_generated_user: false,
            password_changed: false,
            generated_by: null
          }

          const { data: userInsertData, error: userInsertError } = await supabase
            .from('users')
            .insert(userRecord)
            .select()
            .single()

          if (userInsertError) {
            console.error('Erreur lors de la création de l\'utilisateur dans users:', userInsertError)
            // L'utilisateur Auth existe mais pas dans users - on pourrait rollback ici
            // Pour l'instant on continue, l'utilisateur pourra se connecter
          } else {
            console.log('Utilisateur créé avec succès dans la table users:', userInsertData)
          }
        } else {
          console.log('Utilisateur existe déjà dans la table users:', existingUser.id)
        }
      }

      return { data, error }
    } catch (err) {
      console.error('Erreur dans signUp:', err)
      return { data: null, error: err }
    }
  },

  // Connexion
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Connexion Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    })
    return { data, error }
  },

  // Déconnexion
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 🆕 Récupérer le profil utilisateur complet
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // 🆕 Mettre à jour le profil utilisateur
  async updateUserProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          ville: profileData.ville,
          date_of_birth: profileData.date_of_birth,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
        
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // 🆕 Vérifier et compléter le profil utilisateur manquant
  async ensureUserProfile(userId) {
    try {
      // Vérifier si l'utilisateur existe dans la table users
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // L'utilisateur n'existe pas dans la table users, on le crée
        console.log('🔧 Utilisateur manquant dans la table users, création...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userRecord = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.full_name || 'Utilisateur',
            phone: user.user_metadata?.phone || user.phone || null,
            ville: user.user_metadata?.ville || null,
            role: 'client',
            is_active: true,
            last_login: new Date().toISOString(),
            is_generated_user: false
          };

          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert(userRecord)
            .select()
            .single();

          if (createError) {
            console.error('❌ Erreur création utilisateur manquant:', createError);
            return { data: null, error: createError };
          }
          
          console.log('✅ Utilisateur créé dans la table users:', newUser);
          return { data: newUser, error: null };
        }
      }
      
      return { data: existingUser, error: checkError };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Écouter les changements d'auth
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Agency services
export const agencyService = {
  // Récupérer une agence par ID utilisateur
  async getAgencyByUserId(userId) {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // Créer une agence
  async createAgency(agencyData) {
    const { data, error } = await supabase
      .from('agencies')
      .insert(agencyData)
      .select()
    
    return { data, error }
  }
}

// Export du client Supabase pour compatibilité
export { supabase } from './supabaseClient'
