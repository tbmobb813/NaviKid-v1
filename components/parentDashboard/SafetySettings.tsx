import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

type SafetySettingsProps = {
  safeZoneAlerts: boolean;
  checkInReminders: boolean;
};

export const SafetySettings: React.FC<SafetySettingsProps> = ({
  safeZoneAlerts,
  checkInReminders,
}) => {
  return (
    <View style={styles.settingCard}>
      <Text style={styles.settingTitle}>Safety Settings</Text>
      <Text style={styles.settingSubtitle}>
        Safe zone alerts: {safeZoneAlerts ? 'Enabled' : 'Disabled'}
      </Text>
      <Text style={styles.settingSubtitle}>
        Check-in reminders: {checkInReminders ? 'Enabled' : 'Disabled'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  settingCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
});
