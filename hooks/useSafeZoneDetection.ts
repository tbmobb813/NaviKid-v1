import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { voiceManager, KidFriendlyPhrases } from '../utils/voice';
import { calculateDistance } from '../utils/map/mapGeometry';
import { SafeZone, MapLocation } from '@/components/KidFriendlyMap';

export const useSafeZoneDetection = (
  userLocation: Location.LocationObject | null,
  safeZones: SafeZone[],
  enableVoiceGuidance: boolean,
  onSafeZoneEnter?: (zone: SafeZone) => void,
  onSafeZoneExit?: (zone: SafeZone) => void,
) => {
  const [insideSafeZones, setInsideSafeZones] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userLocation && safeZones.length > 0) {
      checkSafeZones();
    }
  }, [userLocation, safeZones]);

  const checkSafeZones = () => {
    if (!userLocation || safeZones.length === 0) return;

    const newSet = new Set(insideSafeZones);

    safeZones.forEach((zone) => {
      const userLoc: MapLocation = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };

      const distance = calculateDistance(userLoc, zone.center);
      const isInside = distance <= zone.radius;

      if (isInside && !newSet.has(zone.id)) {
        newSet.add(zone.id);
        onSafeZoneEnter?.(zone);
        if (enableVoiceGuidance) {
          void voiceManager.speak(KidFriendlyPhrases.safety.safeZone).catch(() => {});
        }
      } else if (!isInside && newSet.has(zone.id)) {
        newSet.delete(zone.id);
        onSafeZoneExit?.(zone);
      }
    });

    setInsideSafeZones(newSet);
  };

  return { insideSafeZones };
};
