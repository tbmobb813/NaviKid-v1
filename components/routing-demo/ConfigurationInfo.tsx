import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ConfigurationInfo: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Configuration</Text>
      <View style={styles.configInfo}>
        <Text style={styles.configText}>
          ORS Base URL: {process.env.ORS_BASE_URL || 'https://api.openrouteservice.org'}
        </Text>
        <Text style={styles.configText}>
          ORS API Key: {process.env.ORS_API_KEY ? '✓ Configured' : '⚠️ Missing'}
        </Text>
        <Text style={styles.configText}>
          OTP2 Base URL: {process.env.OTP2_BASE_URL || 'http://localhost:8080'}
        </Text>
        <Text style={styles.configText}>
          OTP2 Router ID: {process.env.OTP2_ROUTER_ID || 'default'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  configInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
  },
  configText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
