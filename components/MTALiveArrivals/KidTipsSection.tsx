import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Info, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';

type KidTipsSectionProps = {
  stationType: 'subway' | 'bus';
};

const KidTipsSection: React.FC<KidTipsSectionProps> = ({ stationType }) => {
  return (
    <View style={styles.kidTipsSection}>
      <Text style={styles.sectionTitle}>Kid Tips 💡</Text>
      <View style={styles.tipCard}>
        <Info size={16} color="#4CAF50" />
        <Text style={styles.tipText}>
          {stationType === 'subway'
            ? "Watch for the train's destination on the front - make sure it's going where you want!"
            : 'Look for the bus number on the front and side - each route has its own number!'}
        </Text>
      </View>
      <View style={styles.tipCard}>
        <Clock size={16} color="#2196F3" />
        <Text style={styles.tipText}>
          Times shown are estimates - trains and buses might arrive a little earlier or later!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  kidTipsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

export default KidTipsSection;
