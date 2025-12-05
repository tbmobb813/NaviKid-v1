import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { StarRating } from './StarRating';
import { DifficultyBadge } from './DifficultyBadge';

type TripDurationInfoProps = {
  totalDuration: number;
  totalWalkingTime: number;
  kidFriendlyRating: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

export const TripDurationInfo: React.FC<TripDurationInfoProps> = ({
  totalDuration,
  totalWalkingTime,
  kidFriendlyRating,
  difficulty,
}) => {
  return (
    <View style={styles.tripHeader}>
      <View style={styles.tripInfo}>
        <Text style={styles.tripDuration}>{totalDuration} minutes total</Text>
        <Text style={styles.walkingTime}>{totalWalkingTime} min walking</Text>
      </View>
      <View style={styles.tripRating}>
        <View style={styles.starRatingWrapper}>
          <StarRating rating={kidFriendlyRating} />
        </View>
        <DifficultyBadge difficulty={difficulty} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  starRatingWrapper: {
    marginBottom: 4,
  },
});
