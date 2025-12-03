import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { ArrowLeft, MapPin, ToggleLeft, ToggleRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

type FormData = {
  name: string;
  latitude: string;
  longitude: string;
  radius: string;
  notifications: {
    onEntry: boolean;
    onExit: boolean;
  };
};

type SafeZoneFormProps = {
  formData: FormData;
  isEditing: boolean;
  onFieldChange: (field: keyof FormData, value: any) => void;
  onToggleNotification: (type: 'onEntry' | 'onExit') => void;
  onGetCurrentLocation: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export const SafeZoneForm: React.FC<SafeZoneFormProps> = ({
  formData,
  isEditing,
  onFieldChange,
  onToggleNotification,
  onGetCurrentLocation,
  onSave,
  onCancel,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onCancel}>
          <ArrowLeft size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Safe Zone' : 'Add Safe Zone'}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => onFieldChange('name', text)}
              placeholder="e.g., Home, School, Grandma's House"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationInputs}>
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                value={formData.latitude}
                onChangeText={(text) => onFieldChange('latitude', text)}
                placeholder="Latitude"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                value={formData.longitude}
                onChangeText={(text) => onFieldChange('longitude', text)}
                placeholder="Longitude"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>
            <Pressable style={styles.locationButton} onPress={onGetCurrentLocation}>
              <MapPin size={16} color={Colors.primary} />
              <Text style={styles.locationButtonText}>Use Current Location</Text>
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Radius (meters)</Text>
            <TextInput
              style={styles.input}
              value={formData.radius}
              onChangeText={(text) => onFieldChange('radius', text)}
              placeholder="100"
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Distance from the center point to trigger notifications (10-1000m)
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notifications</Text>

            <Pressable
              style={styles.toggleRow}
              onPress={() => onToggleNotification('onEntry')}
            >
              <Text style={styles.toggleLabel}>Notify on entry</Text>
              {formData.notifications.onEntry ? (
                <ToggleRight size={24} color={Colors.primary} />
              ) : (
                <ToggleLeft size={24} color={Colors.textLight} />
              )}
            </Pressable>

            <Pressable
              style={styles.toggleRow}
              onPress={() => onToggleNotification('onExit')}
            >
              <Text style={styles.toggleLabel}>Notify on exit</Text>
              {formData.notifications.onExit ? (
                <ToggleRight size={24} color={Colors.primary} />
              ) : (
                <ToggleLeft size={24} color={Colors.textLight} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Safe Zone' : 'Create Safe Zone'}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  coordinateInput: {
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  actions: {
    gap: 12,
    paddingBottom: 24,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
