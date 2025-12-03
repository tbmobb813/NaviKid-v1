import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type KidTipBoxProps = {
  tip: string;
};

export const KidTipBox: React.FC<KidTipBoxProps> = ({ tip }) => {
  return (
    <View style={styles.kidTipContainer}>
      <Text style={styles.kidTip}>💡 Kid Tip: {tip}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  kidTipContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  kidTip: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
});
