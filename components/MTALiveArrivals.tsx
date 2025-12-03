import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { logger } from '@/utils/logger';
import ArrivalCard, { type ArrivalInfo } from './MTALiveArrivals/ArrivalCard';
import AlertCard, { type StationAlert } from './MTALiveArrivals/AlertCard';
import StationHeader from './MTALiveArrivals/StationHeader';
import KidTipsSection from './MTALiveArrivals/KidTipsSection';

type MTALiveArrivalsProps = {
  stationId?: string;
  stationName?: string;
  stationType: 'subway' | 'bus';
  userLocation?: { lat: number; lng: number };
};

const MTALiveArrivals: React.FC<MTALiveArrivalsProps> = ({
  stationId = 'times-sq-42',
  stationName = 'Times Sq-42nd St',
  stationType,
  userLocation,
}) => {
  const [arrivals, setArrivals] = useState<ArrivalInfo[]>([]);
  const [alerts, setAlerts] = useState<StationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [favoriteRoutes, setFavoriteRoutes] = useState<string[]>([]);

  // Mock data - in real app, this would fetch from MTA APIs
  const mockSubwayArrivals: ArrivalInfo[] = [
    {
      id: '1',
      route: '1',
      destination: 'South Ferry',
      direction: 'Downtown',
      arrivalTime: 2,
      status: 'approaching',
      track: '1',
      kidNote: 'Train to downtown Manhattan and the Statue of Liberty!',
    },
    {
      id: '2',
      route: 'N',
      destination: 'Coney Island',
      direction: 'Brooklyn-bound',
      arrivalTime: 4,
      status: 'on-time',
      track: '4',
      kidNote: 'Train to the beach and amusement park!',
    },
    {
      id: '3',
      route: 'Q',
      destination: '96th St',
      direction: 'Uptown',
      arrivalTime: 6,
      status: 'on-time',
      track: '3',
      kidNote: 'Train to the Upper East Side',
    },
    {
      id: '4',
      route: '4',
      destination: 'Woodlawn',
      direction: 'Uptown',
      arrivalTime: 8,
      status: 'delayed',
      track: '2',
      kidNote: 'Express train to the Bronx',
      delayReason: 'Signal problems ahead',
    },
    {
      id: '5',
      route: '7',
      destination: 'Flushing',
      direction: 'Queens-bound',
      arrivalTime: 10,
      status: 'on-time',
      track: '5',
      kidNote: 'Train to amazing food in Queens!',
    },
  ];

  const mockBusArrivals: ArrivalInfo[] = [
    {
      id: '1',
      route: 'M42',
      destination: 'UN/1st Av',
      direction: 'Eastbound',
      arrivalTime: 3,
      status: 'on-time',
      kidNote: 'Bus across 42nd Street to the United Nations',
    },
    {
      id: '2',
      route: 'M42',
      destination: 'Port Authority',
      direction: 'Westbound',
      arrivalTime: 7,
      status: 'on-time',
      kidNote: 'Bus to the big bus terminal',
    },
    {
      id: '3',
      route: 'M104',
      destination: '42nd St/Broadway',
      direction: 'Southbound',
      arrivalTime: 5,
      status: 'delayed',
      delayReason: 'Heavy traffic',
    },
  ];

  const mockAlerts: StationAlert[] = [
    {
      id: '1',
      type: 'information',
      severity: 'low',
      message: 'Elevator service normal',
      kidFriendlyMessage: 'Good news! The elevator is working for people who need it 🛗',
      affectedRoutes: ['ALL'],
    },
    {
      id: '2',
      type: 'delay',
      severity: 'medium',
      message: 'Minor delays on 4, 5, 6 lines due to signal problems',
      kidFriendlyMessage: 'Some trains might be a little late because of signal problems 🚦',
      affectedRoutes: ['4', '5', '6'],
    },
  ];

  useEffect(() => {
    loadArrivals();
    const interval = setInterval(loadArrivals, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [stationId, stationType]);

  const loadArrivals = async () => {
    try {
      setLoading(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use mock data based on station type
      const mockData = stationType === 'subway' ? mockSubwayArrivals : mockBusArrivals;
      setArrivals(mockData);
      setAlerts(mockAlerts);
      setLastUpdated(new Date());
    } catch (error) {
      logger.error('Failed to load arrivals', error as Error, {
        stationId,
        stationName
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadArrivals();
  };

  const toggleFavoriteRoute = (route: string) => {
    setFavoriteRoutes((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route],
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading live arrivals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StationHeader
        stationName={stationName}
        stationType={stationType}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <ScrollView
        testID="arrivals-scroll-view"
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Service Alerts 🚨</Text>
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </View>
        )}

        <View style={styles.arrivalsSection}>
          <Text style={styles.sectionTitle}>
            Next {stationType === 'subway' ? 'Trains' : 'Buses'} 🚇
          </Text>

          {arrivals.length === 0 ? (
            <View style={styles.noArrivalsContainer}>
              <MapPin size={48} color="#CCCCCC" />
              <Text style={styles.noArrivalsText}>
                No arrivals found for this {stationType === 'subway' ? 'station' : 'stop'}
              </Text>
            </View>
          ) : (
            arrivals.map((arrival) => (
              <ArrivalCard
                key={arrival.id}
                arrival={arrival}
                stationType={stationType}
                isFavorite={favoriteRoutes.includes(arrival.route)}
                onToggleFavorite={toggleFavoriteRoute}
              />
            ))
          )}
        </View>

        <KidTipsSection stationType={stationType} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  alertsSection: {
    marginBottom: 8,
  },
  arrivalsSection: {
    marginBottom: 8,
  },
  noArrivalsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noArrivalsText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});

export default MTALiveArrivals;
