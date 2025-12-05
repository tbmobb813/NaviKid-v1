import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type DifficultyBadgeProps = {
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const getBackgroundColor = () => {
    switch (difficulty) {
      case 'Easy':
        return '#4CAF50';
      case 'Medium':
        return '#FF9800';
      case 'Hard':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <View style={[styles.difficultyBadge, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.difficultyText}>{difficulty}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
