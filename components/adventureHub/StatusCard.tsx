import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

type StatusCardProps = {
  isInZone: boolean;
  zoneName?: string;
};

export const StatusCard: React.FC<StatusCardProps> = ({ isInZone, zoneName }) => (
  <View style={[styles.statusCard, { backgroundColor: isInZone ? '#E3F2FD' : '#F3E5F5' }]}>
    <View style={[styles.statusIndicator, { backgroundColor: isInZone ? '#2196F3' : '#9C27B0' }]} />
    <Text style={styles.statusText}>
      {isInZone ? `🎯 You're exploring ${zoneName}!` : '🗺️ New area to discover!'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
