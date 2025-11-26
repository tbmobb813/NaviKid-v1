import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';

type EducationCardProps = {
  title: string;
  content: React.ReactNode;
  cardKey: string;
  isExpanded: boolean;
  onToggle: (cardKey: string) => void;
};

export const EducationCard: React.FC<EducationCardProps> = ({
  title,
  content,
  cardKey,
  isExpanded,
  onToggle,
}) => {
  return (
    <View style={styles.educationCard}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => onToggle(cardKey)}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
      </TouchableOpacity>
      {isExpanded && <View style={styles.cardContent}>{content}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  educationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  expandIcon: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
