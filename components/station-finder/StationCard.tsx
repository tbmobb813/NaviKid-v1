import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Train, Bus, Star, Accessibility, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { subwayLineColors } from '@/config/transit-data/mta-subway-lines';
import { StationInfo } from '@/types/station';

type StationCardProps = {
  station: StationInfo;
  isFavorite: boolean;
  onPress: (station: StationInfo) => void;
  onToggleFavorite: (stationId: string) => void;
};

export const StationCard: React.FC<StationCardProps> = ({
  station,
  isFavorite,
  onPress,
  onToggleFavorite,
}) => {
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    }
    return `${(distance / 1000).toFixed(1)}km away`;
  };

  return (
    <TouchableOpacity style={styles.stationCard} onPress={() => onPress(station)}>
      <View style={styles.stationHeader}>
        <View style={styles.stationInfo}>
          <View style={styles.stationIconContainer}>
            {station.type === 'subway' ? (
              <Train size={20} color={Colors.primary} />
            ) : (
              <Bus size={20} color={Colors.primary} />
            )}
          </View>

          <View style={styles.stationDetails}>
            <Text style={styles.stationName}>{station.name}</Text>
            <Text style={styles.stationNickname}>{station.kidFriendlyInfo.nickname}</Text>
            <Text style={styles.stationBorough}>{station.borough}</Text>
            {station.distance && (
              <Text style={styles.stationDistance}>{formatDistance(station.distance)}</Text>
            )}
          </View>
        </View>

        <View style={styles.stationActions}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(station.id)}
          >
            <Star
              size={16}
              color={isFavorite ? '#FFD700' : '#CCCCCC'}
              fill={isFavorite ? '#FFD700' : 'none'}
            />
          </TouchableOpacity>

          {station.accessibility.wheelchairAccessible && (
            <View style={styles.accessibilityBadge}>
              <Accessibility size={16} color="#4CAF50" />
            </View>
          )}
        </View>
      </View>

      {/* Transit Lines */}
      <View style={styles.linesContainer}>
        <Text style={styles.linesLabel}>Lines: </Text>
        <View style={styles.linesList}>
          {station.lines.map((line) => (
            <View
              key={line}
              style={[
                styles.lineIndicator,
                {
                  backgroundColor:
                    station.type === 'subway'
                      ? subwayLineColors[line] || Colors.primary
                      : Colors.primary,
                },
              ]}
            >
              <Text style={styles.lineText}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Kid-Friendly Info */}
      <View style={styles.kidInfoSection}>
        <Text style={styles.tipText}>💡 {station.kidFriendlyInfo.tip}</Text>
        <Text style={styles.funFactText}>🎉 {station.kidFriendlyInfo.funFact}</Text>
      </View>

      {/* What to See */}
      <View style={styles.attractionsSection}>
        <Text style={styles.attractionsTitle}>What to see nearby:</Text>
        <View style={styles.attractionsList}>
          {station.kidFriendlyInfo.whatToSee.slice(0, 3).map((attraction, index) => (
            <Text key={index} style={styles.attractionItem}>
              • {attraction}
            </Text>
          ))}
          {station.kidFriendlyInfo.whatToSee.length > 3 && (
            <Text style={styles.moreAttractions}>
              and {station.kidFriendlyInfo.whatToSee.length - 3} more...
            </Text>
          )}
        </View>
      </View>

      {/* Safety Note */}
      {station.kidFriendlyInfo.safetyNote && (
        <View style={styles.safetyNote}>
          <Info size={14} color="#FF9800" />
          <Text style={styles.safetyText}>{station.kidFriendlyInfo.safetyNote}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  stationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  stationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stationDetails: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  stationNickname: {
    fontSize: 13,
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  stationBorough: {
    fontSize: 12,
    color: Colors.textLight,
  },
  stationDistance: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  stationActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  accessibilityBadge: {
    padding: 4,
  },
  linesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  linesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  linesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  lineIndicator: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  kidInfoSection: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#F57C00',
    marginBottom: 6,
    lineHeight: 18,
  },
  funFactText: {
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
  },
  attractionsSection: {
    marginBottom: 12,
  },
  attractionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  attractionsList: {
    paddingLeft: 8,
  },
  attractionItem: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 3,
  },
  moreAttractions: {
    fontSize: 11,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16,
  },
});
