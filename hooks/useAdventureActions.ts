import { Alert } from 'react-native';
import { logger } from '@/utils/logger';

export const useAdventureActions = () => {
  const handleGetHelp = () => {
    Alert.alert('Need Help?', 'Choose who to contact:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call 911',
        style: 'destructive',
        onPress: () => logger.info('Emergency call initiated', { type: '911', context: 'AdventureHub' })
      },
      {
        text: 'Call My Crew',
        onPress: () => logger.info('Emergency call initiated', { type: 'crew', context: 'AdventureHub' })
      },
    ]);
  };

  const handleShareUpdate = () => {
    Alert.alert('Share Update', "Let your crew know you're having fun?", [
      { text: 'Not now', style: 'cancel' },
      {
        text: "I'm Having Fun!",
        onPress: () => logger.info('Fun update sent to crew', { timestamp: Date.now() })
      },
    ]);
  };

  const handleCaptureMemory = (placeName?: string) => {
    logger.info('Photo memory capture triggered', { place: placeName });
  };

  const handleShareAdventure = (location?: { latitude: number; longitude: number }) => {
    logger.info('Share adventure location triggered', { location });
  };

  const handleNavigateToZones = (zonesCount: number) => {
    logger.info('Navigate to exploration zones requested', { zonesCount });
  };

  const handleNavigateToMemories = (memoriesCount: number) => {
    logger.info('Navigate to memory gallery requested', { memoriesCount });
  };

  const handleNavigateToCrew = (crewCount: number) => {
    logger.info('Navigate to adventure crew requested', { crewCount });
  };

  return {
    handleGetHelp,
    handleShareUpdate,
    handleCaptureMemory,
    handleShareAdventure,
    handleNavigateToZones,
    handleNavigateToMemories,
    handleNavigateToCrew,
  };
};
