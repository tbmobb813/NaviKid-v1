import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { voiceManager, KidFriendlyPhrases } from '../utils/voice';
import { log } from '../utils/logger';

export const useMapLocation = (
  enableVoiceGuidance: boolean,
  onLocationChange?: (location: Location.LocationObject) => void,
) => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    setupLocationTracking();
  }, []);

  const setupLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        log.warn('Location permission not granted');
        if (enableVoiceGuidance) {
          await voiceManager.speak(KidFriendlyPhrases.errors.locationError);
        }
        return;
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation(location);
      onLocationChange?.(location);

      // Watch location for updates
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setUserLocation(newLocation);
          onLocationChange?.(newLocation);
        },
      );
    } catch (error) {
      log.error('Failed to setup location tracking', error as Error);
    }
  };

  return { userLocation };
};
