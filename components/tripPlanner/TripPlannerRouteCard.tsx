import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Star, Play } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TripPlan } from '@/hooks/tripPlanner/types';

type TripPlannerRouteCardProps = {
  trip: TripPlan;
  onSelect: (trip: TripPlan) => void;
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

export const TripPlannerRouteCard: React.FC<TripPlannerRouteCardProps> = ({ trip, onSelect }) => {
  return (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDuration}>{trip.totalDuration} minutes total</Text>
          <Text style={styles.walkingTime}>{trip.totalWalkingTime} min walking</Text>
        </View>
        <View style={styles.tripRating}>
          <View style={styles.starsContainer}>{renderStars(trip.kidFriendlyRating)}</View>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  trip.difficulty === 'Easy'
                    ? '#4CAF50'
                    : trip.difficulty === 'Medium'
                      ? '#FF9800'
                      : '#F44336',
              },
            ]}
          >
            <Text style={styles.difficultyText}>{trip.difficulty}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.bestTime}>⏰ {trip.bestTimeToGo}</Text>

      <View style={styles.costContainer}>
        <Text style={styles.costText}>
          💰 ${trip.estimatedCost.adult.toFixed(2)} per adult
          {trip.estimatedCost.child === 0 ? ' • Kids ride free!' : ''}
        </Text>
      </View>

      <TouchableOpacity style={styles.selectTripButton} onPress={() => onSelect(trip)}>
        <Play size={16} color="#FFFFFF" />
        <Text style={styles.selectTripText}>Select This Route</Text>
      </TouchableOpacity>
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripDuration: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  walkingTime: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  tripRating: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bestTime: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  costContainer: {
    marginBottom: 12,
  },
  costText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  selectTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectTripText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
