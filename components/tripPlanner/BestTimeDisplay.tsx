import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Colors from '@/constants/colors';

type BestTimeDisplayProps = {
  bestTime: string;
};

export const BestTimeDisplay: React.FC<BestTimeDisplayProps> = ({ bestTime }) => {
  return <Text style={styles.bestTime}>⏰ {bestTime}</Text>;
};

const styles = StyleSheet.create({
  bestTime: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 18,
  },
});
