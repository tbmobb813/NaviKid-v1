import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GroupSize, AccessibilityNeeds } from '@/hooks/tripPlanner/types';
import { LocationInputs } from './LocationInputs';
import { GroupSizeControls } from './GroupSizeControls';
import { AccessibilityOptions } from './AccessibilityOptions';
import { PlanTripButton } from './PlanTripButton';

type TripPlannerFormProps = {
  fromLocation: string;
  toLocation: string;
  groupSize: GroupSize;
  accessibilityNeeds: AccessibilityNeeds;
  isPlanning: boolean;
  onFromLocationChange: (value: string) => void;
  onToLocationChange: (value: string) => void;
  onIncrementAdults: () => void;
  onDecrementAdults: () => void;
  onIncrementChildren: () => void;
  onDecrementChildren: () => void;
  onToggleWheelchair: () => void;
  onToggleStroller: () => void;
  onPlanTrip: () => void;
};

export const TripPlannerForm: React.FC<TripPlannerFormProps> = ({
  fromLocation,
  toLocation,
  groupSize,
  accessibilityNeeds,
  isPlanning,
  onFromLocationChange,
  onToLocationChange,
  onIncrementAdults,
  onDecrementAdults,
  onIncrementChildren,
  onDecrementChildren,
  onToggleWheelchair,
  onToggleStroller,
  onPlanTrip,
}) => {
  return (
    <View style={styles.planningForm}>
      <LocationInputs
        fromLocation={fromLocation}
        toLocation={toLocation}
        onFromLocationChange={onFromLocationChange}
        onToLocationChange={onToLocationChange}
      />

      <GroupSizeControls
        groupSize={groupSize}
        onIncrementAdults={onIncrementAdults}
        onDecrementAdults={onDecrementAdults}
        onIncrementChildren={onIncrementChildren}
        onDecrementChildren={onDecrementChildren}
      />

      <AccessibilityOptions
        accessibilityNeeds={accessibilityNeeds}
        onToggleWheelchair={onToggleWheelchair}
        onToggleStroller={onToggleStroller}
      />

      <PlanTripButton isPlanning={isPlanning} onPress={onPlanTrip} />
    </View>
  );
};

const styles = StyleSheet.create({
  planningForm: {
    padding: 20,
  },
});
