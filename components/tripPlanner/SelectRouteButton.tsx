import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Play } from 'lucide-react-native';
import Colors from '@/constants/colors';

type SelectRouteButtonProps = {
  onPress: () => void;
};

export const SelectRouteButton: React.FC<SelectRouteButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.selectTripButton} onPress={onPress}>
      <Play size={16} color="#FFFFFF" />
      <Text style={styles.selectTripText}>Select This Route</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  selectTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectTripText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
