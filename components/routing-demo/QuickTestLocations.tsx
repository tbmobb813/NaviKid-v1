import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface TestLocation {
  name: string;
  from: Location;
  to: Location;
}

interface QuickTestLocationsProps {
  onSelectLocation: (from: Location, to: Location) => void;
}

const testLocations: TestLocation[] = [
  {
    name: 'NYC: City Hall → Times Square',
    from: { lat: 40.7128, lng: -74.006, name: 'NYC City Hall' },
    to: { lat: 40.7505, lng: -73.9934, name: 'Times Square' },
  },
  {
    name: 'NYC: Central Park → Brooklyn Bridge',
    from: { lat: 40.7829, lng: -73.9654, name: 'Central Park' },
    to: { lat: 40.7061, lng: -73.9969, name: 'Brooklyn Bridge' },
  },
  {
    name: 'SF: Union Square → Golden Gate',
    from: { lat: 37.7879, lng: -122.4075, name: 'Union Square' },
    to: { lat: 37.8199, lng: -122.4783, name: 'Golden Gate Bridge' },
  },
];

export const QuickTestLocations: React.FC<QuickTestLocationsProps> = ({ onSelectLocation }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Test Locations</Text>
      {testLocations.map((location, index) => (
        <TouchableOpacity
          key={index}
          style={styles.testLocationButton}
          onPress={() => onSelectLocation(location.from, location.to)}
        >
          <Text style={styles.testLocationText}>{location.name}</Text>
        </TouchableOpacity>
      ))}
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
  testLocationButton: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testLocationText: {
    color: '#1976d2',
    fontWeight: '500',
  },
});
