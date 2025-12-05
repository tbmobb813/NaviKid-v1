import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle, Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';

type Memory = {
  placeName: string;
  timestamp: number;
};

type RecentMemoriesSectionProps = {
  memories: Memory[];
};

export const RecentMemoriesSection: React.FC<RecentMemoriesSectionProps> = ({ memories }) => (
  <>
    {memories.length > 0 ? (
      memories.map((memory, index) => (
        <View key={index} style={styles.activityItem}>
          <CheckCircle size={16} color="#4CAF50" />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Visited {memory.placeName}</Text>
            <Text style={styles.activityTime}>
              {new Date(memory.timestamp).toLocaleTimeString([], {
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
        <Text style={styles.emptyActivityText}>No adventure memories yet</Text>
        <Text style={styles.emptyActivitySubtext}>
          Capture photos when you discover new places to build your adventure gallery!
        </Text>
      </View>
    )}
  </>
);

const styles = StyleSheet.create({
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
