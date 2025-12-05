import { Alert, Linking, Platform } from 'react-native';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useParentalStore } from '@/stores/parentalStore';

type Location = {
  latitude: number;
  longitude: number;
};

type Place = {
  id: string;
  name: string;
};

export const useSafeArrival = () => {
  const { safetyContacts } = useGamificationStore();
  const { settings, updateLastKnownLocation } = useParentalStore();

  const handleSafeArrival = (
    currentLocation: Location | undefined,
    currentPlace: Place | null | undefined,
  ) => {
    Alert.alert('I Made It!', 'Let your family know you arrived safely?', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Send message',
        onPress: () => {
          const primaryContact =
            settings.emergencyContacts.find((c) => c.isPrimary) ||
            safetyContacts.find((c) => c.isPrimary);
          if (primaryContact && Platform.OS !== 'web') {
            const placeName = currentPlace?.name || 'my destination';
            Linking.openURL(
              `sms:${primaryContact.phone}&body=I made it to ${placeName} safely! 😊`,
            );
          }

          // Update last known location in parent dashboard
          if (currentLocation && currentPlace) {
            updateLastKnownLocation({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              timestamp: Date.now(),
              placeName: currentPlace.name,
            });
          }
        },
      },
    ]);
  };

  return { handleSafeArrival };
};
