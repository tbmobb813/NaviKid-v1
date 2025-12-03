import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

export const InfoSection: React.FC = () => (
  <View style={styles.infoSection}>
    <Text style={styles.infoTitle}>Transit Data Updates</Text>
    <Text style={styles.infoText}>
      Transit schedules and route information are automatically updated when available. You can
      manually refresh data for any city by tapping "Update Transit".
    </Text>
    <Text style={styles.infoText}>
      Custom cities can be added with their own transit API endpoints for real-time data
      integration.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  infoSection: {
    padding: 16,
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 8,
  },
});
