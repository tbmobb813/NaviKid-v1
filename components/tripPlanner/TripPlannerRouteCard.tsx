import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TripPlan } from '@/hooks/tripPlanner/types';
import { TripDurationInfo } from './TripDurationInfo';
import { BestTimeDisplay } from './BestTimeDisplay';
import { TripCostInfo } from './TripCostInfo';
import { SelectRouteButton } from './SelectRouteButton';

type TripPlannerRouteCardProps = {
  trip: TripPlan;
  onSelect: (trip: TripPlan) => void;
};

export const TripPlannerRouteCard: React.FC<TripPlannerRouteCardProps> = ({ trip, onSelect }) => {
  return (
    <View style={styles.tripCard}>
      <TripDurationInfo
        totalDuration={trip.totalDuration}
        totalWalkingTime={trip.totalWalkingTime}
        kidFriendlyRating={trip.kidFriendlyRating}
        difficulty={trip.difficulty}
      />

      <BestTimeDisplay bestTime={trip.bestTimeToGo} />

      <TripCostInfo adultCost={trip.estimatedCost.adult} childCost={trip.estimatedCost.child} />

      <SelectRouteButton onPress={() => onSelect(trip)} />
    </View>
  );
};

const styles = StyleSheet.create({
  tripCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
