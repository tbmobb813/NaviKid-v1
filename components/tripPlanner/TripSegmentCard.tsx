import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, Train, Bus, Navigation, AlertTriangle, Shield, Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TripSegment } from '@/hooks/tripPlanner/types';

type TripSegmentCardProps = {
  segment: TripSegment;
};

export const TripSegmentCard: React.FC<TripSegmentCardProps> = ({ segment }) => {
  const getSegmentIcon = () => {
    switch (segment.type) {
      case 'walk':
        return <MapPin size={20} color={Colors.primary} />;
      case 'subway':
        return <Train size={20} color={Colors.primary} />;
      case 'bus':
        return <Bus size={20} color={Colors.primary} />;
      case 'transfer':
        return <Navigation size={20} color={Colors.primary} />;
      default:
        return <MapPin size={20} color={Colors.primary} />;
    }
  };

  const getSegmentTypeLabel = () => {
    switch (segment.type) {
      case 'walk':
        return '🚶 Walk';
      case 'subway':
        return '🚇 Subway';
      case 'bus':
        return '🚌 Bus';
      case 'transfer':
        return '🔄 Transfer';
      default:
        return segment.type;
    }
  };

  return (
    <View style={styles.segmentCard}>
      <View style={styles.segmentHeader}>
        <View style={styles.segmentIcon}>{getSegmentIcon()}</View>
        <View style={styles.segmentDetails}>
          <Text style={styles.segmentTitle}>
            {getSegmentTypeLabel()}
            {segment.line ? ` - ${segment.line} Train` : ''}
          </Text>
          <Text style={styles.segmentRoute}>
            {segment.from} → {segment.to}
          </Text>
          <Text style={styles.segmentDuration}>⏱️ {segment.duration} minutes</Text>
        </View>
      </View>

      <Text style={styles.segmentInstructions}>{segment.instructions}</Text>

      <View style={styles.kidTipContainer}>
        <Text style={styles.kidTip}>💡 Kid Tip: {segment.kidFriendlyTip}</Text>
      </View>

      {segment.safetyNote && (
        <View style={styles.safetyContainer}>
          <AlertTriangle size={14} color="#E65100" />
          <Text style={styles.safetyNote}>{segment.safetyNote}</Text>
        </View>
      )}

      {segment.funThingsToSee && segment.funThingsToSee.length > 0 && (
        <View style={styles.funThingsContainer}>
          <Text style={styles.funThingsTitle}>👀 Look for:</Text>
          {segment.funThingsToSee.map((thing, index) => (
            <Text key={index} style={styles.funThing}>
              • {thing}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.accessibilityContainer}>
        {segment.accessibility.wheelchairAccessible && (
          <View style={styles.accessibilityItem}>
            <Shield size={12} color="#4CAF50" />
            <Text style={[styles.accessibilityText, { color: '#4CAF50' }]}>Wheelchair OK</Text>
          </View>
        )}
        {segment.accessibility.strollerFriendly && (
          <View style={styles.accessibilityItem}>
            <Heart size={12} color="#4CAF50" />
            <Text style={[styles.accessibilityText, { color: '#4CAF50' }]}>Stroller OK</Text>
          </View>
        )}
        {segment.accessibility.elevatorRequired && (
          <View style={styles.accessibilityItem}>
            <AlertTriangle size={12} color="#FF9800" />
            <Text style={[styles.accessibilityText, { color: '#FF9800' }]}>Elevator Needed</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  segmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  segmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  segmentDetails: {
    flex: 1,
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  segmentRoute: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  segmentDuration: {
    fontSize: 12,
    color: Colors.textLight,
  },
  segmentInstructions: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  kidTipContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  kidTip: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  safetyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  safetyNote: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  funThingsContainer: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  funThingsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B1FA2',
    marginBottom: 6,
  },
  funThing: {
    fontSize: 12,
    color: '#7B1FA2',
    lineHeight: 16,
  },
  accessibilityContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  accessibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  accessibilityText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
});
