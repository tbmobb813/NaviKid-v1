import { MapLocation } from '@/components/KidFriendlyMap';

/**
 * Calculate distance between two locations using Haversine formula
 * @param loc1 First location
 * @param loc2 Second location
 * @returns Distance in meters
 */
export const calculateDistance = (loc1: MapLocation, loc2: MapLocation): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Generate a polygon approximating a circle (GeoJSON Polygon) around a center point
 * @param center Center location
 * @param radiusMeters Radius in meters
 * @param points Number of points to approximate circle (default 64)
 * @returns GeoJSON Feature
 */
export const circleToPolygon = (center: MapLocation, radiusMeters: number, points = 64) => {
  const coords: [number, number][] = [];
  const { latitude: lat, longitude: lng } = center;
  const R = 6371e3; // meters

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * 2 * Math.PI;
    // destination point given distance and bearing
    const δ = radiusMeters / R; // angular distance in radians
    const bearing = theta; // radians

    const φ1 = (lat * Math.PI) / 180;
    const λ1 = (lng * Math.PI) / 180;

    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearing),
    );
    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
      );

    const lat2 = (φ2 * 180) / Math.PI;
    const lng2 = (λ2 * 180) / Math.PI;
    coords.push([lng2, lat2]);
  }

  // close polygon by repeating first coordinate
  if (coords.length > 0) coords.push(coords[0]);

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
};
