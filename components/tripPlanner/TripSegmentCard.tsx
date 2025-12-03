import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { TripSegment } from '@/hooks/tripPlanner/types';
import { SegmentHeader } from './SegmentHeader';
import { KidTipBox } from './KidTipBox';
import { SafetyNote } from './SafetyNote';
import { FunThingsList } from './FunThingsList';
import { AccessibilityBadges } from './AccessibilityBadges';

type TripSegmentCardProps = {
  segment: TripSegment;
};

export const TripSegmentCard: React.FC<TripSegmentCardProps> = ({ segment }) => {
  return (
    <View style={styles.segmentCard}>
      <SegmentHeader
        type={segment.type}
        line={segment.line}
        from={segment.from}
        to={segment.to}
        duration={segment.duration}
      />

      <Text style={styles.segmentInstructions}>{segment.instructions}</Text>

      <KidTipBox tip={segment.kidFriendlyTip} />

      {segment.safetyNote && <SafetyNote note={segment.safetyNote} />}

      <FunThingsList things={segment.funThingsToSee || []} />

      <AccessibilityBadges
        wheelchairAccessible={segment.accessibility.wheelchairAccessible}
        strollerFriendly={segment.accessibility.strollerFriendly}
        elevatorRequired={segment.accessibility.elevatorRequired}
      />
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
  segmentInstructions: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
});
