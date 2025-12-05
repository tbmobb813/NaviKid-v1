import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
};

type EmergencyContactsListProps = {
  contacts: EmergencyContact[];
};

export const EmergencyContactsList: React.FC<EmergencyContactsListProps> = ({ contacts }) => {
  return (
    <View style={styles.settingCard}>
      <Text style={styles.settingTitle}>Emergency Contacts</Text>
      {contacts.map((contact) => (
        <Text key={contact.id} style={styles.settingSubtitle}>
          {contact.name} ({contact.relationship}) - {contact.phone}
          {contact.isPrimary && ' • Primary'}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  settingCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
});
