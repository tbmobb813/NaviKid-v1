import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Shield, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';

type SafeZoneEmptyStateProps = {
  onAddFirst: () => void;
};

export const SafeZoneEmptyState: React.FC<SafeZoneEmptyStateProps> = ({ onAddFirst }) => {
  return (
    <View style={styles.emptyState}>
      <Shield size={48} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>No Safe Zones</Text>
      <Text style={styles.emptySubtitle}>
        Create safe zones to get notified when your child enters or leaves specific areas
      </Text>
      <Pressable style={styles.emptyButton} onPress={onAddFirst}>
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Add First Safe Zone</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
