import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';

type SafeZone = {
  id: string;
  name: string;
  radius: number;
  isActive: boolean;
  notifications: {
    onEntry: boolean;
    onExit: boolean;
  };
};

type SafeZoneListProps = {
  safeZones: SafeZone[];
};

export const SafeZoneList: React.FC<SafeZoneListProps> = ({ safeZones }) => {
  return (
    <>
      {safeZones.map((zone) => (
        <View key={zone.id} style={styles.safeZoneCard}>
          <Shield size={20} color={zone.isActive ? Colors.success : Colors.textLight} />
          <View style={styles.safeZoneContent}>
            <Text style={styles.safeZoneTitle}>{zone.name}</Text>
            <Text style={styles.safeZoneSubtitle}>
              Radius: {zone.radius}m • {zone.isActive ? 'Active' : 'Inactive'}
            </Text>
            <Text style={styles.safeZoneNotifications}>
              Alerts: {zone.notifications.onEntry ? 'Entry' : ''}
              {zone.notifications.onEntry && zone.notifications.onExit ? ' & ' : ''}
              {zone.notifications.onExit ? 'Exit' : ''}
              {!zone.notifications.onEntry && !zone.notifications.onExit ? 'None' : ''}
            </Text>
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  safeZoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  safeZoneContent: {
    flex: 1,
  },
  safeZoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  safeZoneSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  safeZoneNotifications: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
});
