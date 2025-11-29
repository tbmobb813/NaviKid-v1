import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { StationInfo, StationType, Coordinates } from '@/types/station';
import { generateMockStations } from '@/services/mockStationData';
import { StationCard } from './station-finder/StationCard';
import { StationFilters } from './station-finder/StationFilters';

type MTAStationFinderProps = {
  userLocation?: Coordinates;
  onStationSelect?: (station: StationInfo) => void;
};

const MTAStationFinder: React.FC<MTAStationFinderProps> = ({ userLocation, onStationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<StationInfo[]>([]);
  const [filteredStations, setFilteredStations] = useState<StationInfo[]>([]);
  const [selectedType, setSelectedType] = useState<StationType | 'all'>('all');
  const [showAccessibleOnly, setShowAccessibleOnly] = useState(false);
  const [favoriteStations, setFavoriteStations] = useState<string[]>([]);

  useEffect(() => {
    const mockStations = generateMockStations(userLocation);
    setStations(mockStations);
    filterStations(mockStations, searchQuery, selectedType, showAccessibleOnly);
  }, []);

  useEffect(() => {
    filterStations(stations, searchQuery, selectedType, showAccessibleOnly);
  }, [searchQuery, selectedType, showAccessibleOnly, stations]);

  const filterStations = (
    allStations: StationInfo[],
    query: string,
    type: StationType | 'all',
    accessibleOnly: boolean,
  ) => {
    let filtered = allStations;

    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(
        (station) =>
          station.name.toLowerCase().includes(query.toLowerCase()) ||
          station.borough.toLowerCase().includes(query.toLowerCase()) ||
          station.lines.some((line) => line.toLowerCase().includes(query.toLowerCase())) ||
          station.kidFriendlyInfo.nickname.toLowerCase().includes(query.toLowerCase()),
      );
    }

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter((station) => station.type === type);
    }

    // Filter by accessibility
    if (accessibleOnly) {
      filtered = filtered.filter((station) => station.accessibility.wheelchairAccessible);
    }

    // Sort by distance if location available
    if (userLocation) {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    setFilteredStations(filtered);
  };

  const toggleFavorite = (stationId: string) => {
    setFavoriteStations((prev) =>
      prev.includes(stationId) ? prev.filter((id) => id !== stationId) : [...prev, stationId],
    );
  };

  const handleStationPress = (station: StationInfo) => {
    if (onStationSelect) {
      onStationSelect(station);
    } else {
      Alert.alert(
        station.kidFriendlyInfo.nickname,
        `${station.kidFriendlyInfo.tip}\n\nFun fact: ${station.kidFriendlyInfo.funFact}`,
        [{ text: 'Cool!', style: 'default' }],
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Filters */}
        <StationFilters
          searchQuery={searchQuery}
          selectedType={selectedType}
          accessibilityOnly={showAccessibleOnly}
          onSearchChange={setSearchQuery}
          onTypeChange={setSelectedType}
          onAccessibilityToggle={() => setShowAccessibleOnly(!showAccessibleOnly)}
        />

        {/* Results Header */}
        <View style={styles.resultsHeaderContainer}>
          <Text style={styles.resultsHeader}>
            {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {/* Station List */}
        {filteredStations.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <MapPin size={48} color="#CCCCCC" />
            <Text style={styles.noResultsText}>No stations found matching your search</Text>
            <Text style={styles.noResultsSubtext}>
              Try searching for a different station name, line, or neighborhood
            </Text>
          </View>
        ) : (
          filteredStations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              isFavorite={favoriteStations.includes(station.id)}
              onPress={handleStationPress}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultsHeaderContainer: {
    marginBottom: 12,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default MTAStationFinder;
