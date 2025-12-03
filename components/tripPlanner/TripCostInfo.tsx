import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type TripCostInfoProps = {
  adultCost: number;
  childCost: number;
};

export const TripCostInfo: React.FC<TripCostInfoProps> = ({ adultCost, childCost }) => {
  return (
    <View style={styles.costContainer}>
      <Text style={styles.costText}>
        💰 ${adultCost.toFixed(2)} per adult
        {childCost === 0 ? ' • Kids ride free!' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  costContainer: {
    marginBottom: 12,
  },
  costText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});
