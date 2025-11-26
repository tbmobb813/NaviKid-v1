import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mtaSubwayLines, subwayEducationalContent } from '@/config/transit-data/mta-subway-lines';
import { EducationCard } from './EducationCard';

type SubwaySectionProps = {
  expandedCard: string | null;
  onCardToggle: (cardKey: string) => void;
};

export const SubwaySection: React.FC<SubwaySectionProps> = ({ expandedCard, onCardToggle }) => {
  return (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>All About the Subway 🚇</Text>

      <EducationCard
        title="Express vs Local Trains"
        cardKey="express-local"
        isExpanded={expandedCard === 'express-local'}
        onToggle={onCardToggle}
        content={
          <View>
            <Text style={styles.explanationText}>
              {subwayEducationalContent.express_vs_local.explanation}
            </Text>
            <View style={styles.tipBox}>
              <Lightbulb size={16} color="#FFA726" />
              <Text style={styles.tipText}>{subwayEducationalContent.express_vs_local.kidTip}</Text>
            </View>
          </View>
        }
      />

      <EducationCard
        title="Uptown vs Downtown"
        cardKey="directions"
        isExpanded={expandedCard === 'directions'}
        onToggle={onCardToggle}
        content={
          <View>
            <Text style={styles.explanationText}>
              {subwayEducationalContent.directions.explanation}
            </Text>
            <View style={styles.tipBox}>
              <Lightbulb size={16} color="#FFA726" />
              <Text style={styles.tipText}>{subwayEducationalContent.directions.kidTip}</Text>
            </View>
          </View>
        }
      />

      <EducationCard
        title="How to Transfer Between Trains"
        cardKey="transfers"
        isExpanded={expandedCard === 'transfers'}
        onToggle={onCardToggle}
        content={
          <View>
            <Text style={styles.explanationText}>
              {subwayEducationalContent.transfers.explanation}
            </Text>
            <View style={styles.tipBox}>
              <Lightbulb size={16} color="#FFA726" />
              <Text style={styles.tipText}>{subwayEducationalContent.transfers.kidTip}</Text>
            </View>
          </View>
        }
      />

      <EducationCard
        title="Popular Subway Lines"
        cardKey="popular-lines"
        isExpanded={expandedCard === 'popular-lines'}
        onToggle={onCardToggle}
        content={
          <View>
            {mtaSubwayLines.slice(0, 3).map((line) => (
              <View key={line.id} style={styles.lineCard}>
                <View style={[styles.lineIndicator, { backgroundColor: line.color }]}>
                  <Text style={styles.lineNumber}>{line.name}</Text>
                </View>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName}>{line.kidFriendlyName}</Text>
                  <Text style={styles.lineDescription}>{line.description}</Text>
                  <Text style={styles.lineFact}>💡 {line.funFacts[0]}</Text>
                </View>
              </View>
            ))}
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
  lineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lineIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lineNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  lineDescription: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 4,
    lineHeight: 18,
  },
  lineFact: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
  },
});
