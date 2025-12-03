/**
 * Kid-friendly map using MapLibre (native)
 * Replaces previous react-native-maps usage. This component keeps location tracking,
 * safe-zone detection and basic route controls. Rendering of shapes/lines using
 * MapLibre should be implemented in a follow-up (ShapeSource/Layer or annotations).
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapLibreMap from './MapLibreMap';
import * as Location from 'expo-location';
import { useMapLocation } from '@/hooks/useMapLocation';
import { useSafeZoneDetection } from '@/hooks/useSafeZoneDetection';
import { useMapCamera } from '@/hooks/useMapCamera';
import { circleToPolygon } from '@/utils/map/mapGeometry';
import { ControlButtons, KidMapSafeZoneIndicator } from './kidFriendlyMap';

// Lazy require MapLibre native module for ShapeSource/Layer rendering
function getMapLibreModule() {
  try {
    const imported = require('@maplibre/maplibre-react-native');
    return imported?.default ?? imported;
  } catch {
    return null;
  }
}

export interface MapLocation {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

export interface SafeZone {
  id: string;
  center: MapLocation;
  radius: number; // in meters
  name: string;
  color?: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  instruction?: string;
}

interface KidFriendlyMapProps {
  initialLocation?: MapLocation;
  safeZones?: SafeZone[];
  route?: RoutePoint[];
  showUserLocation?: boolean;
  onLocationChange?: (location: Location.LocationObject) => void;
  onSafeZoneEnter?: (zone: SafeZone) => void;
  onSafeZoneExit?: (zone: SafeZone) => void;
  enableVoiceGuidance?: boolean;
  style?: any;
}

export default function KidFriendlyMap({
  initialLocation,
  safeZones = [],
  route = [],
  showUserLocation = true,
  onLocationChange,
  onSafeZoneEnter,
  onSafeZoneExit,
  enableVoiceGuidance = true,
  style,
}: KidFriendlyMapProps) {
  const mapRef = useRef<any>(null);
  const mapLibreModule = getMapLibreModule();

  // Use custom hooks for location, safe zones, and camera
  const { userLocation } = useMapLocation(enableVoiceGuidance, onLocationChange);
  const { insideSafeZones } = useSafeZoneDetection(
    userLocation,
    safeZones,
    enableVoiceGuidance,
    onSafeZoneEnter,
    onSafeZoneExit,
  );
  const { currentRegion, setCurrentRegion, centerOnUser, fitToRoute } = useMapCamera(
    mapRef,
    mapLibreModule,
  );

  useEffect(() => {
    // Set initial region if not set
    if (!currentRegion && initialLocation) {
      setCurrentRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [initialLocation]);

  useEffect(() => {
    // Center on user location when it first becomes available
    if (userLocation && !initialLocation && !currentRegion) {
      setCurrentRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation]);

  return (
    <View style={[styles.container, style]}>
      {/* Render MapLibreMap — children rendering for shapes/markers needs MapLibre implementations
          (ShapeSource / Layers / SymbolLayer or native annotations). For now we pass a centerCoordinate
          and zoomLevel derived from currentRegion or initialLocation. */}
      <MapLibreMap
        // @ts-ignore - MapLibreMap accepts centerCoordinate/zoomLevel but not typed as ref props
        ref={mapRef}
        testID="kidfriendly-map"
        centerCoordinate={
          currentRegion
            ? [currentRegion.longitude, currentRegion.latitude]
            : initialLocation
              ? [initialLocation.longitude, initialLocation.latitude]
              : undefined
        }
        zoomLevel={12}
      >
        {/* Render safe zones as GeoJSON circles (approximate) */}
        {mapLibreModule &&
          safeZones.length > 0 &&
          (() => {
            const features = safeZones.map((z) => ({
              ...circleToPolygon(z.center, z.radius, 64),
              id: z.id,
              properties: { id: z.id, name: z.name, color: z.color || '#00C800' },
            }));

            const geo = { type: 'FeatureCollection', features };

            return (
              <mapLibreModule.ShapeSource id="safezones" shape={geo}>
                <mapLibreModule.FillLayer
                  id="safezones-fill"
                  style={{ fillColor: ['get', 'color'], fillOpacity: 0.12 }}
                />
                <mapLibreModule.LineLayer
                  id="safezones-stroke"
                  style={{ lineColor: ['get', 'color'], lineWidth: 2, lineOpacity: 0.9 }}
                />
              </mapLibreModule.ShapeSource>
            );
          })()}

        {/* Render route as a LineLayer */}
        {mapLibreModule &&
          route.length > 1 &&
          (() => {
            const coords = route.map((p) => [p.longitude, p.latitude]);
            const geojson = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  id: 'route',
                  properties: {},
                  geometry: { type: 'LineString', coordinates: coords },
                },
              ],
            };
            return (
              <mapLibreModule.ShapeSource id="route" shape={geojson}>
                <mapLibreModule.LineLayer
                  id="route-line"
                  style={{ lineColor: '#2563EB', lineWidth: 4, lineOpacity: 0.95 }}
                />
              </mapLibreModule.ShapeSource>
            );
          })()}

        {/* Route markers */}
        {mapLibreModule &&
          route.length > 0 &&
          (() => {
            const features = route.map((p, i) => ({
              type: 'Feature',
              id: `route-${i}`,
              properties: { index: i },
              geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
            }));
            const geo = { type: 'FeatureCollection', features };
            return (
              <mapLibreModule.ShapeSource id="route-points" shape={geo}>
                <mapLibreModule.CircleLayer
                  id="route-points-layer"
                  style={{
                    circleRadius: 6,
                    circleColor: '#2563EB',
                    circleStrokeColor: '#fff',
                    circleStrokeWidth: 2,
                  }}
                />
              </mapLibreModule.ShapeSource>
            );
          })()}
      </MapLibreMap>

      {/* Control Buttons */}
      <ControlButtons
        onCenterUser={() => centerOnUser(userLocation)}
        onShowRoute={() => fitToRoute(route)}
        showRouteButton={route.length > 0}
      />

      {/* Safe Zone Indicator */}
      <KidMapSafeZoneIndicator isInsideSafeZone={insideSafeZones.size > 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
