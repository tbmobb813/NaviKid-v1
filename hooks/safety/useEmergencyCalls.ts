import { Alert, Linking } from 'react-native';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useParentalStore } from '@/stores/parentalStore';
import { withRetry, DEFAULT_RETRY_CONFIG } from '@/utils/errorHandling';
import { log } from '@/utils/logger';
import { useToast } from '@/hooks/useToast';

export const useEmergencyCalls = () => {
  const { safetyContacts } = useGamificationStore();
  const { settings } = useParentalStore();
  const { showToast } = useToast();

  const handleEmergencyCall = async () => {
    try {
      log.info('Emergency call initiated');

      Alert.alert('Emergency Call', 'Do you need to call for help?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: async () => {
            try {
              await withRetry(
                () => Linking.openURL('tel:911'),
                DEFAULT_RETRY_CONFIG.critical,
                'Emergency 911 call',
              );
              log.info('Emergency 911 call initiated successfully');
            } catch (error) {
              log.error('Failed to initiate 911 call', error as Error);
              showToast('Unable to make emergency call', 'error');
            }
          },
        },
        {
          text: 'Call Parent',
          onPress: async () => {
            try {
              const primaryContact =
                settings.emergencyContacts.find((c) => c.isPrimary) ||
                safetyContacts.find((c) => c.isPrimary);
              if (primaryContact) {
                await withRetry(
                  () => Linking.openURL(`tel:${primaryContact.phone}`),
                  DEFAULT_RETRY_CONFIG.critical,
                  'Parent emergency call',
                );
                log.info('Parent emergency call initiated successfully', {
                  contactId: primaryContact.id,
                });
              } else {
                showToast('No emergency contact available', 'warning');
                log.warn('No primary emergency contact found');
              }
            } catch (error) {
              log.error('Failed to initiate parent call', error as Error);
              showToast('Unable to call parent', 'error');
            }
          },
        },
      ]);
    } catch (error) {
      log.error('Emergency call handler failed', error as Error);
      showToast('Emergency feature temporarily unavailable', 'error');
    }
  };

  return { handleEmergencyCall };
};
