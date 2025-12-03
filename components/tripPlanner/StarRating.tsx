import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';

type StarRatingProps = {
  rating: number;
  size?: number;
};

export const StarRating: React.FC<StarRatingProps> = ({ rating, size = 16 }) => {
  return (
    <View style={styles.starsContainer}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          color={i < rating ? '#FFB300' : '#E0E0E0'}
          fill={i < rating ? '#FFB300' : 'transparent'}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  starsContainer: {
    flexDirection: 'row',
  },
});
