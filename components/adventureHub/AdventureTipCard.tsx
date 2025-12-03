import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';

export const AdventureTipCard: React.FC = () => (
  <View style={styles.tipCard}>
    <Sparkles size={20} color="#9C27B0" />
    <View style={styles.tipContent}>
      <Text style={styles.tipTitle}>Explore & Share!</Text>
      <Text style={styles.tipText}>
        Keep your adventure crew updated about where you&apos;re exploring. Share photos of cool
        discoveries!
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 16,
  },
});
