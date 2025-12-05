import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import Colors from '@/constants/colors';
import { logger } from '@/utils/logger';
import { Shield, Settings } from 'lucide-react-native';
import { useParentalStore } from '@/stores/parentalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSafeZoneMonitor } from '@/hooks/useSafeZoneMonitor';
import PhotoCheckInButton from './PhotoCheckInButton';
import {
  CurrentStatusSection,
  QuickActionsSection,
  SafetyStatsSection,
  RecentActivitySection,
  SafetyTipSection,
} from '@/components/safetyDashboard';

type SafetyDashboardProps = {
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  currentPlace?: {
    id: string;
    name: string;
  };
  onNavigateToSettings?: () => void;
};

const SafetyDashboard: React.FC<SafetyDashboardProps> = ({
  currentLocation,
  currentPlace,
  onNavigateToSettings,
}) => {
  const { settings, checkInRequests, safeZones } = useParentalStore();
  const { photoCheckIns } = useNavigationStore();
  const { getCurrentSafeZoneStatus } = useSafeZoneMonitor();
  const currentZoneStatus = getCurrentSafeZoneStatus ? getCurrentSafeZoneStatus() : null;
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Calculate safety stats
  const recentCheckIns = photoCheckIns.slice(0, 3);
  const activeSafeZones = safeZones.filter((zone) => zone.isActive).length;
  const pendingCheckInRequests = checkInRequests.filter((req) => req.status === 'pending').length;
  const emergencyContacts = settings.emergencyContacts.length;

  const handleEmergencyCall = () => {
    Alert.alert('Emergency Help', "Choose how you'd like to get help:", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call 911',
        style: 'destructive',
        onPress: () => logger.info('Emergency call initiated', { type: '911' }),
      },
      {
        text: 'Call Parent',
        onPress: () => logger.info('Emergency call initiated', { type: 'parent' }),
      },
    ]);
  };

  const handleQuickCheckIn = () => {
    Alert.alert('Quick Check-in', "Let your family know you're okay?", [
      { text: 'Not now', style: 'cancel' },
      {
        text: "I'm OK!",
        onPress: () => logger.info('Quick check-in sent', { timestamp: Date.now() }),
      },
    ]);
  };

  const handleShareLocation = () => {
    logger.info('Share location action triggered', {
      location: currentLocation,
    });
  };

  const handlePhotoCheckInAction = () => {
    logger.info('Photo check-in action triggered', {
      place: currentPlace?.name,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Shield size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Safety Dashboard</Text>
        </View>
        {onNavigateToSettings && (
          <Pressable style={styles.settingsButton} onPress={onNavigateToSettings}>
            <Settings size={20} color={Colors.textLight} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <CurrentStatusSection currentZoneStatus={currentZoneStatus} />

        <QuickActionsSection
          visible={showQuickActions}
          onHide={() => setShowQuickActions(false)}
          onEmergencyCall={handleEmergencyCall}
          onQuickCheckIn={handleQuickCheckIn}
          onShareLocation={handleShareLocation}
          onPhotoCheckIn={handlePhotoCheckInAction}
        />

        {currentPlace && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check-in at Current Location</Text>
            <PhotoCheckInButton placeName={currentPlace.name} placeId={currentPlace.id} />
          </View>
        )}

        <SafetyStatsSection
          activeSafeZones={activeSafeZones}
          recentCheckInsCount={recentCheckIns.length}
          pendingRequests={pendingCheckInRequests}
          emergencyContacts={emergencyContacts}
        />

        <RecentActivitySection recentCheckIns={recentCheckIns} />

        <SafetyTipSection />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
});

export default SafetyDashboard;
