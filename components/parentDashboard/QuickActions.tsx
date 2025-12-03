import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { CheckCircle, MapPin, Phone, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

type QuickActionsProps = {
  onRequestCheckIn: () => void;
  onGetLocation: () => void;
  onRingDevice: () => void;
  onSendMessage: () => void;
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  onRequestCheckIn,
  onGetLocation,
  onRingDevice,
  onSendMessage,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <Pressable style={styles.quickActionButton} onPress={onRequestCheckIn}>
          <CheckCircle size={24} color="#FFFFFF" />
          <Text style={styles.quickActionText}>Request Check-in</Text>
        </Pressable>

        <Pressable style={styles.quickActionButton} onPress={onGetLocation}>
          <MapPin size={24} color="#FFFFFF" />
          <Text style={styles.quickActionText}>Get Location</Text>
        </Pressable>

        <Pressable style={styles.quickActionButton} onPress={onRingDevice}>
          <Phone size={24} color="#FFFFFF" />
          <Text style={styles.quickActionText}>Ring Device</Text>
        </Pressable>

        <Pressable style={styles.quickActionButton} onPress={onSendMessage}>
          <MessageCircle size={24} color="#FFFFFF" />
          <Text style={styles.quickActionText}>Send Message</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
