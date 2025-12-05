import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Colors from '@/constants/colors';

type NumberInputProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: number;
  onValueChange: (value: number) => void;
  unit: string;
  min: number;
  max: number;
};

export const NumberInput: React.FC<NumberInputProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  unit,
  min,
  max,
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  const handleChange = (text: string) => {
    setLocalValue(text);
    const num = parseInt(text);
    if (!isNaN(num) && num >= min && num <= max) {
      onValueChange(num);
    }
  };

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.numberInputContainer}>
        <TextInput
          style={styles.numberInput}
          value={localValue}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder={min.toString()}
        />
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  numberInput: {
    width: 50,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
