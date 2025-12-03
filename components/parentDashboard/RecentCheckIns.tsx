import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';

type CheckIn = {
  id: string;
  placeName: string;
  timestamp: number;
  photoUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
};

type RecentCheckInsProps = {
  checkIns: CheckIn[];
  formatTime: (timestamp: number) => string;
  formatDate: (timestamp: number) => string;
  limit?: number;
  showTitle?: boolean;
};

export const RecentCheckIns: React.FC<RecentCheckInsProps> = ({
  checkIns,
  formatTime,
  formatDate,
  limit,
  showTitle = true,
}) => {
  const displayedCheckIns = limit ? checkIns.slice(0, limit) : checkIns;

  return (
    <View style={styles.section}>
      {showTitle && <Text style={styles.sectionTitle}>Recent Check-ins</Text>}
      {displayedCheckIns.length === 0 ? (
        <Text style={styles.emptyText}>No recent check-ins</Text>
      ) : (
        displayedCheckIns.map((checkIn) => (
          <View key={checkIn.id} style={styles.checkInCard}>
            <Camera size={20} color={Colors.primary} />
            <View style={styles.checkInContent}>
              <Text style={styles.checkInTitle}>{checkIn.placeName}</Text>
              <Text style={styles.checkInTime}>
                {formatTime(checkIn.timestamp)} on {formatDate(checkIn.timestamp)}
              </Text>
              {checkIn.location && (
                <Text style={styles.checkInLocation}>
                  {checkIn.location.latitude.toFixed(4)}, {checkIn.location.longitude.toFixed(4)}
                </Text>
              )}
            </View>
            {checkIn.photoUrl && (
              <Image source={{ uri: checkIn.photoUrl }} style={styles.checkInPhoto} />
            )}
          </View>
        ))
      )}
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
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    padding: 16,
  },
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  checkInContent: {
    flex: 1,
  },
  checkInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  checkInTime: {
    fontSize: 14,
    color: Colors.textLight,
  },
  checkInLocation: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  checkInPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
});
