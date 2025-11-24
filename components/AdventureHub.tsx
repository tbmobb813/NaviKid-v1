import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import { logger } from '@/utils/logger';
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
import { useAdventureStats } from '@/hooks/useAdventureStats';
import { useAdventureActions } from '@/hooks/useAdventureActions';
import PhotoCheckInButton from './PhotoCheckInButton';
import { SafeZoneIndicator } from './SafeZoneIndicator';
import {
  StatusCard,
  QuickActionsGrid,
  AdventureStatsSection,
  RecentMemoriesSection,
  AdventureTipCard,
} from './adventureHub';

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
  const { getCurrentSafeZoneStatus } = useSafeZoneMonitor();
  const currentZoneStatus = getCurrentSafeZoneStatus ? getCurrentSafeZoneStatus() : null;
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Get adventure stats
  const { recentMemories, discoveredZones, pendingUpdates, adventureBuddies } = useAdventureStats();

  const handleGetHelp = () => {
    Alert.alert('Need Help?', 'Choose who to contact:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call 911',
        style: 'destructive',
        onPress: () => logger.info('Emergency call initiated', { type: '911', context: 'AdventureHub' })
      },
      {
        text: 'Call My Crew',
        onPress: () => logger.info('Emergency call initiated', { type: 'crew', context: 'AdventureHub' })
      },
    ]);
  };

  const handleShareUpdate = () => {
    Alert.alert('Share Update', "Let your crew know you're having fun?", [
      { text: 'Not now', style: 'cancel' },
      {
        text: "I'm Having Fun!",
        onPress: () => logger.info('Fun update sent to crew', { timestamp: Date.now() })
      },
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
              return <StatusCard isInZone={isInZone} zoneName={zoneName} />;
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
                onPress={() => logger.info('Photo memory capture triggered', {
                  place: currentPlace?.name
                })}
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
                onPress={() => logger.info('Share adventure location triggered', {
                  location: currentLocation
                })}
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
              onPress={() => logger.info('Navigate to exploration zones requested', {
                zonesCount: discoveredZones
              })}
            />

            <AdventureStatCard
              icon={<Camera />}
              title="Memories"
              value={recentMemories.length}
              subtitle="Recent"
              color="#4CAF50"
              onPress={() => logger.info('Navigate to memory gallery requested', {
                memoriesCount: recentMemories.length
              })}
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
              onPress={() => logger.info('Navigate to adventure crew requested', {
                crewCount: adventureBuddies
              })}
            />
          </View>
        </View>

        {/* Recent Memories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Adventures</Text>
          <RecentMemoriesSection memories={recentMemories} />
        </View>

        {/* Adventure Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adventure Tip</Text>
          <AdventureTipCard />
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
});

export default AdventureHub;
