import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import { Compass, Settings } from 'lucide-react-native';
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

  // Get adventure actions
  const {
    handleGetHelp,
    handleShareUpdate,
    handleCaptureMemory,
    handleShareAdventure,
    handleNavigateToZones,
    handleNavigateToMemories,
    handleNavigateToCrew,
  } = useAdventureActions();

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

            <QuickActionsGrid
              onCaptureMemory={() => handleCaptureMemory(currentPlace?.name)}
              onShareUpdate={handleShareUpdate}
              onShareAdventure={() => handleShareAdventure(currentLocation)}
              onGetHelp={handleGetHelp}
            />
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

          <AdventureStatsSection
            discoveredZones={discoveredZones}
            memoriesCount={recentMemories.length}
            pendingUpdates={pendingUpdates}
            adventureBuddies={adventureBuddies}
            onNavigateToZones={() => handleNavigateToZones(discoveredZones)}
            onNavigateToMemories={() => handleNavigateToMemories(recentMemories.length)}
            onNavigateToCrew={() => handleNavigateToCrew(adventureBuddies)}
          />
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
