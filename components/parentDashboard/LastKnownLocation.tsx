import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';

type LastKnownLocationProps = {
  placeName?: string;
  timestamp: number;
  formatTime: (timestamp: number) => string;
  formatDate: (timestamp: number) => string;
};

export const LastKnownLocation: React.FC<LastKnownLocationProps> = ({
  placeName,
  timestamp,
  formatTime,
  formatDate,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Last Known Location</Text>
      <View style={styles.locationCard}>
        <MapPin size={20} color={Colors.primary} />
        <View style={styles.locationContent}>
          <Text style={styles.locationTitle}>{placeName || 'Unknown Location'}</Text>
          <Text style={styles.locationSubtitle}>
            {formatTime(timestamp)} on {formatDate(timestamp)}
          </Text>
        </View>
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
