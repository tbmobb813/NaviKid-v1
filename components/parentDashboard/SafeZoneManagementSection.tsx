import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SafeZoneEmptyState } from './SafeZoneEmptyState';
import { SafeZoneList } from './SafeZoneList';

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

type SafeZoneManagementSectionProps = {
  safeZones: SafeZone[];
  onAddSafeZone: () => void;
};

export const SafeZoneManagementSection: React.FC<SafeZoneManagementSectionProps> = ({
  safeZones,
  onAddSafeZone,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Manage Safe Zones</Text>
        <Pressable style={styles.addButton} onPress={onAddSafeZone}>
          <Plus size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {safeZones.length === 0 ? (
        <SafeZoneEmptyState onCreateSafeZone={onAddSafeZone} />
      ) : (
        <SafeZoneList safeZones={safeZones} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  addButton: {
    padding: 8,
  },
});
