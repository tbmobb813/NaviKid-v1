import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { TripPlan } from '@/hooks/tripPlanner/types';
import { useTripPlanner } from '@/hooks/tripPlanner/useTripPlanner';
import { useKidFriendlyFilters } from '@/hooks/tripPlanner/useKidFriendlyFilters';
import {
  TripPlannerHeader,
  TripPlannerForm,
  TripPlannerRouteList,
  TripPlannerRouteDetails,
} from '@/components/tripPlanner';

type KidTripPlannerProps = {
  onTripReady?: (trip: TripPlan) => void;
  userLocation?: { lat: number; lng: number; name?: string };
};

const KidTripPlanner: React.FC<KidTripPlannerProps> = ({ onTripReady, userLocation }) => {
  const [fromLocation, setFromLocation] = useState(userLocation?.name || '');
  const [toLocation, setToLocation] = useState('');

  const { tripOptions, selectedTrip, isPlanning, planTrip, selectTrip } = useTripPlanner({
    fromLocation,
    toLocation,
    onTripReady,
  });

  const {
    groupSize,
    accessibilityNeeds,
    incrementAdults,
    decrementAdults,
    incrementChildren,
    decrementChildren,
    toggleWheelchair,
    toggleStroller,
  } = useKidFriendlyFilters();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TripPlannerHeader />

        <TripPlannerForm
          fromLocation={fromLocation}
          toLocation={toLocation}
          groupSize={groupSize}
          accessibilityNeeds={accessibilityNeeds}
          isPlanning={isPlanning}
          onFromLocationChange={setFromLocation}
          onToLocationChange={setToLocation}
          onIncrementAdults={incrementAdults}
          onDecrementAdults={decrementAdults}
          onIncrementChildren={incrementChildren}
          onDecrementChildren={decrementChildren}
          onToggleWheelchair={toggleWheelchair}
          onToggleStroller={toggleStroller}
          onPlanTrip={planTrip}
        />

        <TripPlannerRouteList tripOptions={tripOptions} onSelectTrip={selectTrip} />

        <TripPlannerRouteDetails trip={selectedTrip} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});

export default KidTripPlanner;
