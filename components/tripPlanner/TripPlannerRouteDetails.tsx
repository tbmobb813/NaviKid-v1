import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { TripPlan } from '@/hooks/tripPlanner/types';
import { TripSegmentCard } from './TripSegmentCard';
import { RouteHeader } from './RouteHeader';
import { ThingsToRemember } from './ThingsToRemember';
import { FunActivitiesList } from './FunActivitiesList';
import { EmergencyInfo } from './EmergencyInfo';

type TripPlannerRouteDetailsProps = {
  trip: TripPlan | null;
};

export const TripPlannerRouteDetails: React.FC<TripPlannerRouteDetailsProps> = ({ trip }) => {
  if (!trip) {
    return null;
  }

  return (
    <View style={styles.selectedTripContainer}>
      <Text style={styles.sectionTitle}>Your Selected Route</Text>

      <RouteHeader
        from={trip.from}
        to={trip.to}
        totalDuration={trip.totalDuration}
        kidFriendlyRating={trip.kidFriendlyRating}
      />

      <View style={styles.segmentsContainer}>
        <Text style={styles.segmentsTitle}>Step-by-Step Directions</Text>
        {trip.segments.map((segment) => (
          <TripSegmentCard key={segment.id} segment={segment} />
        ))}
      </View>

      <ThingsToRemember reminders={trip.thingsToRemember} />

      <FunActivitiesList activities={trip.funAlongTheWay} />

      <EmergencyInfo
        nearestHospital={trip.emergencyInfo.nearestHospital}
        transitPolice={trip.emergencyInfo.transitPolice}
        helpfulStaff={trip.emergencyInfo.helpfulStaff}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  selectedTripContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  segmentsContainer: {
    marginBottom: 24,
  },
  segmentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
});
