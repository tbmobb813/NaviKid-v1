import { Linking, Platform } from 'react-native';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useParentalStore } from '@/stores/parentalStore';
import { validateLocation } from '@/utils/validation';
import { withRetry, handleLocationError, DEFAULT_RETRY_CONFIG } from '@/utils/errorHandling';
import { log } from '@/utils/logger';
import { useToast } from '@/hooks/useToast';

type Location = {
  latitude: number;
  longitude: number;
};

type Place = {
  id: string;
  name: string;
};

export const useLocationSharing = () => {
  const { safetyContacts } = useGamificationStore();
  const { settings, updateLastKnownLocation } = useParentalStore();
  const { showToast } = useToast();

  const handleShareLocation = async (currentLocation: Location | undefined, currentPlace: Place | null | undefined) => {
    try {
      if (!currentLocation) {
        const locationError = handleLocationError({ code: 'POSITION_UNAVAILABLE' });
        showToast(locationError.userMessage, 'warning');
        log.warn('Share location attempted without current location');
        return;
      }

      // Validate location before sharing
      const locationValidation = validateLocation(currentLocation);
      if (!locationValidation.isValid) {
        log.error('Invalid location data for sharing', undefined, {
          location: currentLocation,
          errors: locationValidation.errors,
        } as any);
        showToast('Location data is invalid', 'error');
        return;
      }

      const message = `I'm at: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
      const primaryContact =
        settings.emergencyContacts.find((c) => c.isPrimary) ||
        safetyContacts.find((c) => c.isPrimary);

      if (primaryContact && Platform.OS !== 'web') {
        await withRetry(
          () => Linking.openURL(`sms:${primaryContact.phone}&body=${encodeURIComponent(message)}`),
          DEFAULT_RETRY_CONFIG.critical,
          'Share location SMS',
        );
        log.info('Location shared successfully', { contactId: primaryContact.id });
        showToast('Location shared with emergency contact', 'success');
      } else if (!primaryContact) {
        showToast('No emergency contact available', 'warning');
        log.warn('No primary contact for location sharing');
      } else {
        showToast('Location sharing not available on web', 'info');
      }

      // Update last known location in parent dashboard
      try {
        await withRetry(
          () =>
            Promise.resolve(
              updateLastKnownLocation({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                timestamp: Date.now(),
                placeName: currentPlace?.name,
              }),
            ),
          DEFAULT_RETRY_CONFIG.storage,
          'Update last known location',
        );
      } catch (error) {
        log.warn('Failed to update last known location', error as Error);
      }
    } catch (error) {
      log.error('Share location failed', error as Error);
      showToast('Unable to share location', 'error');
    }
  };

  return { handleShareLocation };
};
