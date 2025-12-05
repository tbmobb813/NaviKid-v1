import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { TripPlan } from '@/hooks/tripPlanner/types';
import { TripPlannerRouteCard } from './TripPlannerRouteCard';

type TripPlannerRouteListProps = {
  tripOptions: TripPlan[];
  onSelectTrip: (trip: TripPlan) => void;
};

export const TripPlannerRouteList: React.FC<TripPlannerRouteListProps> = ({
  tripOptions,
  onSelectTrip,
}) => {
  if (tripOptions.length === 0) {
    return null;
  }

  return (
    <View style={styles.tripOptionsContainer}>
      <Text style={styles.sectionTitle}>Trip Options</Text>
      {tripOptions.map((trip) => (
        <TripPlannerRouteCard key={trip.id} trip={trip} onSelect={onSelectTrip} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tripOptionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
});
