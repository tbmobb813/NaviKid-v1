import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';

export const SafetyTipSection: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Safety Reminder</Text>
      <View style={styles.tipCard}>
        <AlertTriangle size={20} color={Colors.warning} />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Stay Safe Out There!</Text>
          <Text style={styles.tipText}>
            Always let someone know where you're going and check in when you arrive safely.
          </Text>
        </View>
      </View>
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
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 16,
  },
});
