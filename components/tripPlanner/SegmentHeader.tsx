import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { getSegmentIcon, getSegmentTypeLabel } from './segmentHelpers';

type SegmentHeaderProps = {
  type: string;
  line?: string;
  from: string;
  to: string;
  duration: number;
};

export const SegmentHeader: React.FC<SegmentHeaderProps> = ({ type, line, from, to, duration }) => {
  return (
    <View style={styles.segmentHeader}>
      <View style={styles.segmentIcon}>{getSegmentIcon(type)}</View>
      <View style={styles.segmentDetails}>
        <Text style={styles.segmentTitle}>
          {getSegmentTypeLabel(type)}
          {line ? ` - ${line} Train` : ''}
        </Text>
        <Text style={styles.segmentRoute}>
          {from} → {to}
        </Text>
        <Text style={styles.segmentDuration}>⏱️ {duration} minutes</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  segmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  segmentDetails: {
    flex: 1,
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  segmentRoute: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  segmentDuration: {
    fontSize: 12,
    color: Colors.textLight,
  },
});
