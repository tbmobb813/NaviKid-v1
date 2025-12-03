import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';
import { GroupSize } from '@/hooks/tripPlanner/types';

type GroupSizeControlsProps = {
  groupSize: GroupSize;
  onIncrementAdults: () => void;
  onDecrementAdults: () => void;
  onIncrementChildren: () => void;
  onDecrementChildren: () => void;
};

export const GroupSizeControls: React.FC<GroupSizeControlsProps> = ({
  groupSize,
  onIncrementAdults,
  onDecrementAdults,
  onIncrementChildren,
  onDecrementChildren,
}) => {
  return (
    <View style={styles.groupSizeContainer}>
      <Text style={styles.inputLabel}>Group Size</Text>
      <View style={styles.groupSizeControls}>
        <View style={styles.groupItem}>
          <Text style={styles.groupLabel}>Adults:</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity style={styles.counterButton} onPress={onDecrementAdults}>
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{groupSize.adults}</Text>
            <TouchableOpacity style={styles.counterButton} onPress={onIncrementAdults}>
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.groupItem}>
          <Text style={styles.groupLabel}>Children:</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity style={styles.counterButton} onPress={onDecrementChildren}>
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{groupSize.children}</Text>
            <TouchableOpacity style={styles.counterButton} onPress={onIncrementChildren}>
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  groupSizeContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  groupSizeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  groupLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
});
