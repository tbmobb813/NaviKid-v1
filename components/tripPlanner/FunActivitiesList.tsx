import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type FunActivitiesListProps = {
  activities: string[];
};

export const FunActivitiesList: React.FC<FunActivitiesListProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <View style={styles.funActivitiesContainer}>
      <Text style={styles.funActivitiesTitle}>🎉 Fun Things to Do Along the Way</Text>
      {activities.map((activity, index) => (
        <Text key={index} style={styles.funActivity}>
          • {activity}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
});
