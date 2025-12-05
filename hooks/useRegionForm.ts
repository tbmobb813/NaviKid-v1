import { useState } from 'react';
import { Alert } from 'react-native';
import { RegionConfig } from '@/types/region';

export const useRegionForm = (
  initialRegion?: RegionConfig | null,
  onSave?: (region: RegionConfig) => void,
) => {
  const [formData, setFormData] = useState<Partial<RegionConfig>>({
    id: initialRegion?.id || '',
    name: initialRegion?.name || '',
    country: initialRegion?.country || 'United States',
    timezone: initialRegion?.timezone || 'America/New_York',
    currency: initialRegion?.currency || 'USD',
    language: initialRegion?.language || 'en',
    coordinates: initialRegion?.coordinates || { latitude: 0, longitude: 0 },
    emergencyNumber: initialRegion?.emergencyNumber || '911',
    transitApiEndpoint: initialRegion?.transitApiEndpoint || '',
    mapStyle: initialRegion?.mapStyle || 'standard',
    transitSystems: initialRegion?.transitSystems || [],
    safetyTips: initialRegion?.safetyTips || [],
    funFacts: initialRegion?.funFacts || [],
    popularPlaces: initialRegion?.popularPlaces || [],
  });

  const updateField = (field: keyof RegionConfig, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateAndSave = () => {
    if (!formData.id || !formData.name || !formData.country) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return false;
    }

    if (onSave) {
      onSave(formData as RegionConfig);
    }
    return true;
  };

  return {
    formData,
    updateField,
    validateAndSave,
  };
};
