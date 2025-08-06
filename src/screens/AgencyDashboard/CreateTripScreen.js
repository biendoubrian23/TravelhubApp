import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// iOS Design System Colors
const COLORS = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  primary: '#007AFF',
  secondary: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  purple: '#AF52DE',
  text: {
    primary: '#1C1C1E',
    secondary: '#8E8E93',
  },
  border: '#E5E5E7',
  separator: '#C6C6C8',
};

const CreateTripScreen = ({ navigation }) => {
  const [tripData, setTripData] = useState({
    departure: '',
    arrival: '',
    departureDate: new Date(),
    departureTime: new Date(),
    arrivalTime: new Date(),
    busType: 'classic',
    totalSeats: 50,
    price: '',
    description: '',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(null);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [selectedCityField, setSelectedCityField] = useState(null);

  const cameroonCities = [
    'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Maroua', 'Nkongsamba',
    'Bafoussam', 'Ngaoundéré', 'Bertoua', 'Loum', 'Kumba', 'Edéa',
    'Tiko', 'Kribi', 'Dschang', 'Mbouda', 'Foumban', 'Ebolowa'
  ];

  const busTypes = [
    { id: 'classic', name: 'Classique', price: '12,000', features: ['Sièges standard', 'Climatisation'] },
    { id: 'vip', name: 'VIP', price: '18,000', features: ['Sièges inclinables', 'Climatisation', 'WiFi', 'Collation'] }
  ];

  const handleSave = () => {
    if (!tripData.departure || !tripData.arrival || !tripData.price) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (tripData.departure === tripData.arrival) {
      Alert.alert('Erreur', 'La ville de départ et d\'arrivée doivent être différentes');
      return;
    }

    // TODO: Sauvegarder le trajet dans la base de données
    Alert.alert(
      'Succès',
      'Le trajet a été créé avec succès !',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const selectCity = (city) => {
    setTripData(prev => ({
      ...prev,
      [selectedCityField]: city
    }));
    setCityModalVisible(false);
  };

  const openCitySelector = (field) => {
    setSelectedCityField(field);
    setCityModalVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTripData(prev => ({ ...prev, departureDate: selectedDate }));
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(null);
    if (selectedTime) {
      setTripData(prev => ({ ...prev, [showTimePicker]: selectedTime }));
    }
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau trajet</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Villes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinéraire</Text>
          
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => openCitySelector('departure')}
          >
            <Ionicons name="location" size={20} color="#FF8A00" style={styles.inputIcon} />
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Ville de départ</Text>
              <Text style={[styles.inputValue, !tripData.departure && styles.placeholder]}>
                {tripData.departure || 'Sélectionner une ville'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => openCitySelector('arrival')}
          >
            <Ionicons name="flag" size={20} color="#4CAF50" style={styles.inputIcon} />
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Ville d'arrivée</Text>
              <Text style={[styles.inputValue, !tripData.arrival && styles.placeholder]}>
                {tripData.arrival || 'Sélectionner une ville'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Date et heures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horaires</Text>
          
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#2196F3" style={styles.inputIcon} />
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Date de départ</Text>
              <Text style={styles.inputValue}>{formatDate(tripData.departureDate)}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          <View style={styles.timeRow}>
            <TouchableOpacity 
              style={[styles.inputContainer, styles.timeInput]}
              onPress={() => setShowTimePicker('departureTime')}
            >
              <Ionicons name="time" size={20} color="#FF9800" style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Heure départ</Text>
                <Text style={styles.inputValue}>{formatTime(tripData.departureTime)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.inputContainer, styles.timeInput]}
              onPress={() => setShowTimePicker('arrivalTime')}
            >
              <Ionicons name="time" size={20} color="#9C27B0" style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Heure arrivée</Text>
                <Text style={styles.inputValue}>{formatTime(tripData.arrivalTime)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Type de bus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de bus</Text>
          
          {busTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.busTypeCard,
                tripData.busType === type.id && styles.busTypeCardSelected
              ]}
              onPress={() => setTripData(prev => ({ ...prev, busType: type.id }))}
            >
              <View style={styles.busTypeHeader}>
                <View>
                  <Text style={[
                    styles.busTypeName,
                    tripData.busType === type.id && styles.busTypeNameSelected
                  ]}>
                    {type.name}
                  </Text>
                  <Text style={styles.busTypePrice}>À partir de {type.price} FCFA</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  tripData.busType === type.id && styles.radioButtonSelected
                ]}>
                  {tripData.busType === type.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
              <View style={styles.busTypeFeatures}>
                {type.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="people" size={20} color="#607D8B" style={styles.inputIcon} />
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Nombre de sièges</Text>
              <TextInput
                style={styles.textInput}
                value={tripData.totalSeats.toString()}
                onChangeText={(text) => setTripData(prev => ({ ...prev, totalSeats: parseInt(text) || 0 }))}
                keyboardType="numeric"
                placeholder="50"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="cash" size={20} color="#4CAF50" style={styles.inputIcon} />
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Prix par siège (FCFA)</Text>
              <TextInput
                style={styles.textInput}
                value={tripData.price}
                onChangeText={(text) => setTripData(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
                placeholder="12000"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="document-text" size={20} color="#FF9800" style={styles.inputIcon} />
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Description (optionnel)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={tripData.description}
                onChangeText={(text) => setTripData(prev => ({ ...prev, description: text }))}
                placeholder="Informations supplémentaires..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Sélectionner une ville
              </Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.cityList}>
              {cameroonCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.cityItem}
                  onPress={() => selectCity(city)}
                >
                  <Ionicons name="location" size={20} color="#FF8A00" />
                  <Text style={styles.cityName}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={tripData.departureDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={tripData[showTimePicker]}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.4,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 6,
    fontWeight: '400',
  },
  inputValue: {
    fontSize: 17,
    color: COLORS.text.primary,
    fontWeight: '400',
  },
  placeholder: {
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  textInput: {
    fontSize: 17,
    color: COLORS.text.primary,
    padding: 0,
    fontWeight: '400',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  busTypeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  busTypeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  busTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  busTypeName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  busTypeNameSelected: {
    color: COLORS.primary,
  },
  busTypePrice: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 2,
    fontWeight: '400',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  busTypeFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.4,
  },
  cityList: {
    flex: 1,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  cityName: {
    fontSize: 17,
    color: COLORS.text.primary,
    marginLeft: 12,
    fontWeight: '400',
  },
});

export default CreateTripScreen;
