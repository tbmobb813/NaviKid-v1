import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle, Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';

type CheckIn = {
  placeName: string;
  timestamp: number;
};

type RecentActivitySectionProps = {
  recentCheckIns: CheckIn[];
};

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ recentCheckIns }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      {recentCheckIns.length > 0 ? (
        recentCheckIns.map((checkIn, index) => (
          <View key={index} style={styles.activityItem}>
            <CheckCircle size={16} color={Colors.success} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Checked in at {checkIn.placeName}</Text>
              <Text style={styles.activityTime}>
                {new Date(checkIn.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyActivity}>
          <Camera size={32} color={Colors.textLight} />
          <Text style={styles.emptyActivityText}>No recent check-ins</Text>
          <Text style={styles.emptyActivitySubtext}>
            Take a photo when you arrive somewhere to let your family know you're safe
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
