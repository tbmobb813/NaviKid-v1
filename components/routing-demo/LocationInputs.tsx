import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface LocationInputsProps {
  title: string;
  location: Location;
  onLocationChange: (location: Location) => void;
}

export const LocationInputs: React.FC<LocationInputsProps> = ({
  title,
  location,
  onLocationChange,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.locationInputs}>
        <TextInput
          style={styles.input}
          placeholder="Latitude"
          value={location.lat.toString()}
          onChangeText={(text) => onLocationChange({ ...location, lat: parseFloat(text) || 0 })}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Longitude"
          value={location.lng.toString()}
          onChangeText={(text) => onLocationChange({ ...location, lng: parseFloat(text) || 0 })}
          keyboardType="numeric"
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Location Name"
        value={location.name}
        onChangeText={(text) => onLocationChange({ ...location, name: text })}
      />
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
  locationInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
});
