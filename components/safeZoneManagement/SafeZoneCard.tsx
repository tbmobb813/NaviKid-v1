import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SafeZone } from '@/types/parental';

type SafeZoneCardProps = {
  zone: SafeZone;
  onEdit: (zone: SafeZone) => void;
  onDelete: (zone: SafeZone) => void;
  onToggleActive: (zone: SafeZone) => void;
};

export const SafeZoneCard: React.FC<SafeZoneCardProps> = ({
  zone,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  return (
    <View style={styles.zoneCard}>
      <View style={styles.zoneHeader}>
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneName}>{zone.name}</Text>
          <Text style={styles.zoneDetails}>
            {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)} • {zone.radius}m radius
          </Text>
          <Text style={styles.zoneNotifications}>
            Notifications: {zone.notifications.onEntry ? 'Entry' : ''}
            {zone.notifications.onEntry && zone.notifications.onExit ? ' & ' : ''}
            {zone.notifications.onExit ? 'Exit' : ''}
          </Text>
        </View>

        <Pressable style={styles.toggleButton} onPress={() => onToggleActive(zone)}>
          {zone.isActive ? (
            <ToggleRight size={32} color={Colors.success} />
          ) : (
            <ToggleLeft size={32} color={Colors.textLight} />
          )}
        </Pressable>
      </View>

      <View style={styles.zoneActions}>
        <Pressable style={styles.actionButton} onPress={() => onEdit(zone)}>
          <Edit size={16} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(zone)}
        >
          <Trash2 size={16} color={Colors.error} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  zoneCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  zoneDetails: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  zoneNotifications: {
    fontSize: 12,
    color: Colors.textLight,
  },
  toggleButton: {
    padding: 4,
  },
  zoneActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButtonText: {
    color: Colors.error,
  },
});
