import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

type ThingsToRememberProps = {
  reminders: string[];
};

export const ThingsToRemember: React.FC<ThingsToRememberProps> = ({ reminders }) => {
  if (!reminders || reminders.length === 0) {
    return null;
  }

  return (
    <View style={styles.remindersContainer}>
      <Text style={styles.remindersTitle}>📝 Things to Remember</Text>
      {reminders.map((reminder, index) => (
        <View key={index} style={styles.reminderItem}>
          <CheckCircle size={16} color="#4CAF50" />
          <Text style={styles.reminderText}>{reminder}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  remindersContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
