import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import Colors from '@/constants/colors';
import {
  Compass,
  Camera,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  Sparkles,
  Users,
  Settings,
  ArrowRight,
  Map,
  Star,
} from 'lucide-react-native';
import { useParentalStore } from '@/stores/parentalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSafeZoneMonitor } from '@/hooks/useSafeZoneMonitor';
import PhotoCheckInButton from './PhotoCheckInButton';
import { SafeZoneIndicator } from './SafeZoneIndicator';

type AdventureHubProps = {
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

const AdventureHub: React.FC<AdventureHubProps> = ({
  currentLocation,
  currentPlace,
  onNavigateToSettings,
}) => {
  const { settings, checkInRequests, safeZones } = useParentalStore();
  const { photoCheckIns } = useNavigationStore();
  const { getCurrentSafeZoneStatus } = useSafeZoneMonitor();
  const currentZoneStatus = getCurrentSafeZoneStatus ? getCurrentSafeZoneStatus() : null;
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Calculate adventure stats
  const recentMemories = photoCheckIns.slice(0, 3);
  const discoveredZones = safeZones.filter((zone) => zone.isActive).length;
  const pendingUpdates = checkInRequests.filter((req) => req.status === 'pending').length;
  const adventureBuddies = settings.emergencyContacts.length;

  const handleGetHelp = () => {
    Alert.alert('Need Help?', 'Choose who to contact:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call 911', style: 'destructive', onPress: () => console.log('Emergency call') },
      { text: 'Call My Crew', onPress: () => console.log('Parent call') },
    ]);
  };

  const handleShareUpdate = () => {
    Alert.alert('Share Update', "Let your crew know you're having fun?", [
      { text: 'Not now', style: 'cancel' },
      { text: "I'm Having Fun!", onPress: () => console.log('Fun update sent') },
    ]);
  };

  const AdventureStatCard = ({
    icon,
    title,
    value,
    subtitle,
    color = Colors.primary,
    onPress,
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle: string;
    color?: string;
    onPress?: () => void;
  }) => (
    <Pressable style={[styles.statCard, onPress && styles.pressableCard]} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {React.cloneElement(
          icon as React.ReactElement,
          {
            size: 20,
            color,
          } as any,
        )}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
      {onPress && <ArrowRight size={16} color={Colors.textLight} />}
    </Pressable>
  );

  const QuickActionButton = ({
    icon,
    title,
    onPress,
    color = Colors.primary,
  }: {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    color?: string;
  }) => (
    <Pressable style={[styles.quickActionButton, { backgroundColor: color }]} onPress={onPress}>
      {React.cloneElement(
        icon as React.ReactElement,
        {
          size: 20,
          color: '#FFFFFF',
        } as any,
      )}
      <Text style={styles.quickActionText}>{title}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Compass size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Adventure Hub</Text>
        </View>
        {onNavigateToSettings && (
          <Pressable style={styles.settingsButton} onPress={onNavigateToSettings}>
            <Settings size={20} color={Colors.textLight} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where You Are</Text>
          <SafeZoneIndicator />

          {currentZoneStatus &&
            (() => {
              const isInZone = currentZoneStatus.inside && currentZoneStatus.inside.length > 0;
              const zoneName = isInZone ? currentZoneStatus.inside[0].name : undefined;
              return (
                <View
                  style={[styles.statusCard, { backgroundColor: isInZone ? '#E3F2FD' : '#F3E5F5' }]}
                >
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: isInZone ? '#2196F3' : '#9C27B0' },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {isInZone ? `🎯 You're exploring ${zoneName}!` : '🗺️ New area to discover!'}
                  </Text>
                </View>
              );
            })()}
        </View>

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
                icon={<Camera />}
                title="Capture Moment"
                onPress={() => console.log('Photo memory')}
                color="#4CAF50"
              />

              <QuickActionButton
                icon={<MessageCircle />}
                title="Share Update"
                onPress={handleShareUpdate}
                color="#2196F3"
              />

              <QuickActionButton
                icon={<MapPin />}
                title="Share Adventure"
                onPress={() => console.log('Share location')}
                color="#9C27B0"
              />

              <QuickActionButton
                icon={<Phone />}
                title="Need Help"
                onPress={handleGetHelp}
                color="#FF9800"
              />
            </View>
          </View>
        )}

        {/* Memory Capture */}
        {currentPlace && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capture This Adventure</Text>
            <PhotoCheckInButton placeName={currentPlace.name} placeId={currentPlace.id} />
          </View>
        )}

        {/* Adventure Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adventure Overview</Text>

          <View style={styles.statsGrid}>
            <AdventureStatCard
              icon={<Map />}
              title="Discovered"
              value={discoveredZones}
              subtitle="Zones explored"
              color="#2196F3"
              onPress={() => console.log('Navigate to exploration zones')}
            />

            <AdventureStatCard
              icon={<Camera />}
              title="Memories"
              value={recentMemories.length}
              subtitle="Recent"
              color="#4CAF50"
              onPress={() => console.log('Navigate to memory gallery')}
            />
          </View>

          <View style={styles.statsGrid}>
            <AdventureStatCard
              icon={<Star />}
              title="Updates"
              value={pendingUpdates}
              subtitle="New"
              color={pendingUpdates > 0 ? '#FF9800' : '#9E9E9E'}
            />

            <AdventureStatCard
              icon={<Users />}
              title="Crew"
              value={adventureBuddies}
              subtitle="Adventure buddies"
              color="#9C27B0"
              onPress={() => console.log('Navigate to adventure crew')}
            />
          </View>
        </View>

        {/* Recent Memories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Adventures</Text>

          {recentMemories.length > 0 ? (
            recentMemories.map((memory, index) => (
              <View key={index} style={styles.activityItem}>
                <CheckCircle size={16} color="#4CAF50" />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Visited {memory.placeName}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(memory.timestamp).toLocaleTimeString([], {
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
              <Text style={styles.emptyActivityText}>No adventure memories yet</Text>
              <Text style={styles.emptyActivitySubtext}>
                Capture photos when you discover new places to build your adventure gallery!
              </Text>
            </View>
          )}
        </View>

        {/* Adventure Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adventure Tip</Text>
          <View style={styles.tipCard}>
            <Sparkles size={20} color="#9C27B0" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Explore & Share!</Text>
              <Text style={styles.tipText}>
                Keep your adventure crew updated about where you&apos;re exploring. Share photos of
                cool discoveries!
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  hideButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressableCard: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: Colors.textLight,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 16,
  },
});

export default AdventureHub;
