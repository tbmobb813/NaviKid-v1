import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigationStore } from '@/stores/navigationStore';
import { useParentalStore } from '@/stores/parentalStore';
import { formatDistance, getLocationAccuracyDescription } from '@/utils/locationUtils';
import { validateLocation, validatePhotoCheckIn } from '@/utils/validation';
import {
  withRetry,
  handleCameraError,
  handleLocationError,
  DEFAULT_RETRY_CONFIG,
} from '@/utils/errorHandling';
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

export const usePhotoCheckIn = () => {
  const { addLocationVerifiedPhotoCheckIn } = useNavigationStore();
  const { addCheckInToDashboard, updateLastKnownLocation } = useParentalStore();
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const { showToast } = useToast();

  const handlePhotoCheckIn = async (
    currentPlace: Place | null | undefined,
    currentLocation: Location | undefined,
  ) => {
    try {
      if (!currentPlace) {
        showToast('Please select a destination first', 'warning');
        log.warn('Photo check-in attempted without current place');
        return;
      }

      if (!currentLocation) {
        const locationError = handleLocationError({ code: 'POSITION_UNAVAILABLE' });
        Alert.alert(
          'Location Required',
          locationError.userMessage + '\n\n' + (locationError.suggestedAction || ''),
        );
        log.warn('Photo check-in attempted without current location');
        return;
      }

      // Validate location before proceeding
      const locationValidation = validateLocation(currentLocation);
      if (!locationValidation.isValid) {
        log.error('Invalid location for photo check-in', undefined, {
          location: currentLocation,
          errors: locationValidation.errors,
        } as any);
        Alert.alert(
          'Location Error',
          'Your location data appears to be invalid. Please try again.',
        );
        return;
      }

      if (locationValidation.warnings && locationValidation.warnings.length > 0) {
        log.warn('Location warnings for photo check-in', { warnings: locationValidation.warnings });
      }

      if (Platform.OS === 'web') {
        await handleWebCheckIn(currentPlace, currentLocation);
        return;
      }

      setIsPhotoLoading(true);
      log.info('Starting photo check-in process', { placeId: currentPlace.id });

      const permissionGranted = await requestCameraPermission();
      if (!permissionGranted) return;

      await launchCameraAndCheckIn(currentPlace, currentLocation);
    } catch (error) {
      log.error('Photo check-in process failed', error as Error);
      showToast('Photo check-in failed. Please try again.', 'error');
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleWebCheckIn = async (currentPlace: Place, currentLocation: Location) => {
    const webCheckIn = {
      placeId: currentPlace.id,
      placeName: currentPlace.name,
      photoUrl: 'https://via.placeholder.com/300x200?text=Check-in+Photo',
      timestamp: Date.now(),
      notes: 'I made it here safely!',
      location: currentLocation,
    };

    const checkInValidation = validatePhotoCheckIn(webCheckIn);
    if (!checkInValidation.isValid) {
      log.error('Invalid web check-in data', undefined, {
        errors: checkInValidation.errors,
      } as any);
      showToast('Check-in data is invalid', 'error');
      return;
    }

    const placeCoordinates = { latitude: 40.7128, longitude: -74.006 };

    try {
      await withRetry(
        () =>
          Promise.resolve(
            addLocationVerifiedPhotoCheckIn(webCheckIn, currentLocation, placeCoordinates),
          ),
        DEFAULT_RETRY_CONFIG.storage,
        'Web photo check-in',
      );

      showToast('Check-in recorded successfully!', 'success');
      log.info('Web photo check-in completed', { placeId: currentPlace.id });
    } catch (error) {
      log.error('Web photo check-in failed', error as Error);
      showToast('Failed to record check-in', 'error');
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const permissionResult = await withRetry(
        () => ImagePicker.requestCameraPermissionsAsync(),
        { maxAttempts: 2, delayMs: 500 },
        'Camera permission request',
      );

      if (!permissionResult.granted) {
        const cameraError = handleCameraError({ message: 'Camera permission denied' });

        if (Platform.OS === 'android') {
          Alert.alert(
            'Camera Permission',
            cameraError.userMessage + '\n\nPlease enable camera access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Settings',
                onPress: () => {
                  Alert.alert(
                    'Enable Camera',
                    'Go to Settings > Apps > KidMap > Permissions > Camera',
                  );
                },
              },
            ],
          );
        } else {
          Alert.alert('Permission needed', cameraError.userMessage);
        }

        log.warn('Camera permission denied for photo check-in');
        return false;
      }

      return true;
    } catch (error) {
      const cameraError = handleCameraError(error);
      log.error('Camera permission request failed', error as Error);
      showToast(cameraError.userMessage, 'error');
      return false;
    }
  };

  const launchCameraAndCheckIn = async (currentPlace: Place, currentLocation: Location) => {
    const cameraOptions =
      Platform.OS === 'android'
        ? {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3] as [number, number],
            quality: 0.6,
            exif: false,
          }
        : {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3] as [number, number],
            quality: 0.7,
          };

    try {
      const result = await withRetry(
        () => ImagePicker.launchCameraAsync(cameraOptions),
        { maxAttempts: 2, delayMs: 1000 },
        'Camera launch',
      );

      if (!result.canceled && result.assets[0]) {
        await processCheckIn(result.assets[0].uri, currentPlace, currentLocation);
      } else {
        log.info('Photo check-in cancelled by user');
      }
    } catch (cameraError) {
      const errorInfo = handleCameraError(cameraError);
      log.error('Camera operation failed', cameraError as Error);
      showToast(errorInfo.userMessage, 'error');
    }
  };

  const processCheckIn = async (
    photoUri: string,
    currentPlace: Place,
    currentLocation: Location,
  ) => {
    const checkInData = {
      placeId: currentPlace.id,
      placeName: currentPlace.name,
      photoUrl: photoUri,
      timestamp: Date.now(),
      notes: 'I made it here safely!',
      location: currentLocation,
    };

    const checkInValidation = validatePhotoCheckIn(checkInData);
    if (!checkInValidation.isValid) {
      log.error('Invalid photo check-in data', undefined, {
        errors: checkInValidation.errors,
      } as any);
      showToast('Check-in data is invalid', 'error');
      return;
    }

    const placeCoordinates = { latitude: 40.7128, longitude: -74.006 };

    let verification;
    try {
      verification = await withRetry(
        () =>
          Promise.resolve(
            addLocationVerifiedPhotoCheckIn(checkInData, currentLocation, placeCoordinates),
          ),
        DEFAULT_RETRY_CONFIG.storage,
        'Photo check-in verification',
      );
    } catch (error) {
      log.error('Photo check-in verification failed', error as Error);
      showToast('Failed to verify check-in location', 'error');
      return;
    }

    await saveCheckInToDashboard(photoUri, currentPlace, currentLocation);
    showVerificationResult(verification, currentPlace.name);
  };

  const saveCheckInToDashboard = async (
    photoUri: string,
    currentPlace: Place,
    currentLocation: Location,
  ) => {
    try {
      await withRetry(
        () =>
          Promise.resolve(
            addCheckInToDashboard({
              id: `checkin_${Date.now()}`,
              timestamp: Date.now(),
              placeName: currentPlace.name,
              photoUrl: photoUri,
              location: currentLocation,
            }),
          ),
        DEFAULT_RETRY_CONFIG.storage,
        'Add check-in to dashboard',
      );
    } catch (error) {
      log.warn('Failed to add check-in to parent dashboard', error as Error);
    }

    try {
      await withRetry(
        () =>
          Promise.resolve(
            updateLastKnownLocation({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              timestamp: Date.now(),
              placeName: currentPlace.name,
            }),
          ),
        DEFAULT_RETRY_CONFIG.storage,
        'Update last known location',
      );
    } catch (error) {
      log.warn('Failed to update last known location', error as Error);
    }
  };

  const showVerificationResult = (verification: any, placeName: string) => {
    const accuracyDescription = getLocationAccuracyDescription(verification.distance);
    const distanceText = formatDistance(verification.distance);

    if (verification.isWithinRadius) {
      Alert.alert(
        '✅ Check-in Verified!',
        `Great job! You're ${accuracyDescription} (${distanceText}) from ${placeName}. Your location has been verified! 📸`,
        [{ text: 'Awesome!', style: 'default' }],
      );
    } else {
      Alert.alert(
        '⚠️ Location Check',
        `Photo taken! However, you appear to be ${distanceText} from ${placeName}. Make sure you're at the right location for accurate check-ins.`,
        [{ text: 'Got it', style: 'default' }],
      );
    }

    log.info('Photo check-in completed successfully', {
      placeId: verification.placeId,
      distance: verification.distance,
      isVerified: verification.isWithinRadius,
    });
  };

  return {
    isPhotoLoading,
    handlePhotoCheckIn,
  };
};
