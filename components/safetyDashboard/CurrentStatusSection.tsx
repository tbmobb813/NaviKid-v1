import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { SafeZoneIndicator } from '../SafeZoneIndicator';

type CurrentStatusSectionProps = {
  currentZoneStatus: any;
};

export const CurrentStatusSection: React.FC<CurrentStatusSectionProps> = ({
  currentZoneStatus,
}) => {
  const isInSafeZone =
    currentZoneStatus && currentZoneStatus.inside && currentZoneStatus.inside.length > 0;
  const zoneName = isInSafeZone ? currentZoneStatus.inside[0].name : undefined;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Current Status</Text>
      <SafeZoneIndicator />

      {currentZoneStatus && (
        <View
          style={[styles.statusCard, { backgroundColor: isInSafeZone ? '#E8F5E8' : '#FFF3E0' }]}
        >
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isInSafeZone ? Colors.success : Colors.warning },
            ]}
          />
          <Text style={styles.statusText}>
            {isInSafeZone
              ? `You're in the ${zoneName} safe zone`
              : 'Outside safe zones - stay alert!'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
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
