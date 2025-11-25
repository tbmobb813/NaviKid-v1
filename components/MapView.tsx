import React from 'react';
import { View } from 'react-native';
import MapViewWrapper from '@/components/MapViewWrapper';
import { useRouteORS } from '@/hooks/useRouteORS';
import Config from '@/utils/config';

type LatLngContainer = { coordinates: { longitude: number; latitude: number } };

type UnifiedRoute = { id?: string | number; geometry?: any };

type MapViewProps = {
  origin?: LatLngContainer | null;
  destination?: LatLngContainer | null;
  selectedUnifiedRoute?: UnifiedRoute | null;
  onStationPress?: (id: string) => void;
  mapLibreCameraRef?: React.RefObject<any>;
};

export default function MapView({
  origin,
  destination,
  selectedUnifiedRoute,
  onStationPress,
  mapLibreCameraRef,
}: MapViewProps) {
  const originCoord = origin
    ? ([origin.coordinates.longitude, origin.coordinates.latitude] as [number, number])
    : undefined;

  const destinationCoord = destination
    ? ([destination.coordinates.longitude, destination.coordinates.latitude] as [number, number])
    : undefined;

  const { geojson: orsRouteGeoJSON } = useRouteORS(originCoord, destinationCoord, {
    enabled: Boolean(originCoord && destinationCoord && Config.ROUTING.ORS_API_KEY),
  });

  const routeToPass =
    orsRouteGeoJSON ??
    (selectedUnifiedRoute && selectedUnifiedRoute.geometry
      ? {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: selectedUnifiedRoute.id,
              properties: {},
              geometry: selectedUnifiedRoute.geometry,
            },
          ],
        }
      : null);

  return (
    <View style={{ flex: 1 }}>
      <MapViewWrapper
        origin={origin ?? undefined}
        destination={destination ?? undefined}
        route={routeToPass}
        onStationPress={onStationPress}
        showTransitStations={true}
        cameraRef={mapLibreCameraRef}
        testId="maplibre-route-view"
      />
    </View>
  );
}
