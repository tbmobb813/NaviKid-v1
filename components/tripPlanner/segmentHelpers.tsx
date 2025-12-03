import React from 'react';
import { MapPin, Train, Bus, Navigation } from 'lucide-react-native';
import Colors from '@/constants/colors';

export const getSegmentIcon = (type: string) => {
  switch (type) {
    case 'walk':
      return <MapPin size={20} color={Colors.primary} />;
    case 'subway':
      return <Train size={20} color={Colors.primary} />;
    case 'bus':
      return <Bus size={20} color={Colors.primary} />;
    case 'transfer':
      return <Navigation size={20} color={Colors.primary} />;
    default:
      return <MapPin size={20} color={Colors.primary} />;
  }
};

export const getSegmentTypeLabel = (type: string): string => {
  switch (type) {
    case 'walk':
      return '🚶 Walk';
    case 'subway':
      return '🚇 Subway';
    case 'bus':
      return '🚌 Bus';
    case 'transfer':
      return '🔄 Transfer';
    default:
      return type;
  }
};
