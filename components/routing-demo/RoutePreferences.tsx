import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface RoutePreferencesProps {
  childAge: string;
  wheelchair: boolean;
  prioritizeSafety: boolean;
  onChildAgeChange: (age: string) => void;
  onWheelchairChange: (value: boolean) => void;
  onPrioritySafetyChange: (value: boolean) => void;
}

export const RoutePreferences: React.FC<RoutePreferencesProps> = ({
  childAge,
  wheelchair,
  prioritizeSafety,
  onChildAgeChange,
  onWheelchairChange,
  onPrioritySafetyChange,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.preferenceRow}>
        <Text style={styles.preferenceLabel}>Child Age (0 for adult)</Text>
        <TextInput
          style={styles.ageInput}
          value={childAge}
          onChangeText={onChildAgeChange}
          keyboardType="numeric"
          placeholder="8"
        />
      </View>

      <TouchableOpacity style={styles.checkboxRow} onPress={() => onWheelchairChange(!wheelchair)}>
        <View style={[styles.checkbox, wheelchair && styles.checkboxChecked]}>
          {wheelchair && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Wheelchair Accessible</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onPrioritySafetyChange(!prioritizeSafety)}
      >
        <View style={[styles.checkbox, prioritizeSafety && styles.checkboxChecked]}>
          {prioritizeSafety && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Prioritize Safety</Text>
      </TouchableOpacity>
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
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  preferenceLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  ageInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
});
