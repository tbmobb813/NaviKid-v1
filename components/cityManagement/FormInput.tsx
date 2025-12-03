import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import Colors from '@/constants/colors';

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  required?: boolean;
};

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  required = false,
}) => (
  <View style={styles.formSection}>
    <Text style={styles.formLabel}>
      {label} {required && '*'}
    </Text>
    <TextInput
      style={styles.formInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      editable={editable}
    />
  </View>
);

const styles = StyleSheet.create({
  formSection: {
    padding: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
