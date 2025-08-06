import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Button,
  Surface
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1, padding: SPACING.md }}>
        {/* Header */}
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          marginBottom: SPACING.md,
          color: COLORS.text.primary 
        }}>
          Mes favoris
        </Text>

        {/* Empty State */}
        <Card style={{ elevation: 2 }}>
          <Card.Content style={{ alignItems: 'center', padding: SPACING.xl }}>
            <Ionicons 
              name="heart-outline" 
              size={64} 
              color={COLORS.text.secondary} 
            />
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              marginTop: SPACING.md,
              color: COLORS.text.primary 
            }}>
              Aucun favori
            </Text>
            <Text style={{ 
              color: COLORS.text.secondary, 
              textAlign: 'center',
              marginTop: SPACING.sm,
              marginBottom: SPACING.lg 
            }}>
              Ajoutez des trajets ou agences à vos favoris pour les retrouver rapidement ici.
            </Text>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Home')}
            >
              Découvrir des trajets
            </Button>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
};

export default FavoritesScreen;
