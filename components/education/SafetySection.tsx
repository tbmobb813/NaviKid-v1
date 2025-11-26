import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { AlertTriangle, Lightbulb } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mtaSubwayLines } from '@/config/transit-data/mta-subway-lines';
import { busEducationalContent } from '@/config/transit-data/mta-bus-routes';
import { EducationCard } from './EducationCard';

type SafetySectionProps = {
  expandedCard: string | null;
  onCardToggle: (cardKey: string) => void;
};

export const SafetySection: React.FC<SafetySectionProps> = ({ expandedCard, onCardToggle }) => {
  return (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Stay Safe on Transit! 🛡️</Text>

      <EducationCard
        title="Subway Safety Rules"
        cardKey="subway-safety"
        isExpanded={expandedCard === 'subway-safety'}
        onToggle={onCardToggle}
        content={
          <View>
            <View style={styles.safetyTipCard}>
              <AlertTriangle size={16} color="#FF9800" />
              <Text style={styles.safetyTipText}>{mtaSubwayLines[0].safetyNote}</Text>
            </View>
          </View>
        }
      />

      <EducationCard
        title="Bus Safety Rules"
        cardKey="bus-safety"
        isExpanded={expandedCard === 'bus-safety'}
        onToggle={onCardToggle}
        content={
          <View>
            {busEducationalContent.how_to_ride.steps.slice(0, 3).map((tip, index) => (
              <View key={index} style={styles.safetyTipCard}>
                <AlertTriangle size={16} color="#FF9800" />
                <Text style={styles.safetyTipText}>{tip}</Text>
              </View>
            ))}
          </View>
        }
      />

      <EducationCard
        title="Being Polite on Transit"
        cardKey="etiquette"
        isExpanded={expandedCard === 'etiquette'}
        onToggle={onCardToggle}
        content={
          <View>
            {busEducationalContent.bus_etiquette.rules.map((rule, index) => (
              <View key={index} style={styles.etiquetteCard}>
                <Text style={styles.etiquetteText}>😊 {rule}</Text>
              </View>
            ))}
            <View style={styles.tipBox}>
              <Lightbulb size={16} color="#FFA726" />
              <Text style={styles.tipText}>{busEducationalContent.bus_etiquette.kidTip}</Text>
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
  safetyTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  safetyTipText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  etiquetteCard: {
    backgroundColor: '#F1F8E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  etiquetteText: {
    fontSize: 14,
    color: '#2E7D32',
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
