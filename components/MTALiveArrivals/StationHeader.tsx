import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Train, Bus, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';

type StationHeaderProps = {
  stationName: string;
  stationType: 'subway' | 'bus';
  lastUpdated: Date;
  refreshing: boolean;
  onRefresh: () => void;
};

const StationHeader: React.FC<StationHeaderProps> = ({
  stationName,
  stationType,
  lastUpdated,
  refreshing,
  onRefresh,
}) => {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.stationInfo}>
          {stationType === 'subway' ? (
            <Train size={24} color={Colors.primary} />
          ) : (
            <Bus size={24} color={Colors.primary} />
          )}
          <View style={styles.stationDetails}>
            <Text style={styles.stationName}>{stationName}</Text>
            <Text style={styles.stationType}>
              {stationType === 'subway' ? 'Subway Station' : 'Bus Stop'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          testID="refresh-button"
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={20}
            color={refreshing ? '#CCCCCC' : Colors.primary}
            style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.lastUpdated}>Last updated: {lastUpdated.toLocaleTimeString()}</Text>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stationDetails: {
    marginLeft: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  stationType: {
    fontSize: 14,
    color: Colors.textLight,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
});

export default StationHeader;
