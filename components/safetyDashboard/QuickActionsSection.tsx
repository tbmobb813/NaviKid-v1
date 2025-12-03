import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Phone, MessageCircle, MapPin, Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { QuickActionButton } from './QuickActionButton';

type QuickActionsSectionProps = {
  visible: boolean;
  onHide: () => void;
  onEmergencyCall: () => void;
  onQuickCheckIn: () => void;
  onShareLocation: () => void;
  onPhotoCheckIn: () => void;
};

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  visible,
  onHide,
  onEmergencyCall,
  onQuickCheckIn,
  onShareLocation,
  onPhotoCheckIn,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Pressable onPress={onHide}>
          <Text style={styles.hideButton}>Hide</Text>
        </Pressable>
      </View>

      <View style={styles.quickActionsGrid}>
        <QuickActionButton
          icon={<Phone />}
          title="Emergency"
          onPress={onEmergencyCall}
          color="#FF3B30"
        />

        <QuickActionButton
          icon={<MessageCircle />}
          title="I'm OK!"
          onPress={onQuickCheckIn}
          color={Colors.success}
        />

        <QuickActionButton
          icon={<MapPin />}
          title="Share Location"
          onPress={onShareLocation}
          color={Colors.primary}
        />

        <QuickActionButton
          icon={<Camera />}
          title="Photo Check-in"
          onPress={onPhotoCheckIn}
          color={Colors.secondary}
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
  },
  hideButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
