import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Train, Bus, Clock, AlertTriangle, Info, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { subwayLineColors } from '@/config/transit-data/mta-subway-lines';

export type ArrivalInfo = {
  id: string;
  route: string;
  destination: string;
  direction: string;
  arrivalTime: number; // minutes
  status: 'on-time' | 'delayed' | 'approaching';
  track?: string;
  kidNote?: string;
  delayReason?: string;
};

type ArrivalCardProps = {
  arrival: ArrivalInfo;
  stationType: 'subway' | 'bus';
  isFavorite: boolean;
  onToggleFavorite: (route: string) => void;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approaching':
      return <Train size={16} color="#4CAF50" />;
    case 'delayed':
      return <AlertTriangle size={16} color="#FF9800" />;
    default:
      return <Clock size={16} color="#2196F3" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approaching':
      return '#4CAF50';
    case 'delayed':
      return '#FF9800';
    default:
      return '#2196F3';
  }
};

const getRouteColor = (route: string) => {
  return subwayLineColors[route] || Colors.primary;
};

const formatArrivalTime = (minutes: number) => {
  if (minutes <= 1) return 'Arriving';
  if (minutes <= 2) return '2 min';
  return `${minutes} min`;
};

const ArrivalCard: React.FC<ArrivalCardProps> = ({
  arrival,
  stationType,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <View style={styles.arrivalCard}>
      <View style={styles.arrivalHeader}>
        <View style={styles.routeInfo}>
          {stationType === 'subway' ? (
            <View
              style={[styles.routeIndicator, { backgroundColor: getRouteColor(arrival.route) }]}
            >
              <Text style={styles.routeText}>{arrival.route}</Text>
            </View>
          ) : (
            <View style={styles.busRouteIndicator}>
              <Bus size={16} color={Colors.primary} />
              <Text style={styles.busRouteText}>{arrival.route}</Text>
            </View>
          )}

          <View style={styles.destinationInfo}>
            <Text style={styles.destinationText}>{arrival.destination}</Text>
            <Text style={styles.directionText}>{arrival.direction}</Text>
            {arrival.track && <Text style={styles.trackText}>Track {arrival.track}</Text>}
          </View>
        </View>

        <View style={styles.arrivalInfo}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(arrival.route)}
          >
            <Star
              size={16}
              color={isFavorite ? '#FFD700' : '#CCCCCC'}
              fill={isFavorite ? '#FFD700' : 'none'}
            />
          </TouchableOpacity>

          <View style={styles.timeContainer}>
            {getStatusIcon(arrival.status)}
            <Text style={[styles.arrivalTime, { color: getStatusColor(arrival.status) }]}>
              {formatArrivalTime(arrival.arrivalTime)}
            </Text>
          </View>
        </View>
      </View>

      {arrival.kidNote && (
        <View style={styles.kidNoteContainer}>
          <Info size={14} color="#4CAF50" />
          <Text style={styles.kidNoteText}>{arrival.kidNote}</Text>
        </View>
      )}

      {arrival.delayReason && (
        <View style={styles.delayContainer}>
          <AlertTriangle size={14} color="#FF9800" />
          <Text style={styles.delayText}>{arrival.delayReason}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  arrivalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  arrivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  routeIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  busRouteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  busRouteText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  directionText: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 2,
  },
  trackText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  arrivalInfo: {
    alignItems: 'flex-end',
  },
  favoriteButton: {
    padding: 4,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrivalTime: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  kidNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  kidNoteText: {
    fontSize: 13,
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  delayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  delayText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

export default ArrivalCard;
