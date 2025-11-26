import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { TripPlan } from '@/hooks/tripPlanner/types';
import { useTripPlanner } from '@/hooks/tripPlanner/useTripPlanner';
import { useKidFriendlyFilters } from '@/hooks/tripPlanner/useKidFriendlyFilters';
import {
  TripPlannerHeader,
  TripPlannerForm,
  TripPlannerRouteList,
  TripPlannerRouteDetails,
} from '@/components/tripPlanner';

type KidTripPlannerProps = {
  onTripReady?: (trip: TripPlan) => void;
  userLocation?: { lat: number; lng: number; name?: string };
};

const KidTripPlanner: React.FC<KidTripPlannerProps> = ({ onTripReady, userLocation }) => {
  const [fromLocation, setFromLocation] = useState(userLocation?.name || '');
  const [toLocation, setToLocation] = useState('');

  const { tripOptions, selectedTrip, isPlanning, planTrip, selectTrip } = useTripPlanner({
    fromLocation,
    toLocation,
    onTripReady,
  });

  // Mock trip planning function with comprehensive kid-friendly routes
  const planTrip = async () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      Alert.alert('Missing Information', 'Please enter both starting point and destination!');
      return;
    }

    setIsPlanning(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockTripOptions: TripPlan[] = [
      {
        id: 'option-1',
        from: fromLocation,
        to: toLocation,
        totalDuration: 35,
        totalWalkingTime: 12,
        difficulty: 'Easy',
        kidFriendlyRating: 5,
        bestTimeToGo: 'Weekday mornings (9-11 AM) or early afternoons (1-3 PM) are less crowded',
        segments: [
          {
            id: 'walk-1',
            type: 'walk',
            from: fromLocation,
            to: 'Times Sq-42nd St Station',
            duration: 5,
            instructions: 'Walk 3 blocks north to Times Square station',
            kidFriendlyTip: "Look for the big red stairs and bright lights - that's your landmark!",
            safetyNote: 'Hold hands tight - Times Square is very busy with lots of people',
            funThingsToSee: [
              'Street performers',
              'Costume characters',
              'Giant billboards',
              'Police horses',
            ],
            accessibility: {
              wheelchairAccessible: true,
              strollerFriendly: true,
              elevatorRequired: false,
            },
          },
          {
            id: 'subway-1',
            type: 'subway',
            line: '1',
            from: 'Times Sq-42nd St',
            to: '59th St-Columbus Circle',
            duration: 8,
            instructions: 'Take the 1 train uptown (northbound) for 3 stops',
            kidFriendlyTip:
              'The 1 train is red on the map - count the stops on your fingers: 50th, then 59th!',
            safetyNote: 'Stand clear of closing doors and hold the pole or sit down',
            funThingsToSee: [
              'Underground musicians',
              'Colorful tile work',
              'People from all over the world',
            ],
            accessibility: {
              wheelchairAccessible: true,
              strollerFriendly: true,
              elevatorRequired: true,
            },
          },
          {
            id: 'walk-2',
            type: 'walk',
            from: '59th St-Columbus Circle Station',
            to: toLocation,
            duration: 7,
            instructions: 'Exit at Central Park South and walk 2 blocks to destination',
            kidFriendlyTip:
              "You'll see Central Park right outside the station - perfect for a quick playground stop!",
            funThingsToSee: [
              'Central Park entrance',
              'Horse carriages',
              'Street vendors',
              'Columbus statue',
            ],
            accessibility: {
              wheelchairAccessible: true,
              strollerFriendly: true,
              elevatorRequired: false,
            },
          },
        ],
        thingsToRemember: [
          'Bring MetroCard or tap your phone/card',
          'Keep your group together at all times',
          'Emergency button is on every subway car',
          "Ask MTA staff if you need help - they're there to help!",
          'Have a backup plan if trains are delayed',
        ],
        emergencyInfo: {
          nearestHospital: 'Mount Sinai West (59th St & 10th Ave)',
          transitPolice: 'Call 911 or find any MTA employee',
          helpfulStaff: ['Station booth clerks', 'Transit police', 'Train conductors'],
        },
        funAlongTheWay: [
          'Count the number of different languages you hear',
          'Look for subway art and murals',
          'Spot different types of dogs in Central Park',
          'Find the Columbus statue at Columbus Circle',
        ],
        estimatedCost: {
          adult: 2.9,
          child: 0, // Children under 44 inches ride free
        },
      },
      {
        id: 'option-2',
        from: fromLocation,
        to: toLocation,
        totalDuration: 42,
        totalWalkingTime: 15,
        difficulty: 'Medium',
        kidFriendlyRating: 4,
        bestTimeToGo: "Afternoons (2-4 PM) when it's less crowded but still daylight",
        segments: [
          {
            id: 'walk-1',
            type: 'walk',
            from: fromLocation,
            to: '42nd St-Port Authority',
            duration: 8,
            instructions: 'Walk west to Port Authority Bus Terminal',
            kidFriendlyTip: "The Port Authority is HUGE - it's like a train station for buses!",
            safetyNote: 'Very busy area - stay close to your adult',
            funThingsToSee: [
              'Giant bus terminal',
              'Food court',
              'Lots of travelers with suitcases',
            ],
            accessibility: {
              wheelchairAccessible: true,
              strollerFriendly: true,
              elevatorRequired: false,
            },
          },
          {
            id: 'bus-1',
            type: 'bus',
            line: 'M11',
            from: '42nd St-Port Authority',
            to: '59th St & 9th Ave',
            duration: 18,
            instructions: 'Take M11 bus northbound for about 15 minutes',
            kidFriendlyTip: 'Buses let you see the city from above ground - look out the windows!',
            safetyNote: 'Hold on tight when the bus stops and starts',
            funThingsToSee: [
              'Street level view of NYC',
              'Different neighborhoods',
              'Bike lanes and bike riders',
            ],
            accessibility: {
              wheelchairAccessible: true,
              strollerFriendly: true,
              elevatorRequired: false,
            },
          },
          {
            id: 'walk-2',
            type: 'walk',
            from: '59th St & 9th Ave',
            to: toLocation,
            duration: 7,
            instructions: 'Walk east 3 blocks to Central Park',
            kidFriendlyTip: 'You can see the park getting closer - look for the trees!',
            funThingsToSee: ['Tree-lined streets', 'Brownstone buildings', 'People walking dogs'],
            accessibility: {
              wheelchairAccessible: true,
              strollerFriendly: true,
              elevatorRequired: false,
            },
          },
        ],
        thingsToRemember: [
          'Have exact change or MetroCard for bus',
          'Board at the front door, exit at the back',
          'Buses stop at every stop unless you request',
          'Press the stop button or pull the cord when you want to get off',
        ],
        emergencyInfo: {
          nearestHospital: 'Mount Sinai West (59th St & 10th Ave)',
          transitPolice: 'Call 911 or ask bus driver for help',
          helpfulStaff: ['Bus drivers', 'Transit supervisors at major stops'],
        },
        funAlongTheWay: [
          'Count how many yellow taxi cabs you see',
          'Look for street art and murals',
          'Spot different types of street food vendors',
          'Find fire escapes on old buildings',
        ],
        estimatedCost: {
          adult: 2.9,
          child: 0,
        },
      },
    ];

    setTripOptions(mockTripOptions);
    setIsPlanning(false);
  };

  const selectTrip = (trip: TripPlan) => {
    setSelectedTrip(trip);
    if (onTripReady) {
      onTripReady(trip);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TripPlannerHeader />

        <TripPlannerForm
          fromLocation={fromLocation}
          toLocation={toLocation}
          groupSize={groupSize}
          accessibilityNeeds={accessibilityNeeds}
          isPlanning={isPlanning}
          onFromLocationChange={setFromLocation}
          onToLocationChange={setToLocation}
          onIncrementAdults={incrementAdults}
          onDecrementAdults={decrementAdults}
          onIncrementChildren={incrementChildren}
          onDecrementChildren={decrementChildren}
          onToggleWheelchair={toggleWheelchair}
          onToggleStroller={toggleStroller}
          onPlanTrip={planTrip}
        />

        <TripPlannerRouteList tripOptions={tripOptions} onSelectTrip={selectTrip} />

        <TripPlannerRouteDetails trip={selectedTrip} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});

export default KidTripPlanner;
