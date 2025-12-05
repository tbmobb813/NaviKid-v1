import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

type ControlButtonsProps = {
  onCenterUser: () => void;
  onShowRoute: () => void;
  showRouteButton: boolean;
};

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  onCenterUser,
  onShowRoute,
  showRouteButton,
}) => (
  <View style={styles.controls}>
    <Pressable onPress={onCenterUser} style={styles.controlButton}>
      <Text style={styles.buttonText}>📍 My Location</Text>
    </Pressable>

    {showRouteButton && (
      <Pressable onPress={onShowRoute} style={styles.controlButton}>
        <Text style={styles.buttonText}>🗺️ Show Route</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});
