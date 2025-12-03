import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

type SafetyNoteProps = {
  note: string;
};

export const SafetyNote: React.FC<SafetyNoteProps> = ({ note }) => {
  return (
    <View style={styles.safetyContainer}>
      <AlertTriangle size={14} color="#E65100" />
      <Text style={styles.safetyNote}>{note}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safetyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  safetyNote: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
});
