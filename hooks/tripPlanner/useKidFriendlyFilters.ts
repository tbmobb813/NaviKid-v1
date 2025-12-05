import { useState } from 'react';
import { GroupSize, AccessibilityNeeds } from './types';

type UseKidFriendlyFiltersReturn = {
  groupSize: GroupSize;
  accessibilityNeeds: AccessibilityNeeds;
  travelTime: 'now' | 'later';
  setTravelTime: (time: 'now' | 'later') => void;
  incrementAdults: () => void;
  decrementAdults: () => void;
  incrementChildren: () => void;
  decrementChildren: () => void;
  toggleWheelchair: () => void;
  toggleStroller: () => void;
  toggleElevatorOnly: () => void;
};

export const useKidFriendlyFilters = (): UseKidFriendlyFiltersReturn => {
  const [travelTime, setTravelTime] = useState<'now' | 'later'>('now');
  const [groupSize, setGroupSize] = useState<GroupSize>({
    adults: 1,
    children: 1,
  });
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<AccessibilityNeeds>({
    wheelchair: false,
    stroller: false,
    elevatorOnly: false,
  });

  const incrementAdults = (): void => {
    setGroupSize((prev) => ({ ...prev, adults: prev.adults + 1 }));
  };

  const decrementAdults = (): void => {
    setGroupSize((prev) => ({ ...prev, adults: Math.max(1, prev.adults - 1) }));
  };

  const incrementChildren = (): void => {
    setGroupSize((prev) => ({ ...prev, children: prev.children + 1 }));
  };

  const decrementChildren = (): void => {
    setGroupSize((prev) => ({ ...prev, children: Math.max(0, prev.children - 1) }));
  };

  const toggleWheelchair = (): void => {
    setAccessibilityNeeds((prev) => ({ ...prev, wheelchair: !prev.wheelchair }));
  };

  const toggleStroller = (): void => {
    setAccessibilityNeeds((prev) => ({ ...prev, stroller: !prev.stroller }));
  };

  const toggleElevatorOnly = (): void => {
    setAccessibilityNeeds((prev) => ({ ...prev, elevatorOnly: !prev.elevatorOnly }));
  };

  return {
    groupSize,
    accessibilityNeeds,
    travelTime,
    setTravelTime,
    incrementAdults,
    decrementAdults,
    incrementChildren,
    decrementChildren,
    toggleWheelchair,
    toggleStroller,
    toggleElevatorOnly,
  };
};
