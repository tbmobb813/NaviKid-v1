import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Train, Award, Clock, MapPin, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';

export const OverviewSection: React.FC = () => {
  return (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <Train size={48} color={Colors.primary} />
        <Text style={styles.heroTitle}>Learn About NYC Transit!</Text>
        <Text style={styles.heroSubtitle}>
          Discover how to safely navigate New York City's amazing subway and bus system
        </Text>
      </View>

      <View style={styles.quickFactsContainer}>
        <Text style={styles.sectionTitle}>Amazing NYC Transit Facts!</Text>

        <View style={styles.factCard}>
          <Award size={24} color="#FFD700" />
          <View style={styles.factContent}>
            <Text style={styles.factTitle}>World's Largest!</Text>
            <Text style={styles.factText}>
              NYC has 472 subway stations - more than any other city!
            </Text>
          </View>
        </View>

        <View style={styles.factCard}>
          <Clock size={24} color="#4CAF50" />
          <View style={styles.factContent}>
            <Text style={styles.factTitle}>Never Sleeps!</Text>
            <Text style={styles.factText}>The subway runs 24 hours a day, 7 days a week!</Text>
          </View>
        </View>

        <View style={styles.factCard}>
          <MapPin size={24} color="#FF9800" />
          <View style={styles.factContent}>
            <Text style={styles.factTitle}>Super Long!</Text>
            <Text style={styles.factText}>
              The longest subway ride takes 2 hours and 45 minutes!
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.safetyHighlight}>
        <AlertTriangle size={32} color="#FFA726" />
        <Text style={styles.safetyTitle}>Safety First!</Text>
        <Text style={styles.safetyText}>
          Always stay with a trusted adult and follow the safety rules to have fun exploring the
          city!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginVertical: 16,
  },
  quickFactsContainer: {
    marginBottom: 24,
  },
  factCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  factContent: {
    marginLeft: 16,
    flex: 1,
  },
  factTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  factText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  safetyHighlight: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F57C00',
    marginTop: 12,
  },
  safetyText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
