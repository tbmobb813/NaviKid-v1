import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UnifiedRoute } from '@/utils/unifiedRoutingService';

interface RouteCardProps {
  route: UnifiedRoute;
  index: number;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, index }) => {
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeTitle}>
          {route.type.charAt(0).toUpperCase() + route.type.slice(1)} Route {index + 1}
        </Text>
        <Text style={styles.routeSource}>{route.source}</Text>
      </View>

      <Text style={styles.routeDescription}>{route.description}</Text>

      <View style={styles.routeStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{route.summary.duration} min</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>
            {Math.round((route.summary.distance / 1000) * 10) / 10} km
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Safety</Text>
          <Text style={styles.statValue}>{route.safetyScore}/100</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Kid-Friendly</Text>
          <Text style={styles.statValue}>{route.kidFriendlyScore}/100</Text>
        </View>
      </View>

      {route.summary.transfers !== undefined && (
        <Text style={styles.transferInfo}>Transfers: {route.summary.transfers}</Text>
      )}

      {route.alerts && route.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>Alerts:</Text>
          {route.alerts.slice(0, 2).map((alert, i) => (
            <Text key={i} style={styles.alertText}>
              • {alert}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  routeCard: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeSource: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  routeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: 80,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transferInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  alertsContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#856404',
  },
});
