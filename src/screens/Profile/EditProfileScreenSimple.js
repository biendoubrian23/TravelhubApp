import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { useAuthStore } from '../../store';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    profileImage: null,
  });

  useEffect(() => {
    if (user?.user_metadata) {
      setProfileData({
        firstName: user.user_metadata.firstName || '',
        lastName: user.user_metadata.lastName || '',
        phone: user.user_metadata.phone || '',
        dateOfBirth: user.user_metadata.dateOfBirth || '',
        gender: user.user_metadata.gender || '',
        address: user.user_metadata.address || '',
        city: user.user_metadata.city || '',
        emergencyContactName: user.user_metadata.emergencyContactName || '',
        emergencyContactPhone: user.user_metadata.emergencyContactPhone || '',
        profileImage: user.user_metadata.profileImage || null,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(profileData);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    Alert.alert('Photo de profil', 'Cette fonctionnalité sera bientôt disponible');
  };

  const pickEmergencyContact = async () => {
    Alert.alert('Contacts', 'Cette fonctionnalité sera bientôt disponible');
  };

  const FormSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const GenderSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Genre</Text>
      <View style={styles.genderContainer}>
        {['Homme', 'Femme', 'Autre'].map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.genderOption,
              profileData.gender === gender && styles.genderOptionSelected
            ]}
            onPress={() => setProfileData(prev => ({ ...prev, gender }))}
          >
            <Text style={[
              styles.genderText,
              profileData.gender === gender && styles.genderTextSelected
            ]}>
              {gender}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            Enregistrer
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Photo de profil */}
        <FormSection title="Photo de profil">
          <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
            {profileData.profileImage ? (
              <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color={COLORS.text.secondary} />
              </View>
            )}
            <View style={styles.imageEditOverlay}>
              <Ionicons name="pencil" size={16} color={COLORS.surface} />
            </View>
          </TouchableOpacity>
        </FormSection>

        {/* Informations personnelles */}
        <FormSection title="Informations personnelles">
          <InputField
            label="Prénom"
            value={profileData.firstName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, firstName: text }))}
            placeholder="Votre prénom"
          />
          
          <InputField
            label="Nom"
            value={profileData.lastName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, lastName: text }))}
            placeholder="Votre nom"
          />
          
          <InputField
            label="Téléphone"
            value={profileData.phone}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
            placeholder="+237 6XX XXX XXX"
            keyboardType="phone-pad"
          />
          
          <InputField
            label="Date de naissance"
            value={profileData.dateOfBirth}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, dateOfBirth: text }))}
            placeholder="JJ/MM/AAAA"
          />
          
          <GenderSelector />
        </FormSection>

        {/* Adresse */}
        <FormSection title="Adresse">
          <InputField
            label="Adresse"
            value={profileData.address}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, address: text }))}
            placeholder="Votre adresse complète"
            multiline
          />
          
          <InputField
            label="Ville"
            value={profileData.city}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, city: text }))}
            placeholder="Votre ville"
          />
        </FormSection>

        {/* Contact d'urgence */}
        <FormSection title="Contact d'urgence">
          <TouchableOpacity style={styles.contactPicker} onPress={pickEmergencyContact}>
            <Ionicons name="person-add" size={20} color={COLORS.primary} />
            <Text style={styles.contactPickerText}>Sélectionner depuis les contacts</Text>
          </TouchableOpacity>
          
          <InputField
            label="Nom du contact d'urgence"
            value={profileData.emergencyContactName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, emergencyContactName: text }))}
            placeholder="Nom du contact"
          />
          
          <InputField
            label="Téléphone du contact d'urgence"
            value={profileData.emergencyContactPhone}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, emergencyContactPhone: text }))}
            placeholder="+237 6XX XXX XXX"
            keyboardType="phone-pad"
          />
        </FormSection>

        <View style={{ height: 50 }} />
      </ScrollView>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  saveButtonDisabled: {
    color: COLORS.text.secondary,
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  imageEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 30,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  inputContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
  },
  
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  genderContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  
  genderOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  genderOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  
  genderText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  
  genderTextSelected: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  
  contactPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '10',
  },
  
  contactPickerText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
});

export default EditProfileScreen;
