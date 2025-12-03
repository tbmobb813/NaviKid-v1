import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';

type PlanTripButtonProps = {
  isPlanning: boolean;
  onPress: () => void;
};

export const PlanTripButton: React.FC<PlanTripButtonProps> = ({ isPlanning, onPress }) => {
  return (
    <TouchableOpacity style={styles.planButton} onPress={onPress} disabled={isPlanning}>
      <MapPin size={20} color="#FFFFFF" />
      <Text style={styles.planButtonText}>
        {isPlanning ? 'Planning Your Trip...' : 'Plan My Trip!'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  planButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
