import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Shield, Heart, AlertTriangle } from 'lucide-react-native';

type AccessibilityBadgesProps = {
  wheelchairAccessible?: boolean;
  strollerFriendly?: boolean;
  elevatorRequired?: boolean;
};

export const AccessibilityBadges: React.FC<AccessibilityBadgesProps> = ({
  wheelchairAccessible,
  strollerFriendly,
  elevatorRequired,
}) => {
  return (
    <View style={styles.accessibilityContainer}>
      {wheelchairAccessible && (
        <View style={styles.accessibilityItem}>
          <Shield size={12} color="#4CAF50" />
          <Text style={[styles.accessibilityText, { color: '#4CAF50' }]}>Wheelchair OK</Text>
        </View>
      )}
      {strollerFriendly && (
        <View style={styles.accessibilityItem}>
          <Heart size={12} color="#4CAF50" />
          <Text style={[styles.accessibilityText, { color: '#4CAF50' }]}>Stroller OK</Text>
        </View>
      )}
      {elevatorRequired && (
        <View style={styles.accessibilityItem}>
          <AlertTriangle size={12} color="#FF9800" />
          <Text style={[styles.accessibilityText, { color: '#FF9800' }]}>Elevator Needed</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  accessibilityContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  accessibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  accessibilityText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
});
