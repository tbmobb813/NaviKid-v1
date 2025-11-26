import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { MapPin, Clock, Info, Lightbulb } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { subwayEducationalContent } from '@/config/transit-data/mta-subway-lines';
import { EducationCard } from './EducationCard';

type TipsSectionProps = {
  expandedCard: string | null;
  onCardToggle: (cardKey: string) => void;
};

export const TipsSection: React.FC<TipsSectionProps> = ({ expandedCard, onCardToggle }) => {
  return (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Pro Tips for Young Explorers! 🌟</Text>

      <EducationCard
        title="Payment Methods"
        cardKey="payment"
        isExpanded={expandedCard === 'payment'}
        onToggle={onCardToggle}
        content={
          <View>
            <Text style={styles.explanationText}>{subwayEducationalContent.payment.explanation}</Text>
            <View style={styles.tipBox}>
              <Lightbulb size={16} color="#FFA726" />
              <Text style={styles.tipText}>{subwayEducationalContent.payment.kidTip}</Text>
            </View>
          </View>
        }
      />

      <EducationCard
        title="Planning Your Trip"
        cardKey="planning"
        isExpanded={expandedCard === 'planning'}
        onToggle={onCardToggle}
        content={
          <View>
            <View style={styles.planningTip}>
              <MapPin size={20} color="#4CAF50" />
              <Text style={styles.planningText}>Always know your destination station name</Text>
            </View>
            <View style={styles.planningTip}>
              <Clock size={20} color="#4CAF50" />
              <Text style={styles.planningText}>Allow extra time for walking and transfers</Text>
            </View>
            <View style={styles.planningTip}>
              <Info size={20} color="#4CAF50" />
              <Text style={styles.planningText}>Download the MTA app for real-time updates</Text>
            </View>
          </View>
        }
      />

      <EducationCard
        title="Accessibility Features"
        cardKey="accessibility"
        isExpanded={expandedCard === 'accessibility'}
        onToggle={onCardToggle}
        content={
          <View>
            <Text style={styles.accessibilityTitle}>NYC Transit is for Everyone!</Text>
            <View style={styles.accessibilityFeature}>
              <Text style={styles.accessibilityText}>♿ All buses have wheelchair lifts</Text>
            </View>
            <View style={styles.accessibilityFeature}>
              <Text style={styles.accessibilityText}>🔊 Audio announcements for stops</Text>
            </View>
            <View style={styles.accessibilityFeature}>
              <Text style={styles.accessibilityText}>🚪 Wide doors and priority seating</Text>
            </View>
            <View style={styles.accessibilityFeature}>
              <Text style={styles.accessibilityText}>🐕 Service animals always welcome</Text>
            </View>
          </View>
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginVertical: 16,
  },
  explanationText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#F57C00',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  planningTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planningText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  accessibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  accessibilityFeature: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  accessibilityText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
});
