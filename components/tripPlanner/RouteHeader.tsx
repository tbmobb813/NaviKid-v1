import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { StarRating } from './StarRating';

type RouteHeaderProps = {
  from: string;
  to: string;
  totalDuration: number;
  kidFriendlyRating: number;
};

export const RouteHeader: React.FC<RouteHeaderProps> = ({
  from,
  to,
  totalDuration,
  kidFriendlyRating,
}) => {
  return (
    <View style={styles.selectedTripHeader}>
      <Text style={styles.selectedTripTitle}>
        {from} → {to}
      </Text>
      <View style={styles.selectedTripMeta}>
        <Text style={styles.selectedTripDuration}>{totalDuration} minutes</Text>
        <StarRating rating={kidFriendlyRating} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectedTripHeader: {
    marginBottom: 20,
  },
  selectedTripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  selectedTripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTripDuration: {
    fontSize: 16,
    color: Colors.textLight,
  },
});
