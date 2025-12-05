import { useState } from 'react';
import * as Location from 'expo-location';
import { RoutePoint } from '@/components/KidFriendlyMap';

export const useMapCamera = (mapRef: React.RefObject<any>, mapLibreModule: any) => {
  const [currentRegion, setCurrentRegion] = useState<any>(undefined);

  const centerOnUser = (userLocation: Location.LocationObject | null) => {
    if (!userLocation) return;

    const lngLat: [number, number] = [userLocation.coords.longitude, userLocation.coords.latitude];

    // If MapLibre Camera ref or API is available, call it
    try {
      if (mapRef.current && typeof mapRef.current.setCamera === 'function') {
        mapRef.current.setCamera({
          centerCoordinate: lngLat,
          zoomLevel: 15,
          animationDuration: 700,
        });
        return;
      }
      if (mapLibreModule && mapLibreModule.Camera && mapRef.current?.getMap) {
        const map = mapRef.current.getMap?.();
        map?.setCamera?.({ centerCoordinate: lngLat, zoomLevel: 15, animationDuration: 700 });
        return;
      }
    } catch (e) {
      // fallback to updating region state
    }

    setCurrentRegion({
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const fitToRoute = (route: RoutePoint[]) => {
    if (route.length === 0) return;

    // Build bounds from route coordinates
    const lats = route.map((r) => r.latitude).filter((n) => Number.isFinite(n));
    const lngs = route.map((r) => r.longitude).filter((n) => Number.isFinite(n));
    if (lats.length === 0 || lngs.length === 0) return;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    try {
      if (mapRef.current && typeof mapRef.current.fitBounds === 'function') {
        mapRef.current.fitBounds([minLng, minLat], [maxLng, maxLat], {
          padding: 50,
          animationDuration: 700,
        });
        return;
      }
      if (mapRef.current && typeof mapRef.current.setCamera === 'function') {
        mapRef.current.setCamera({
          centerCoordinate: [centerLng, centerLat],
          zoomLevel: 12,
          animationDuration: 700,
        });
        return;
      }
    } catch (e) {
      // fallback to region update
    }

    setCurrentRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(0.05, (maxLat - minLat) * 1.5),
      longitudeDelta: Math.max(0.05, (maxLng - minLng) * 1.5),
    });
  };

  return { currentRegion, setCurrentRegion, centerOnUser, fitToRoute };
};
