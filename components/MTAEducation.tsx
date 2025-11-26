import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Train, Bus, AlertTriangle, Info, Lightbulb } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { OverviewSection } from './education/OverviewSection';
import { SubwaySection } from './education/SubwaySection';
import { BusSection } from './education/BusSection';
import { SafetySection } from './education/SafetySection';
import { TipsSection } from './education/TipsSection';

type MTAEducationProps = {
  onClose?: () => void;
};

type EducationSection = 'overview' | 'subway' | 'bus' | 'safety' | 'tips';

const MTAEducation: React.FC<MTAEducationProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<EducationSection>('overview');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleCardToggle = (cardKey: string) => {
    setExpandedCard(expandedCard === cardKey ? null : cardKey);
  };

  const renderSectionButton = (section: EducationSection, icon: React.ReactNode, title: string) => (
    <TouchableOpacity
      style={[styles.sectionButton, activeSection === section && styles.activeSectionButton]}
      onPress={() => setActiveSection(section)}
    >
      {icon}
      <Text
        style={[
          styles.sectionButtonText,
          activeSection === section && styles.activeSectionButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'subway':
        return <SubwaySection expandedCard={expandedCard} onCardToggle={handleCardToggle} />;
      case 'bus':
        return <BusSection expandedCard={expandedCard} onCardToggle={handleCardToggle} />;
      case 'safety':
        return <SafetySection expandedCard={expandedCard} onCardToggle={handleCardToggle} />;
      case 'tips':
        return <TipsSection expandedCard={expandedCard} onCardToggle={handleCardToggle} />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NYC Transit Guide for Kids</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionButtons}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderSectionButton(
            'overview',
            <Info size={20} color={activeSection === 'overview' ? '#FFFFFF' : Colors.primary} />,
            'Overview',
          )}
          {renderSectionButton(
            'subway',
            <Train size={20} color={activeSection === 'subway' ? '#FFFFFF' : Colors.primary} />,
            'Subway',
          )}
          {renderSectionButton(
            'bus',
            <Bus size={20} color={activeSection === 'bus' ? '#FFFFFF' : Colors.primary} />,
            'Bus',
          )}
          {renderSectionButton(
            'safety',
            <AlertTriangle
              size={20}
              color={activeSection === 'safety' ? '#FFFFFF' : Colors.primary}
            />,
            'Safety',
          )}
          {renderSectionButton(
            'tips',
            <Lightbulb size={20} color={activeSection === 'tips' ? '#FFFFFF' : Colors.primary} />,
            'Tips',
          )}
        </ScrollView>
      </View>

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  sectionButtons: {
    paddingVertical: 16,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeSectionButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sectionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  activeSectionButtonText: {
    color: '#FFFFFF',
  },
});

export default MTAEducation;
