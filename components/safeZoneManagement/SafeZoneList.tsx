import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SafeZone } from '@/types/parental';
import { SafeZoneCard } from './SafeZoneCard';
import { SafeZoneEmptyState } from './SafeZoneEmptyState';

type SafeZoneListProps = {
  safeZones: SafeZone[];
  onBack: () => void;
  onAddNew: () => void;
  onEdit: (zone: SafeZone) => void;
  onDelete: (zone: SafeZone) => void;
  onToggleActive: (zone: SafeZone) => void;
};

export const SafeZoneList: React.FC<SafeZoneListProps> = ({
  safeZones,
  onBack,
  onAddNew,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack} testID="back-button">
          <ArrowLeft size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Safe Zones</Text>
        <Pressable style={styles.addButton} onPress={onAddNew} testID="add-safe-zone-button">
          <Plus size={24} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {safeZones.length === 0 ? (
          <SafeZoneEmptyState onAddFirst={onAddNew} />
        ) : (
          safeZones.map((zone) => (
            <SafeZoneCard
              key={zone.id}
              zone={zone}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
