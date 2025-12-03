import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

type TripPlannerHeaderProps = {
  title?: string;
  subtitle?: string;
};

export const TripPlannerHeader: React.FC<TripPlannerHeaderProps> = ({
  title = 'Kid-Friendly Trip Planner',
  subtitle = 'Plan safe and fun trips around NYC!',
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
});
