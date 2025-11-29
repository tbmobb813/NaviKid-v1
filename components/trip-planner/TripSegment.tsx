import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Navigation,
  Train,
  Bus,
  Clock,
  AlertTriangle,
  Shield,
  Heart,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { subwayLineColors } from '@/config/transit-data/mta-subway-lines';
import { TripSegment as TripSegmentType } from '@/types/trip';

type TripSegmentProps = {
  segment: TripSegmentType;
};

export const TripSegment: React.FC<TripSegmentProps> = ({ segment }) => {
  const getSegmentIcon = () => {
    switch (segment.type) {
      case 'walk':
        return <Navigation size={20} color={Colors.primary} />;
      case 'subway':
        return (
          <Train
            size={20}
            color={
              segment.line ? subwayLineColors[segment.line] || Colors.primary : Colors.primary
            }
          />
        );
      case 'bus':
        return <Bus size={20} color={Colors.primary} />;
      default:
        return <Navigation size={20} color={Colors.primary} />;
    }
  };

  const getSegmentTitle = () => {
    switch (segment.type) {
      case 'walk':
        return 'Walk';
      case 'subway':
        return `${segment.line} Train`;
      case 'bus':
        return `${segment.line} Bus`;
      default:
        return segment.type;
    }
  };

  return (
    <View style={styles.segmentCard}>
      <View style={styles.segmentHeader}>
        <View style={styles.segmentIcon}>{getSegmentIcon()}</View>
        <View style={styles.segmentDetails}>
          <Text style={styles.segmentTitle}>{getSegmentTitle()}</Text>
          <Text style={styles.segmentRoute}>
            {segment.from} → {segment.to}
          </Text>
          <Text style={styles.segmentDuration}>
            <Clock size={14} color={Colors.textLight} /> {segment.duration} minutes
          </Text>
        </View>
      </View>

      <Text style={styles.segmentInstructions}>{segment.instructions}</Text>

      <View style={styles.kidTipContainer}>
        <Text style={styles.kidTip}>👶 {segment.kidFriendlyTip}</Text>
      </View>

      {segment.safetyNote && (
        <View style={styles.safetyContainer}>
          <AlertTriangle size={14} color="#FF9800" />
          <Text style={styles.safetyNote}>{segment.safetyNote}</Text>
        </View>
      )}

      {segment.funThingsToSee && segment.funThingsToSee.length > 0 && (
        <View style={styles.funThingsContainer}>
          <Text style={styles.funThingsTitle}>👀 Look for:</Text>
          {segment.funThingsToSee.map((thing, idx) => (
            <Text key={idx} style={styles.funThing}>
              • {thing}
            </Text>
          ))}
        </View>
      )}

      {/* Accessibility Info */}
      <View style={styles.accessibilityContainer}>
        <View style={styles.accessibilityItem}>
          <Shield
            size={12}
            color={segment.accessibility.wheelchairAccessible ? '#4CAF50' : '#CCCCCC'}
          />
          <Text
            style={[
              styles.accessibilityText,
              { color: segment.accessibility.wheelchairAccessible ? '#4CAF50' : '#CCCCCC' },
            ]}
          >
            Wheelchair
          </Text>
        </View>
        <View style={styles.accessibilityItem}>
          <Heart size={12} color={segment.accessibility.strollerFriendly ? '#4CAF50' : '#CCCCCC'} />
          <Text
            style={[
              styles.accessibilityText,
              { color: segment.accessibility.strollerFriendly ? '#4CAF50' : '#CCCCCC' },
            ]}
          >
            Stroller
          </Text>
        </View>
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
    marginBottom: 12,
  },
  segmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
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
    marginBottom: 4,
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
    marginBottom: 12,
    lineHeight: 20,
  },
  kidTipContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  kidTip: {
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
  },
  safetyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  safetyNote: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },
  funThingsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  funThingsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 6,
  },
  funThing: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 8,
    lineHeight: 18,
  },
  accessibilityContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  accessibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessibilityText: {
    fontSize: 11,
  },
});
