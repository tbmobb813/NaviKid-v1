import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Play, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TripPlan } from '@/types/trip';

type TripOptionProps = {
  trip: TripPlan;
  onSelect: (trip: TripPlan) => void;
};

export const TripOption: React.FC<TripOptionProps> = ({ trip, onSelect }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} color="#FFD700" fill={i < rating ? '#FFD700' : 'none'} />
    ));
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Easy: '#4CAF50',
      Medium: '#FF9800',
      Hard: '#F44336',
    };
    return colors[difficulty as keyof typeof colors] || colors.Easy;
  };

  return (
    <TouchableOpacity style={styles.tripCard} onPress={() => onSelect(trip)}>
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDuration}>{trip.totalDuration} min total</Text>
          <Text style={styles.walkingTime}>{trip.totalWalkingTime} min walking</Text>
        </View>
        <View style={styles.tripRating}>
          <View style={styles.starsContainer}>{renderStars(trip.kidFriendlyRating)}</View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(trip.difficulty) },
            ]}
          >
            <Text style={styles.difficultyText}>{trip.difficulty}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.bestTime}>🕐 Best time: {trip.bestTimeToGo}</Text>

      <View style={styles.costContainer}>
        <Text style={styles.costText}>
          💰 Adult: ${trip.estimatedCost.adult} • Child: Free (under 44 inches)
        </Text>
      </View>

      <TouchableOpacity style={styles.selectTripButton} onPress={() => onSelect(trip)}>
        <Play size={16} color="#FFFFFF" />
        <Text style={styles.selectTripText}>Choose This Route</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripDuration: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  walkingTime: {
    fontSize: 13,
    color: Colors.textLight,
  },
  tripRating: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bestTime: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  costContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  costText: {
    fontSize: 13,
    color: Colors.text,
  },
  selectTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  selectTripText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
