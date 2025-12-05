import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Shield, Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { AccessibilityNeeds } from '@/hooks/tripPlanner/types';

type AccessibilityOptionsProps = {
  accessibilityNeeds: AccessibilityNeeds;
  onToggleWheelchair: () => void;
  onToggleStroller: () => void;
};

export const AccessibilityOptions: React.FC<AccessibilityOptionsProps> = ({
  accessibilityNeeds,
  onToggleWheelchair,
  onToggleStroller,
}) => {
  return (
    <View style={styles.accessibilityOptions}>
      <Text style={styles.inputLabel}>Accessibility Needs</Text>
      <TouchableOpacity
        style={[
          styles.accessibilityOption,
          accessibilityNeeds.wheelchair && styles.accessibilityOptionActive,
        ]}
        onPress={onToggleWheelchair}
      >
        <Shield size={16} color={accessibilityNeeds.wheelchair ? '#FFFFFF' : Colors.primary} />
        <Text
          style={[
            styles.accessibilityOptionText,
            accessibilityNeeds.wheelchair && styles.accessibilityOptionTextActive,
          ]}
        >
          Wheelchair Access
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.accessibilityOption,
          accessibilityNeeds.stroller && styles.accessibilityOptionActive,
        ]}
        onPress={onToggleStroller}
      >
        <Heart size={16} color={accessibilityNeeds.stroller ? '#FFFFFF' : Colors.primary} />
        <Text
          style={[
            styles.accessibilityOptionText,
            accessibilityNeeds.stroller && styles.accessibilityOptionTextActive,
          ]}
        >
          Stroller Friendly
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  accessibilityOptions: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  accessibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  accessibilityOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  accessibilityOptionText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  accessibilityOptionTextActive: {
    color: '#FFFFFF',
  },
});
