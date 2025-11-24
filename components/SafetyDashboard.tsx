import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import Colors from '@/constants/colors';
import { logger } from '@/utils/logger';
import {
  Shield,
  Camera,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Settings,
  ArrowRight,
} from 'lucide-react-native';
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
        onPress: () => logger.info('Emergency call initiated', { type: '911' })
      },
      {
        text: 'Call Parent',
        onPress: () => logger.info('Emergency call initiated', { type: 'parent' })
      },
    ]);
  };

  const handleQuickCheckIn = () => {
    Alert.alert('Quick Check-in', "Let your family know you're okay?", [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'I&apos;m OK!',
        onPress: () => logger.info('Quick check-in sent', { timestamp: Date.now() })
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

        {/* Quick Actions */}
        {showQuickActions && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <Pressable onPress={() => setShowQuickActions(false)}>
                <Text style={styles.hideButton}>Hide</Text>
              </Pressable>
            </View>

            <View style={styles.quickActionsGrid}>
              <QuickActionButton
                icon={<Phone />}
                title="Emergency"
                onPress={handleEmergencyCall}
                color="#FF3B30"
              />

              <QuickActionButton
                icon={<MessageCircle />}
                title="I'm OK!"
                onPress={handleQuickCheckIn}
                color={Colors.success}
              />

              <QuickActionButton
                icon={<MapPin />}
                title="Share Location"
                onPress={() => logger.info('Share location action triggered', {
                  location: currentLocation
                })}
                color={Colors.primary}
              />

              <QuickActionButton
                icon={<Camera />}
                title="Photo Check-in"
                onPress={() => logger.info('Photo check-in action triggered', {
                  place: currentPlace?.name
                })}
                color={Colors.secondary}
              />
            </View>
          </View>
        )}

        {/* Photo Check-in */}
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

          <View style={styles.statsGrid}>
            <SafetyStatCard
              icon={<Shield />}
              title="Safe Zones"
              value={activeSafeZones}
              subtitle="Active zones"
              onPress={() => logger.info('Navigate to safe zones requested', {
                activeZones: activeSafeZones
              })}
            />

            <SafetyStatCard
              icon={<Camera />}
              title="Check-ins"
              value={recentCheckIns.length}
              subtitle="Recent"
              color={Colors.secondary}
              onPress={() => logger.info('Navigate to check-in history requested', {
                recentCount: recentCheckIns.length
              })}
            />
          </View>

          <View style={styles.statsGrid}>
            <SafetyStatCard
              icon={<Clock />}
              title="Requests"
              value={pendingCheckInRequests}
              subtitle="Pending"
              color={pendingCheckInRequests > 0 ? Colors.warning : Colors.success}
            />

            <SafetyStatCard
              icon={<Users />}
              title="Contacts"
              value={emergencyContacts}
              subtitle="Emergency"
              color="#9C27B0"
              onPress={() => logger.info('Navigate to emergency contacts requested', {
                contactsCount: emergencyContacts
              })}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {recentCheckIns.length > 0 ? (
            recentCheckIns.map((checkIn, index) => (
              <View key={index} style={styles.activityItem}>
                <CheckCircle size={16} color={Colors.success} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Checked in at {checkIn.placeName}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(checkIn.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Camera size={32} color={Colors.textLight} />
              <Text style={styles.emptyActivityText}>No recent check-ins</Text>
              <Text style={styles.emptyActivitySubtext}>
                Take a photo when you arrive somewhere to let your family know you&apos;re safe
              </Text>
            </View>
          )}
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Reminder</Text>
          <View style={styles.tipCard}>
            <AlertTriangle size={20} color={Colors.warning} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Stay Safe Out There!</Text>
              <Text style={styles.tipText}>
                Always let someone know where you&apos;re going and check in when you arrive safely.
              </Text>
            </View>
          </View>
        </View>
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
