import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const NotificationSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    bookingReminders: true,
    paymentConfirmations: true,
    promotionalOffers: false,
    tripUpdates: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testNotification = () => {
    Alert.alert(
      'Test de notification',
      'Cette fonctionnalité sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingRow = ({ icon, title, subtitle, value, onValueChange, disabled = false }) => (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={disabled ? COLORS.text.secondary : COLORS.primary} />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: COLORS.border, true: COLORS.primary + '40' }}
        thumbColor={value ? COLORS.primary : COLORS.text.secondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={testNotification}>
          <Ionicons name="notifications" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Notifications principales */}
        <SettingSection title="Types de notifications">
          <SettingRow
            icon="phone-portrait"
            title="Notifications push"
            subtitle="Recevoir des alertes sur votre appareil"
            value={settings.pushNotifications}
            onValueChange={(value) => handleSettingChange('pushNotifications', value)}
          />
          
          <SettingRow
            icon="mail"
            title="Notifications email"
            subtitle="Recevoir des emails de confirmation"
            value={settings.emailNotifications}
            onValueChange={(value) => handleSettingChange('emailNotifications', value)}
          />
          
          <SettingRow
            icon="chatbubble"
            title="Notifications SMS"
            subtitle="Recevoir des SMS importants"
            value={settings.smsNotifications}
            onValueChange={(value) => handleSettingChange('smsNotifications', value)}
          />
        </SettingSection>

        {/* Contenu des notifications */}
        <SettingSection title="Contenu">
          <SettingRow
            icon="time"
            title="Rappels de voyage"
            subtitle="Alertes avant le départ"
            value={settings.bookingReminders}
            onValueChange={(value) => handleSettingChange('bookingReminders', value)}
            disabled={!settings.pushNotifications}
          />
          
          <SettingRow
            icon="card"
            title="Confirmations de paiement"
            subtitle="Notifications des transactions"
            value={settings.paymentConfirmations}
            onValueChange={(value) => handleSettingChange('paymentConfirmations', value)}
            disabled={!settings.pushNotifications}
          />
          
          <SettingRow
            icon="bus"
            title="Mises à jour de voyage"
            subtitle="Changements d'horaires, retards"
            value={settings.tripUpdates}
            onValueChange={(value) => handleSettingChange('tripUpdates', value)}
            disabled={!settings.pushNotifications}
          />
          
          <SettingRow
            icon="pricetag"
            title="Offres promotionnelles"
            subtitle="Réductions et offres spéciales"
            value={settings.promotionalOffers}
            onValueChange={(value) => handleSettingChange('promotionalOffers', value)}
            disabled={!settings.pushNotifications}
          />
        </SettingSection>

        {/* Heures silencieuses */}
        <SettingSection title="Heures silencieuses">
          <SettingRow
            icon="moon"
            title="Mode silencieux"
            subtitle="Désactiver les notifications pendant certaines heures"
            value={settings.quietHoursEnabled}
            onValueChange={(value) => handleSettingChange('quietHoursEnabled', value)}
            disabled={!settings.pushNotifications}
          />
          
          {settings.quietHoursEnabled && (
            <View style={styles.quietHoursContainer}>
              <TouchableOpacity style={styles.timeSelector}>
                <Text style={styles.timeLabel}>Début</Text>
                <Text style={styles.timeValue}>{settings.quietHoursStart}</Text>
              </TouchableOpacity>
              
              <View style={styles.timeSeparator}>
                <Ionicons name="arrow-forward" size={16} color={COLORS.text.secondary} />
              </View>
              
              <TouchableOpacity style={styles.timeSelector}>
                <Text style={styles.timeLabel}>Fin</Text>
                <Text style={styles.timeValue}>{settings.quietHoursEnd}</Text>
              </TouchableOpacity>
            </View>
          )}
        </SettingSection>

        {/* Actions */}
        <SettingSection title="Actions">
          <TouchableOpacity style={styles.actionButton} onPress={testNotification}>
            <Ionicons name="notifications" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Tester les notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Historique', 'Cette fonctionnalité sera bientôt disponible')}
          >
            <Ionicons name="list" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Historique des notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </SettingSection>

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
  
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  
  settingRowDisabled: {
    opacity: 0.5,
  },
  
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  settingContent: {
    flex: 1,
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  settingTitleDisabled: {
    color: COLORS.text.secondary,
  },
  
  settingSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  quietHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  
  timeSelector: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  timeLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  timeSeparator: {
    marginHorizontal: SPACING.md,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  
  actionButtonText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: SPACING.md,
    flex: 1,
  },
});

export default NotificationSettingsScreen;
