import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TripPlan } from '@/types/trip';
import { TripSegment } from './TripSegment';

type TripDetailsProps = {
  trip: TripPlan;
};

export const TripDetails: React.FC<TripDetailsProps> = ({ trip }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} color="#FFD700" fill={i < rating ? '#FFD700' : 'none'} />
    ));
  };

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
          <TripSegment key={segment.id} segment={segment} />
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  selectedTripHeader: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  selectedTripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  selectedTripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTripDuration: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  segmentsContainer: {
    marginBottom: 20,
  },
  segmentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  remindersContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  funActivitiesContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  funActivitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 12,
  },
  funActivity: {
    fontSize: 14,
    color: '#F57C00',
    marginLeft: 8,
    marginBottom: 6,
    lineHeight: 20,
  },
  emergencyContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 8,
    lineHeight: 20,
  },
});
