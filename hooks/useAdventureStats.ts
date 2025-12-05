import { useParentalStore } from '@/stores/parentalStore';
import { useNavigationStore } from '@/stores/navigationStore';

export const useAdventureStats = () => {
  const { settings, checkInRequests, safeZones } = useParentalStore();
  const { photoCheckIns } = useNavigationStore();

  // Calculate adventure stats
  const recentMemories = photoCheckIns.slice(0, 3);
  const discoveredZones = safeZones.filter((zone) => zone.isActive).length;
  const pendingUpdates = checkInRequests.filter((req) => req.status === 'pending').length;
  const adventureBuddies = settings.emergencyContacts.length;

  return {
    recentMemories,
    discoveredZones,
    pendingUpdates,
    adventureBuddies,
  };
};
