import { useState } from 'react';
import { Alert } from 'react-native';
import { useParentalStore } from '@/stores/parentalStore';
import { SafeZone } from '@/types/parental';

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

const initialFormData: FormData = {
  name: '',
  latitude: '',
  longitude: '',
  radius: '100',
  notifications: {
    onEntry: true,
    onExit: true,
  },
};

export const useSafeZoneForm = () => {
  const { addSafeZone, updateSafeZone, deleteSafeZone } = useParentalStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingZone, setEditingZone] = useState<SafeZone | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingZone(null);
    setShowAddForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name for the safe zone');
      return;
    }

    const latitude = parseFloat(formData.latitude);
    const longitude = parseFloat(formData.longitude);
    const radius = parseInt(formData.radius);

    if (isNaN(latitude) || isNaN(longitude)) {
      Alert.alert('Error', 'Please enter valid coordinates');
      return;
    }

    if (isNaN(radius) || radius < 10 || radius > 1000) {
      Alert.alert('Error', 'Radius must be between 10 and 1000 meters');
      return;
    }

    try {
      if (editingZone) {
        await updateSafeZone(editingZone.id, {
          name: formData.name.trim(),
          latitude,
          longitude,
          radius,
          notifications: formData.notifications,
        });
        Alert.alert('Success', 'Safe zone updated successfully');
      } else {
        await addSafeZone({
          name: formData.name.trim(),
          latitude,
          longitude,
          radius,
          isActive: true,
          notifications: formData.notifications,
        });
        Alert.alert('Success', 'Safe zone created successfully');
      }
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save safe zone');
    }
  };

  const handleEdit = (zone: SafeZone) => {
    setFormData({
      name: zone.name,
      latitude: zone.latitude.toString(),
      longitude: zone.longitude.toString(),
      radius: zone.radius.toString(),
      notifications: zone.notifications,
    });
    setEditingZone(zone);
    setShowAddForm(true);
  };

  const handleDelete = (zone: SafeZone) => {
    Alert.alert('Delete Safe Zone', `Are you sure you want to delete "${zone.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSafeZone(zone.id),
      },
    ]);
  };

  const handleToggleActive = (zone: SafeZone) => {
    updateSafeZone(zone.id, { isActive: !zone.isActive });
  };

  const getCurrentLocation = () => {
    // In a real app, this would use the device's GPS
    // For demo purposes, we'll use a default location (New York City)
    setFormData((prev) => ({
      ...prev,
      latitude: '40.7128',
      longitude: '-74.0060',
    }));
    Alert.alert('Location Set', 'Current location has been set as coordinates');
  };

  const updateFormField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleNotification = (type: 'onEntry' | 'onExit') => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  return {
    showAddForm,
    editingZone,
    formData,
    openAddForm,
    resetForm,
    handleSave,
    handleEdit,
    handleDelete,
    handleToggleActive,
    getCurrentLocation,
    updateFormField,
    toggleNotification,
  };
};
