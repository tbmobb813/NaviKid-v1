import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';

type SafetyTipProps = {
  text: string;
};

export const SafetyTip: React.FC<SafetyTipProps> = ({ text }) => {
  return (
    <View style={styles.tipContainer}>
      <AlertTriangle size={16} color={Colors.warning} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
  },
});
