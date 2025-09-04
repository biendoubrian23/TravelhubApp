import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import NotificationsList from '../components/Notifications/NotificationsList';

const NotificationsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NotificationsList navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default NotificationsScreen;
