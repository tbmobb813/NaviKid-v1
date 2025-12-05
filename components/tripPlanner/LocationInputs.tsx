import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import Colors from '@/constants/colors';

type LocationInputsProps = {
  fromLocation: string;
  toLocation: string;
  onFromLocationChange: (value: string) => void;
  onToLocationChange: (value: string) => void;
};

export const LocationInputs: React.FC<LocationInputsProps> = ({
  fromLocation,
  toLocation,
  onFromLocationChange,
  onToLocationChange,
}) => {
  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>From (Starting Point)</Text>
        <TextInput
          style={styles.input}
          value={fromLocation}
          onChangeText={onFromLocationChange}
          placeholder="Enter starting location..."
          placeholderTextColor={Colors.textLight}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>To (Destination)</Text>
        <TextInput
          style={styles.input}
          value={toLocation}
          onChangeText={onToLocationChange}
          placeholder="Enter destination..."
          placeholderTextColor={Colors.textLight}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: '#F8F9FA',
  },
});
