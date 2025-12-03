import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { subwayLineColors } from '@/config/transit-data/mta-subway-lines';

export type StationAlert = {
  id: string;
  type: 'delay' | 'service-change' | 'information';
  message: string;
  kidFriendlyMessage?: string;
  severity: 'low' | 'medium' | 'high';
  affectedRoutes: string[];
};

type AlertCardProps = {
  alert: StationAlert;
};

const getAlertStyle = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'high':
      return styles.alertHigh;
    case 'medium':
      return styles.alertMedium;
    case 'low':
      return styles.alertLow;
    default:
      return {};
  }
};

const getRouteColor = (route: string) => {
  return subwayLineColors[route] || Colors.primary;
};

const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  return (
    <View style={[styles.alertCard, getAlertStyle(alert.severity)]}>
      <View style={styles.alertHeader}>
        <AlertTriangle size={16} color={alert.severity === 'high' ? '#F44336' : '#FF9800'} />
        <Text style={styles.alertTitle}>
          {alert.type === 'delay'
            ? 'Service Delay'
            : alert.type === 'service-change'
              ? 'Service Change'
              : 'Information'}
        </Text>
      </View>

      <Text style={styles.alertMessage}>{alert.kidFriendlyMessage || alert.message}</Text>

      {alert.affectedRoutes.length > 0 && alert.affectedRoutes[0] !== 'ALL' && (
        <View style={styles.affectedRoutes}>
          <Text style={styles.affectedRoutesLabel}>Affected lines: </Text>
          {alert.affectedRoutes.map((route) => (
            <View
              key={route}
              style={[styles.affectedRouteTag, { backgroundColor: getRouteColor(route) }]}
            >
              <Text style={styles.affectedRouteText}>{route}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertMedium: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  alertHigh: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  alertLow: {
    backgroundColor: '#E8F5E8',
    borderLeftColor: '#4CAF50',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  affectedRoutes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  affectedRoutesLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginRight: 8,
  },
  affectedRouteTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  affectedRouteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AlertCard;
