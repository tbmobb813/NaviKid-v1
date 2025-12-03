import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MapPin, Globe, Clock, Phone, Edit3, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RegionConfig } from '@/types/region';

type RegionCardProps = {
  region: RegionConfig;
  isCurrentRegion: boolean;
  onSelect: () => void;
  onUpdateTransit: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const RegionCard: React.FC<RegionCardProps> = ({
  region,
  isCurrentRegion,
  onSelect,
  onUpdateTransit,
  onEdit,
  onDelete,
}) => (
  <View style={[styles.regionCard, isCurrentRegion && styles.currentRegionCard]}>
    <Pressable style={styles.regionHeader} onPress={onSelect}>
      <View style={styles.regionInfo}>
        <View style={styles.regionTitleRow}>
          <MapPin size={20} color={Colors.primary} />
          <Text style={styles.regionName}>{region.name}</Text>
          {isCurrentRegion && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
        </View>
        <View style={styles.regionDetails}>
          <View style={styles.detailItem}>
            <Globe size={14} color={Colors.textLight} />
            <Text style={styles.detailText}>{region.country}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={14} color={Colors.textLight} />
            <Text style={styles.detailText}>{region.timezone}</Text>
          </View>
          <View style={styles.detailItem}>
            <Phone size={14} color={Colors.textLight} />
            <Text style={styles.detailText}>{region.emergencyNumber}</Text>
          </View>
        </View>
        <Text style={styles.transitCount}>
          {region.transitSystems.length} transit system
          {region.transitSystems.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>

    <View style={styles.regionActions}>
      <Pressable style={styles.actionButton} onPress={onUpdateTransit}>
        <Text style={styles.actionButtonText}>Update Transit</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={onEdit}>
        <Edit3 size={16} color={Colors.primary} />
      </Pressable>
      <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
        <Trash2 size={16} color="#FF4444" />
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  regionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  currentRegionCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  regionHeader: {
    padding: 16,
  },
  regionInfo: {
    gap: 8,
  },
  regionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  regionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  transitCount: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  regionActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F4FF',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FFF0F0',
  },
});
