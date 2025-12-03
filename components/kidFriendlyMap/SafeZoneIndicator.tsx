import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SafeZoneIndicatorProps = {
  isInsideSafeZone: boolean;
};

export const SafeZoneIndicator: React.FC<SafeZoneIndicatorProps> = ({ isInsideSafeZone }) => {
  if (!isInsideSafeZone) return null;

  return (
    <View style={styles.safeZoneIndicator}>
      <Text style={styles.safeZoneText}>✅ You're in a safe zone!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeZoneIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  safeZoneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
