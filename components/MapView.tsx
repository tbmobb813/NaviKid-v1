import React from 'react';
import { View } from 'react-native';
import MapViewWrapper from '@/components/MapViewWrapper';
import { useRouteORS } from '@/hooks/useRouteORS';
import { Geometry } from 'geojson';
import Config from '@/utils/config';
import { Place } from '@/types/navigation';
import { UnifiedRoute } from '@/utils/unifiedRoutingService';

interface MapViewProps {
  origin: Place | null;
  destination: Place | null;
  selectedUnifiedRoute: UnifiedRoute | null;
  onStationPress: (stationId: string) => void;
  mapLibreCameraRef: React.RefObject<any>;
}

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
