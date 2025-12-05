import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import { RegionConfig } from '@/types/region';
import { useRegionForm } from '@/hooks/useRegionForm';
import { FormInput } from './FormInput';

type AddEditRegionFormProps = {
  region?: RegionConfig | null;
  onSave: (region: RegionConfig) => void;
  onCancel: () => void;
};

export const AddEditRegionForm: React.FC<AddEditRegionFormProps> = ({
  region,
  onSave,
  onCancel,
}) => {
  const { formData, updateField, validateAndSave } = useRegionForm(region, onSave);

  const handleSave = () => {
    validateAndSave();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onCancel}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>{region ? 'Edit' : 'Add'} City</Text>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <FormInput
        label="City ID"
        value={formData.id || ''}
        onChangeText={(text) => updateField('id', text)}
        placeholder="e.g., nyc, chicago"
        editable={!region}
        required
      />

      <FormInput
        label="City Name"
        value={formData.name || ''}
        onChangeText={(text) => updateField('name', text)}
        placeholder="e.g., New York City"
        required
      />

      <FormInput
        label="Country"
        value={formData.country || ''}
        onChangeText={(text) => updateField('country', text)}
        placeholder="e.g., United States"
        required
      />

      <FormInput
        label="Transit API Endpoint"
        value={formData.transitApiEndpoint || ''}
        onChangeText={(text) => updateField('transitApiEndpoint', text)}
        placeholder="https://api.example.com/"
      />

      <FormInput
        label="Emergency Number"
        value={formData.emergencyNumber || ''}
        onChangeText={(text) => updateField('emergencyNumber', text)}
        placeholder="911"
      />

      <Text style={styles.infoText}>
        Additional configuration options like transit systems, coordinates, and local information
        can be added through the advanced settings or by importing from a configuration file.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 8,
    padding: 16,
  },
});
