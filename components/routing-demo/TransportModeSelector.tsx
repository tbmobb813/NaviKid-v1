import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TransportMode {
  id: string;
  label: string;
  icon: string;
}

interface TransportModeSelectorProps {
  selectedModes: string[];
  onModesChange: (modes: string[]) => void;
}

const modes: TransportMode[] = [
  { id: 'WALK', label: 'Walking', icon: '🚶' },
  { id: 'BIKE', label: 'Cycling', icon: '🚴' },
  { id: 'TRANSIT', label: 'Transit', icon: '🚌' },
  { id: 'CAR', label: 'Driving', icon: '🚗' },
];

export const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
  selectedModes,
  onModesChange,
}) => {
  const toggleMode = (modeId: string) => {
    if (selectedModes.includes(modeId)) {
      onModesChange(selectedModes.filter((m) => m !== modeId));
    } else {
      onModesChange([...selectedModes, modeId]);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Transport Modes</Text>
      <View style={styles.modesContainer}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.modeButton,
              selectedModes.includes(mode.id) && styles.modeButtonSelected,
            ]}
            onPress={() => toggleMode(mode.id)}
          >
            <Text style={styles.modeIcon}>{mode.icon}</Text>
            <Text
              style={[
                styles.modeLabel,
                selectedModes.includes(mode.id) && styles.modeLabelSelected,
              ]}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    minWidth: 100,
  },
  modeButtonSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  modeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  modeLabel: {
    color: '#666',
  },
  modeLabelSelected: {
    color: '#1976d2',
    fontWeight: '500',
  },
});
