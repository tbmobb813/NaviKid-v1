import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { busEducationalContent } from '@/config/transit-data/mta-bus-routes';
import { EducationCard } from './EducationCard';

type BusSectionProps = {
  expandedCard: string | null;
  onCardToggle: (cardKey: string) => void;
};

export const BusSection: React.FC<BusSectionProps> = ({ expandedCard, onCardToggle }) => {
  return (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>All About MTA Buses 🚌</Text>

      <EducationCard
        title="Types of Buses"
        cardKey="bus-types"
        isExpanded={expandedCard === 'bus-types'}
        onToggle={onCardToggle}
        content={
          <View>
            {Object.entries(busEducationalContent.bus_types.explanations).map(
              ([type, explanation]) => (
                <View key={type} style={styles.busTypeCard}>
                  <Text style={styles.busTypeName}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  <Text style={styles.busTypeExplanation}>{explanation}</Text>
                </View>
              ),
            )}
            <View style={styles.tipBox}>
              <Lightbulb size={16} color="#FFA726" />
              <Text style={styles.tipText}>{busEducationalContent.bus_types.kidTip}</Text>
            </View>
          </View>
        }
      />

      <EducationCard
        title="How to Ride the Bus"
        cardKey="how-to-ride"
        isExpanded={expandedCard === 'how-to-ride'}
        onToggle={onCardToggle}
        content={
          <View>
            {busEducationalContent.how_to_ride.steps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            <View style={styles.tipBox}>
              <Lightbulb size={16} color="#FFA726" />
              <Text style={styles.tipText}>{busEducationalContent.how_to_ride.kidTip}</Text>
            </View>
          </View>
        }
      />

      <EducationCard
        title="Cool Bus Features"
        cardKey="bus-features"
        isExpanded={expandedCard === 'bus-features'}
        onToggle={onCardToggle}
        content={
          <View>
            {busEducationalContent.bus_features.features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureText}>• {feature}</Text>
              </View>
            ))}
            <View style={styles.tipBox}>
              <Lightbulb size={16} color="#FFA726" />
              <Text style={styles.tipText}>{busEducationalContent.bus_features.kidTip}</Text>
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
  busTypeCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  busTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  busTypeExplanation: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  featureCard: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
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
});
