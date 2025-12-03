import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import { Shield, Phone, MessageCircle, MapPin, Camera } from 'lucide-react-native';
import { validateLocation, logValidationResult } from '@/utils/validation';
import { log } from '@/utils/logger';
import ErrorBoundary from './ErrorBoundary';
import { useToast } from '@/hooks/useToast';
import { useEmergencyCalls } from '@/hooks/safety/useEmergencyCalls';
import { useLocationSharing } from '@/hooks/safety/useLocationSharing';
import { useSafeArrival } from '@/hooks/safety/useSafeArrival';
import { usePhotoCheckIn } from '@/hooks/safety/usePhotoCheckIn';
import { SafetyButton, SafetyTip } from '@/components/safetyPanel';

type SafetyPanelProps = {
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  currentPlace?: { id: string; name: string } | null;
};

const SafetyPanel: React.FC<SafetyPanelProps> = ({ currentLocation, currentPlace }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { showToast } = useToast();

  // Custom hooks for business logic
  const { handleEmergencyCall } = useEmergencyCalls();
  const { handleShareLocation } = useLocationSharing();
  const { handleSafeArrival } = useSafeArrival();
  const { isPhotoLoading, handlePhotoCheckIn } = usePhotoCheckIn();

  // Validate current location on component mount
  React.useEffect(() => {
    if (currentLocation) {
      const locationValidation = validateLocation(currentLocation);
      logValidationResult('SafetyPanel currentLocation', locationValidation);

      if (!locationValidation.isValid) {
        log.warn('SafetyPanel received invalid location', {
          location: currentLocation,
          errors: locationValidation.errors,
        } as any);
        showToast('Location data may be inaccurate', 'warning');
      }
    }
  }, [currentLocation, showToast]);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Pressable style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
          <Shield size={20} color={Colors.primary} />
          <Text style={styles.title}>Safety Tools</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
        </Pressable>

        {isExpanded && (
          <View style={styles.content}>
            <View style={styles.buttonRow}>
              <SafetyButton icon={Phone} text="Emergency" onPress={handleEmergencyCall} />
              <SafetyButton
                icon={MapPin}
                text="Share Location"
                onPress={() => handleShareLocation(currentLocation, currentPlace)}
              />
            </View>

            <View style={styles.buttonRow}>
              <SafetyButton
                icon={MessageCircle}
                text="I Made It!"
                onPress={() => handleSafeArrival(currentLocation, currentPlace)}
              />
              <SafetyButton
                icon={Camera}
                text={isPhotoLoading ? 'Taking Photo...' : 'Photo Check-in'}
                onPress={() => handlePhotoCheckIn(currentPlace, currentLocation)}
                isLoading={isPhotoLoading}
              />
            </View>

            <SafetyTip text="Always stay with a trusted adult when traveling" />
          </View>
        )}
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
});

export default SafetyPanel;
