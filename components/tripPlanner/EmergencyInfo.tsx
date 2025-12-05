import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type EmergencyInfoProps = {
  nearestHospital: string;
  transitPolice: string;
  helpfulStaff: string[];
};

export const EmergencyInfo: React.FC<EmergencyInfoProps> = ({
  nearestHospital,
  transitPolice,
  helpfulStaff,
}) => {
  return (
    <View style={styles.emergencyContainer}>
      <Text style={styles.emergencyTitle}>🚨 Emergency Information</Text>
      <Text style={styles.emergencyItem}>🏥 Hospital: {nearestHospital}</Text>
      <Text style={styles.emergencyItem}>👮 Transit Police: {transitPolice}</Text>
      <Text style={styles.emergencyItem}>👥 Helpful Staff: {helpfulStaff.join(', ')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
