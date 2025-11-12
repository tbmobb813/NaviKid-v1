import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import globalStyles from '../styles';
import { Place } from '@/types/navigation';
import Colors from '@/constants/colors';
import {
  Home,
  School,
  BookOpen,
  Trees,
  Store,
  Utensils,
  Users,
  Heart,
  MapPin,
} from 'lucide-react-native';

type PlaceCardProps = {
  place: Place;
  onPress: (place: Place) => void;
};

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress }) => {
  const getIcon = () => {
    switch (place.category) {
      case 'home':
        return <Home size={24} color={Colors.primary} />;
      case 'school':
        return <School size={24} color={Colors.primary} />;
      case 'library':
        return <BookOpen size={24} color={Colors.primary} />;
      case 'park':
        return <Trees size={24} color={Colors.primary} />;
      case 'store':
        return <Store size={24} color={Colors.primary} />;
      case 'restaurant':
        return <Utensils size={24} color={Colors.primary} />;
      case 'friend':
        return <Users size={24} color={Colors.primary} />;
      case 'family':
        return <Heart size={24} color={Colors.primary} />;
      default:
        return <MapPin size={24} color={Colors.primary} />;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, globalStyles.shadow, pressed && globalStyles.pressed]}
      onPress={() => onPress(place)}
    >
      <View style={globalStyles.iconContainerLarge}>{getIcon()}</View>
      <View style={globalStyles.contentItemContent}>
        <Text style={globalStyles.title}>{place.name}</Text>
        <Text style={globalStyles.subtitle} numberOfLines={1}>
          {place.address}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
});

export default PlaceCard;
