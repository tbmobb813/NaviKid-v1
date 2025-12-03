import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Star, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TripPlan } from '@/hooks/tripPlanner/types';
import { TripSegmentCard } from './TripSegmentCard';

type TripPlannerRouteDetailsProps = {
  trip: TripPlan | null;
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={16}
      color={i < rating ? '#FFB300' : '#E0E0E0'}
      fill={i < rating ? '#FFB300' : 'transparent'}
    />
  ));
};

export const TripPlannerRouteDetails: React.FC<TripPlannerRouteDetailsProps> = ({ trip }) => {
  if (!trip) {
    return null;
  }

  return (
    <View style={styles.selectedTripContainer}>
      <Text style={styles.sectionTitle}>Your Selected Route</Text>

      <View style={styles.selectedTripHeader}>
        <Text style={styles.selectedTripTitle}>
          {trip.from} → {trip.to}
        </Text>
        <View style={styles.selectedTripMeta}>
          <Text style={styles.selectedTripDuration}>{trip.totalDuration} minutes</Text>
          <View style={styles.starsContainer}>{renderStars(trip.kidFriendlyRating)}</View>
        </View>
      </View>

      {/* Trip Segments */}
      <View style={styles.segmentsContainer}>
        <Text style={styles.segmentsTitle}>Step-by-Step Directions</Text>
        {trip.segments.map((segment) => (
          <TripSegmentCard key={segment.id} segment={segment} />
        ))}
      </View>

      {/* Important Reminders */}
      <View style={styles.remindersContainer}>
        <Text style={styles.remindersTitle}>📝 Things to Remember</Text>
        {trip.thingsToRemember.map((reminder, index) => (
          <View key={index} style={styles.reminderItem}>
            <CheckCircle size={16} color="#4CAF50" />
            <Text style={styles.reminderText}>{reminder}</Text>
          </View>
        ))}
      </View>

      {/* Fun Activities */}
      <View style={styles.funActivitiesContainer}>
        <Text style={styles.funActivitiesTitle}>🎉 Fun Things to Do Along the Way</Text>
        {trip.funAlongTheWay.map((activity, index) => (
          <Text key={index} style={styles.funActivity}>
            • {activity}
          </Text>
        ))}
      </View>

      {/* Emergency Information */}
      <View style={styles.emergencyContainer}>
        <Text style={styles.emergencyTitle}>🚨 Emergency Information</Text>
        <Text style={styles.emergencyItem}>
          🏥 Hospital: {trip.emergencyInfo.nearestHospital}
        </Text>
        <Text style={styles.emergencyItem}>
          👮 Transit Police: {trip.emergencyInfo.transitPolice}
        </Text>
        <Text style={styles.emergencyItem}>
          👥 Helpful Staff: {trip.emergencyInfo.helpfulStaff.join(', ')}
        </Text>
      </View>
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
  starsContainer: {
    flexDirection: 'row',
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
  remindersContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  funActivitiesContainer: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  funActivitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  funActivity: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
    marginBottom: 4,
  },
  emergencyContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 12,
  },
  emergencyItem: {
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
    marginBottom: 4,
  },
});
