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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        color={i < rating ? '#FFB300' : '#E0E0E0'}
        fill={i < rating ? '#FFB300' : 'transparent'}
      />
    ));
  };

  const renderTripOption = (trip: TripPlan) => (
    <View key={trip.id} style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDuration}>{trip.totalDuration} minutes total</Text>
          <Text style={styles.walkingTime}>{trip.totalWalkingTime} min walking</Text>
        </View>
        <View style={styles.tripRating}>
          <View style={styles.starsContainer}>{renderStars(trip.kidFriendlyRating)}</View>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  trip.difficulty === 'Easy'
                    ? '#4CAF50'
                    : trip.difficulty === 'Medium'
                      ? '#FF9800'
                      : '#F44336',
              },
            ]}
          >
            <Text style={styles.difficultyText}>{trip.difficulty}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.bestTime}>⏰ {trip.bestTimeToGo}</Text>

      <View style={styles.costContainer}>
        <Text style={styles.costText}>
          💰 ${trip.estimatedCost.adult.toFixed(2)} per adult
          {trip.estimatedCost.child === 0 ? ' • Kids ride free!' : ''}
        </Text>
      </View>

      <TouchableOpacity style={styles.selectTripButton} onPress={() => selectTrip(trip)}>
        <Play size={16} color="#FFFFFF" />
        <Text style={styles.selectTripText}>Select This Route</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSegment = (segment: TripSegment) => {
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

    return (
      <View key={segment.id} style={styles.segmentCard}>
        <View style={styles.segmentHeader}>
          <View style={styles.segmentIcon}>{getSegmentIcon()}</View>
          <View style={styles.segmentDetails}>
            <Text style={styles.segmentTitle}>
              {segment.type === 'walk' ? '🚶 Walk' : segment.type === 'subway' ? '🚇 Subway' : segment.type === 'bus' ? '🚌 Bus' : '🔄 Transfer'}
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
              <Text style={[styles.accessibilityText, { color: '#4CAF50' }]}>
                Wheelchair OK
              </Text>
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
              <Text style={[styles.accessibilityText, { color: '#FF9800' }]}>
                Elevator Needed
              </Text>
            </View>
          )}
        </View>
      </View>
    );
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
