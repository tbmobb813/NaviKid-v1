// src/components/MapScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { authService } from '../services/auth';
import { locationService } from '../services/location';
import { mapService } from '../services/map';

// MapLibre needs to be initialized with API key (or empty string for local resources)
MapLibreGL.setAccessToken('');

const MapScreen = () => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [safeLocations, setSafeLocations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function setup() {
      try {
        // Get user profile
        const profile = await authService.getProfile();
        
        // Start tracking location
        await locationService.startTracking();
        
        // Get initial location
        const location = await locationService.getLatestLocation(profile.id);
        if (location) {
          setUserLocation([location.location.longitude, location.location.latitude]);
        }
        
        // Get safe locations as GeoJSON
        const safeLocationsGeoJSON = await mapService.getSafeLocationsGeoJSON(profile.id);
        setSafeLocations(safeLocationsGeoJSON);
        
        setLoading(false);
      } catch (error) {
        console.error('Error setting up map:', error);
        Alert.alert('Error', 'Failed to load map data.');
      }
    }
    
    setup();
    
    // Clean up on unmount
    return () => {
      locationService.stopTracking();
    };
  }, []);
  
  if (loading || !userLocation) {
    return (
      <View style={styles.center}>
        <Text>Loading map...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/style.json" // Replace with your style URL
      >
        {/* Camera position */}
        <MapLibreGL.Camera
          zoomLevel={15}
          centerCoordinate={userLocation}
          animationDuration={0}
        />
        
        {/* User location */}
        <MapLibreGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
        />
        
        {/* Safe locations */}
        {safeLocations && (
          <MapLibreGL.ShapeSource
            id="safeLocationsSource"
            shape={safeLocations}
          >
            <MapLibreGL.CircleLayer
              id="safeLocationCircles"
              style={{
                circleRadius: ['get', 'radius'],
                circleColor: '#4CAF50',
                circleOpacity: 0.2,
                circleStrokeWidth: 2,
                circleStrokeColor: '#4CAF50',
              }}
            />
            <MapLibreGL.SymbolLayer
              id="safeLocationLabels"
              style={{
                textField: ['get', 'name'],
                textSize: 12,
                textOffset: [0, 2],
                textColor: '#333',
                textHaloColor: '#fff',
                textHaloWidth: 1,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapScreen;