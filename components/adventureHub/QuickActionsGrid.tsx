import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera, MessageCircle, MapPin, Phone } from 'lucide-react-native';
import { QuickActionButton } from './QuickActionButton';

type QuickActionsGridProps = {
  onCaptureMemory: () => void;
  onShareUpdate: () => void;
  onShareAdventure: () => void;
  onGetHelp: () => void;
};

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onCaptureMemory,
  onShareUpdate,
  onShareAdventure,
  onGetHelp,
}) => (
  <View style={styles.quickActionsGrid}>
    <QuickActionButton
      icon={<Camera />}
      title="Capture Moment"
      onPress={onCaptureMemory}
      color="#4CAF50"
    />

    <QuickActionButton
      icon={<MessageCircle />}
      title="Share Update"
      onPress={onShareUpdate}
      color="#2196F3"
    />

    <QuickActionButton
      icon={<MapPin />}
      title="Share Adventure"
      onPress={onShareAdventure}
      color="#9C27B0"
    />

    <QuickActionButton icon={<Phone />} title="Need Help" onPress={onGetHelp} color="#FF9800" />
  </View>
);

const styles = StyleSheet.create({
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
