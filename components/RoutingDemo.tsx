/**
 * ORS and OTP2 Routing Demo Component
 * Demonstrates comprehensive routing capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { orsService } from '../utils/orsService';
import { otp2Service } from '../utils/otp2Service';
import { unifiedRoutingService, UnifiedRoute } from '../utils/unifiedRoutingService';
import { monitoring } from '../utils/monitoring';
import { logger } from '@/utils/logger';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

export default function RoutingDemo() {
  const [fromLocation, setFromLocation] = useState<Location>({
    lat: 40.7128,
    lng: -74.006,
    name: 'New York City Hall',
  });

  const [toLocation, setToLocation] = useState<Location>({
    lat: 40.7505,
    lng: -73.9934,
    name: 'Times Square',
  });

  const [childAge, setChildAge] = useState<string>('8');
  const [wheelchair, setWheelchair] = useState(false);
  const [prioritizeSafety, setPrioritizeSafety] = useState(true);

  const [routes, setRoutes] = useState<UnifiedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModes, setSelectedModes] = useState<string[]>(['WALK', 'TRANSIT']);

  useEffect(() => {
    monitoring.trackUserAction({
      action: 'screen_view',
      screen: 'routing_demo',
    });
  }, []);

  const handleSelectTestLocation = (from: Location, to: Location) => {
    setFromLocation(from);
    setToLocation(to);
  };

  const handleFindRoutes = async () => {
    if (!fromLocation.lat || !toLocation.lat) {
      Alert.alert('Error', 'Please enter valid locations');
      return;
    }

    setLoading(true);
    monitoring.trackUserAction({
      action: 'find_routes',
      screen: 'routing_demo',
      metadata: {
        modes: selectedModes,
        childAge: parseInt(childAge) || undefined,
        wheelchair,
        prioritizeSafety,
      },
    });

    try {
      const routeRequest = {
        from: fromLocation,
        to: toLocation,
        preferences: {
          modes: selectedModes as ('WALK' | 'BIKE' | 'TRANSIT' | 'CAR')[],
          childAge: parseInt(childAge) || undefined,
          wheelchair,
          prioritizeSafety,
          maxWalkDistance: 800,
          maxTransfers: 2,
        },
      };

      const foundRoutes = await unifiedRoutingService.getRoutes(routeRequest);
      setRoutes(foundRoutes);

      if (foundRoutes.length === 0) {
        Alert.alert('No Routes', 'No routes found for the selected criteria');
      }
    } catch (error) {
      logger.error('Route finding error', error as Error);
      Alert.alert('Error', 'Failed to find routes. Please try again.');

      monitoring.captureError({
        error: error as Error,
        context: 'Routing Demo - Find Routes',
        severity: 'medium',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestORS = async () => {
    setLoading(true);
    monitoring.trackUserAction({
      action: 'test_ors',
      screen: 'routing_demo',
    });

    try {
      const coordinates: [number, number][] = [
        [fromLocation.lng, fromLocation.lat],
        [toLocation.lng, toLocation.lat],
      ];

      if (parseInt(childAge) > 0) {
        const route = await orsService.getKidFriendlyRoute(coordinates, parseInt(childAge));
        Alert.alert(
          'ORS Kid-Friendly Route',
          `Found route: ${Math.round(route.routes[0].summary.duration / 60)} min, ${Math.round(
            route.routes[0].summary.distance,
          )} m`,
        );
      } else {
        const route = await orsService.getRoute({
          coordinates,
          profile: 'foot-walking',
          geometry: true,
          instructions: true,
        });
        Alert.alert(
          'ORS Walking Route',
          `Found route: ${Math.round(route.routes[0].summary.duration / 60)} min, ${Math.round(
            route.routes[0].summary.distance,
          )} m`,
        );
      }
    } catch (error) {
      logger.error('ORS test error', error as Error);
      Alert.alert('ORS Error', 'Failed to test ORS. Check configuration and API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestOTP2 = async () => {
    setLoading(true);
    monitoring.trackUserAction({
      action: 'test_otp2',
      screen: 'routing_demo',
    });

    try {
      const fromPlace = `${fromLocation.lat},${fromLocation.lng}`;
      const toPlace = `${toLocation.lat},${toLocation.lng}`;

      if (parseInt(childAge) > 0) {
        const plan = await otp2Service.getKidFriendlyTrip(fromPlace, toPlace, parseInt(childAge));
        if (plan.plan?.itineraries?.length > 0) {
          const itinerary = plan.plan.itineraries[0];
          Alert.alert(
            'OTP2 Kid-Friendly Transit',
            `Found route: ${Math.round(itinerary.duration / 60)} min, ${
              itinerary.transfers
            } transfers`,
          );
        } else {
          Alert.alert('OTP2', 'No transit routes found');
        }
      } else {
        const plan = await otp2Service.planTrip({
          fromPlace,
          toPlace,
          mode: 'TRANSIT,WALK',
        });
        if (plan.plan?.itineraries?.length > 0) {
          const itinerary = plan.plan.itineraries[0];
          Alert.alert(
            'OTP2 Transit Plan',
            `Found route: ${Math.round(itinerary.duration / 60)} min, ${
              itinerary.transfers
            } transfers`,
          );
        } else {
          Alert.alert('OTP2', 'No transit routes found');
        }
      }
    } catch (error) {
      logger.error('OTP2 test error', error as Error);
      Alert.alert('OTP2 Error', 'Failed to test OTP2. Check server configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🗺️ ORS + OTP2 Routing Demo</Text>

      <QuickTestLocations onSelectLocation={handleSelectTestLocation} />

      <LocationInputs
        title="From Location"
        location={fromLocation}
        onLocationChange={setFromLocation}
      />

      <LocationInputs title="To Location" location={toLocation} onLocationChange={setToLocation} />

      <TransportModeSelector selectedModes={selectedModes} onModesChange={setSelectedModes} />

      <RoutePreferences
        childAge={childAge}
        wheelchair={wheelchair}
        prioritizeSafety={prioritizeSafety}
        onChildAgeChange={setChildAge}
        onWheelchairChange={setWheelchair}
        onPrioritySafetyChange={setPrioritizeSafety}
      />

      {/* Action Buttons */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleFindRoutes}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.actionButtonText}>🔍 Find All Routes</Text>
          )}
        </TouchableOpacity>

        <View style={styles.testButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleTestORS}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Test ORS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleTestOTP2}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Test OTP2</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {routes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Found Routes ({routes.length})</Text>
          {routes.map((route, index) => (
            <RouteCard key={route.id} route={route} index={index} />
          ))}
        </View>
      )}

      <ConfigurationInfo />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
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
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#1976d2',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
