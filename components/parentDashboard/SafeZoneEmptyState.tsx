import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Shield, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';

type SafeZoneEmptyStateProps = {
  onCreateSafeZone: () => void;
};

export const SafeZoneEmptyState: React.FC<SafeZoneEmptyStateProps> = ({ onCreateSafeZone }) => {
  return (
    <View style={styles.emptyStateCard}>
      <Shield size={48} color={Colors.textLight} />
      <Text style={styles.emptyStateTitle}>No Safe Zones</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create safe zones to monitor when your child enters or leaves specific areas
      </Text>
      <Pressable style={styles.createButton} onPress={onCreateSafeZone}>
        <Plus size={16} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Safe Zone</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyStateCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
