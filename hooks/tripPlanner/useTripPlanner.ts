import { useState } from 'react';
import { Alert } from 'react-native';
import { TripPlan } from './types';
import { generateMockTripOptions } from '@/services/tripPlanningService';

type UseTripPlannerParams = {
  fromLocation: string;
  toLocation: string;
  onTripReady?: (trip: TripPlan) => void;
};

type UseTripPlannerReturn = {
  tripOptions: TripPlan[];
  selectedTrip: TripPlan | null;
  isPlanning: boolean;
  planTrip: () => Promise<void>;
  selectTrip: (trip: TripPlan) => void;
  clearTrips: () => void;
};

export const useTripPlanner = ({
  fromLocation,
  toLocation,
  onTripReady,
}: UseTripPlannerParams): UseTripPlannerReturn => {
  const [tripOptions, setTripOptions] = useState<TripPlan[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const planTrip = async (): Promise<void> => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      Alert.alert('Missing Information', 'Please enter both starting point and destination!');
      return;
    }

    setIsPlanning(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockTripOptions = generateMockTripOptions(fromLocation, toLocation);
      setTripOptions(mockTripOptions);
    } catch (error) {
      Alert.alert('Error', 'Failed to plan trip. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };

  const selectTrip = (trip: TripPlan): void => {
    setSelectedTrip(trip);
    if (onTripReady) {
      onTripReady(trip);
    }
  };

  const clearTrips = (): void => {
    setTripOptions([]);
    setSelectedTrip(null);
  };

  return {
    tripOptions,
    selectedTrip,
    isPlanning,
    planTrip,
    selectTrip,
    clearTrips,
  };
};
