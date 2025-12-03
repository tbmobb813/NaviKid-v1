import { Alert } from 'react-native';
import { useRegionStore } from '@/stores/regionStore';

export const useRegionActions = () => {
  const { currentRegion, removeRegion } = useRegionStore();

  const handleDeleteRegion = (regionId: string) => {
    if (regionId === currentRegion.id) {
      Alert.alert('Cannot Delete', 'You cannot delete the currently selected region.');
      return;
    }

    Alert.alert(
      'Delete Region',
      'Are you sure you want to delete this region? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeRegion(regionId),
        },
      ],
    );
  };

  const handleUpdateTransitData = (regionId: string) => {
    Alert.alert(
      'Update Transit Data',
      "This would typically connect to the region's transit API to fetch the latest schedules and route information.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            // In a real app, this would make API calls to update transit data
            Alert.alert('Success', 'Transit data updated successfully!');
          },
        },
      ],
    );
  };

  return {
    handleDeleteRegion,
    handleUpdateTransitData,
  };
};
