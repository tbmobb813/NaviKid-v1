import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, Star, Users } from 'lucide-react-native';
import { AdventureStatCard } from './AdventureStatCard';

type AdventureStatsSectionProps = {
  discoveredZones: number;
  memoriesCount: number;
  pendingUpdates: number;
  adventureBuddies: number;
  onNavigateToZones: () => void;
  onNavigateToMemories: () => void;
  onNavigateToCrew: () => void;
};

export const AdventureStatsSection: React.FC<AdventureStatsSectionProps> = ({
  discoveredZones,
  memoriesCount,
  pendingUpdates,
  adventureBuddies,
  onNavigateToZones,
  onNavigateToMemories,
  onNavigateToCrew,
}) => (
  <>
    <View style={styles.statsGrid}>
      <AdventureStatCard
        icon={<Map />}
        title="Discovered"
        value={discoveredZones}
        subtitle="Zones explored"
        color="#2196F3"
        onPress={onNavigateToZones}
      />

      <AdventureStatCard
        icon={<Camera />}
        title="Memories"
        value={memoriesCount}
        subtitle="Recent"
        color="#4CAF50"
        onPress={onNavigateToMemories}
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
        onPress={onNavigateToCrew}
      />
    </View>
  </>
);

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
});
