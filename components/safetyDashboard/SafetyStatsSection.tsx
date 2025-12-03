import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Shield, Camera, Clock, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SafetyStatCard } from './SafetyStatCard';
import { logger } from '@/utils/logger';

type SafetyStatsSectionProps = {
  activeSafeZones: number;
  recentCheckInsCount: number;
  pendingRequests: number;
  emergencyContacts: number;
};

export const SafetyStatsSection: React.FC<SafetyStatsSectionProps> = ({
  activeSafeZones,
  recentCheckInsCount,
  pendingRequests,
  emergencyContacts,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Safety Overview</Text>

      <View style={styles.statsGrid}>
        <SafetyStatCard
          icon={<Shield />}
          title="Safe Zones"
          value={activeSafeZones}
          subtitle="Active zones"
          onPress={() =>
            logger.info('Navigate to safe zones requested', {
              activeZones: activeSafeZones,
            })
          }
        />

        <SafetyStatCard
          icon={<Camera />}
          title="Check-ins"
          value={recentCheckInsCount}
          subtitle="Recent"
          color={Colors.secondary}
          onPress={() =>
            logger.info('Navigate to check-in history requested', {
              recentCount: recentCheckInsCount,
            })
          }
        />
      </View>

      <View style={styles.statsGrid}>
        <SafetyStatCard
          icon={<Clock />}
          title="Requests"
          value={pendingRequests}
          subtitle="Pending"
          color={pendingRequests > 0 ? Colors.warning : Colors.success}
        />

        <SafetyStatCard
          icon={<Users />}
          title="Contacts"
          value={emergencyContacts}
          subtitle="Emergency"
          color="#9C27B0"
          onPress={() =>
            logger.info('Navigate to emergency contacts requested', {
              contactsCount: emergencyContacts,
            })
          }
        />
      </View>
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
});
