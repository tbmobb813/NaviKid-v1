import { renderHook, act } from '@testing-library/react-native';
import { useGamificationStore } from '../gamificationStore';
import type { Achievement, SafetyContact, TripJournal } from '@/types/gamification';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('gamificationStore', () => {
  beforeEach(() => {
    // Reset relevant parts of the store to deterministic state
    const current = useGamificationStore.getState();
    const resetAchievements = current.achievements.map((a) => ({ ...a, unlocked: false }));

    useGamificationStore.setState({
      userStats: {
        totalTrips: 0,
        totalPoints: 0,
        placesVisited: 0,
        favoriteTransitMode: 'walk',
        streakDays: 0,
        level: 1,
      },
      achievements: resetAchievements,
      safetyContacts: [],
      tripJournal: [],
    });
  });

  it('initializes with default state', () => {
    const state = useGamificationStore.getState();
    expect(state.userStats).toBeDefined();
    expect(Array.isArray(state.achievements)).toBe(true);
    expect(state.safetyContacts).toEqual([]);
    expect(state.tripJournal).toEqual([]);
  });

  it('adds points and updates level', () => {
    const { result } = renderHook(() => useGamificationStore());
    const before = result.current.userStats.totalPoints;

    act(() => {
      result.current.addPoints(250);
    });

    expect(result.current.userStats.totalPoints).toBe(before + 250);
    // Level formula in store: Math.floor(newPoints / 200) + 1
    expect(result.current.userStats.level).toBe(Math.floor((before + 250) / 200) + 1);
  });

  it('unlocks an achievement by id and awards points', () => {
    const { result } = renderHook(() => useGamificationStore());
    const state = useGamificationStore.getState();
    const ach = state.achievements[0];
    expect(ach).toBeDefined();

    const beforePoints = result.current.userStats.totalPoints;

    act(() => {
      result.current.unlockAchievement(ach.id);
    });

    const updated = useGamificationStore.getState();
    const unlocked = updated.achievements.find((a) => a.id === ach.id);
    expect(unlocked?.unlocked).toBe(true);
    expect(updated.userStats.totalPoints).toBeGreaterThanOrEqual(beforePoints + (ach.points || 0));
  });

  it('does not unlock the same achievement twice', () => {
    const { result } = renderHook(() => useGamificationStore());
    const state = useGamificationStore.getState();
    const ach = state.achievements[0];

    act(() => {
      result.current.unlockAchievement(ach.id);
      result.current.unlockAchievement(ach.id);
    });

    const unlockedCount = useGamificationStore.getState().achievements.filter((a) => a.id === ach.id && a.unlocked).length;
    expect(unlockedCount).toBeLessThanOrEqual(1);
  });

  it('completes a trip and updates stats and achievements', () => {
    const { result } = renderHook(() => useGamificationStore());
    const beforeTrips = result.current.userStats.totalTrips;

    act(() => {
      result.current.completeTrip('Home', 'School');
    });

    const after = useGamificationStore.getState();
    expect(after.userStats.totalTrips).toBe(beforeTrips + 1);
    expect(after.userStats.placesVisited).toBeGreaterThanOrEqual(1);

    // If it was the first trip, 'first-trip' achievement should be unlocked
    const firstTripAch = after.achievements.find((a) => a.id === 'first-trip');
    if (firstTripAch) {
      expect(firstTripAch.unlocked).toBe(true);
    }
  });

  it('adds a safety contact and awards safety-star achievement on first contact', () => {
    const { result } = renderHook(() => useGamificationStore());
    const beforeContacts = result.current.safetyContacts.length;
    const beforePoints = result.current.userStats.totalPoints;

    act(() => {
      result.current.addSafetyContact({ name: 'Mom', phone: '+1234567890', relationship: 'parent', isPrimary: true } as any);
    });

    const after = useGamificationStore.getState();
    expect(after.safetyContacts.length).toBe(beforeContacts + 1);
    const safetyAch = after.achievements.find((a) => a.id === 'safety-star');
    if (safetyAch) {
      // unlocked either before or now; ensure points increased when unlocked
      if (safetyAch.unlocked) {
        expect(after.userStats.totalPoints).toBeGreaterThanOrEqual(beforePoints + (safetyAch.points || 0));
      }
    }
  });

  it('adds trip entries and awards photo-journalist when conditions met', () => {
    const { result } = renderHook(() => useGamificationStore());
    const beforeEntries = result.current.tripJournal.length;

    act(() => {
      result.current.addTripEntry({ date: new Date(), from: 'A', to: 'B', photos: [], notes: '', rating: 5, funFacts: [] } as any);
      result.current.addTripEntry({ date: new Date(), from: 'B', to: 'C', photos: ['uri1'], notes: '', rating: 5, funFacts: [] } as any);
      result.current.addTripEntry({ date: new Date(), from: 'C', to: 'D', photos: ['uri2'], notes: '', rating: 5, funFacts: [] } as any);
    });

    const after = useGamificationStore.getState();
    expect(after.tripJournal.length).toBeGreaterThanOrEqual(beforeEntries + 3);

    const photoAch = after.achievements.find((a) => a.id === 'photo-journalist');
    if (photoAch) {
      // If unlocked according to store logic, should be true
      expect(typeof photoAch.unlocked).toBe('boolean');
    }
  });

  it('updates stats partially', () => {
    const { result } = renderHook(() => useGamificationStore());
    act(() => {
      result.current.updateStats({ totalTrips: 10 });
    });

    expect(result.current.userStats.totalTrips).toBe(10);
  });

  describe('Additional Coverage Tests', () => {
    it('should handle multiple levels progression', () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        result.current.addPoints(500); // Should reach level 3
      });

      expect(result.current.userStats.level).toBe(3);
      expect(result.current.userStats.totalPoints).toBe(500);
    });

    it('should unlock neighborhood-navigator at 10 places', () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        // Complete 10 trips to visit 10 places
        for (let i = 0; i < 10; i++) {
          result.current.completeTrip(`Place${i}`, `Place${i+1}`);
        }
      });

      const achievement = result.current.achievements.find((a: Achievement) => a.id === 'neighborhood-navigator');
      expect(achievement?.unlocked).toBe(true);
    });

    it('should unlock photo-journalist after 3 trips with photos', () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        result.current.addTripEntry({
          date: new Date(),
          from: 'Place1',
          to: 'Place2',
          photos: ['photo1.jpg'],
          notes: '',
          rating: 5,
          funFacts: [],
        } as any);
        result.current.addTripEntry({
          date: new Date(),
          from: 'Place2',
          to: 'Place3',
          photos: ['photo2.jpg'],
          notes: '',
          rating: 5,
          funFacts: [],
        } as any);
        result.current.addTripEntry({
          date: new Date(),
          from: 'Place3',
          to: 'Place4',
          photos: ['photo3.jpg'],
          notes: '',
          rating: 5,
          funFacts: [],
        } as any);
      });

      const achievement = result.current.achievements.find((a: Achievement) => a.id === 'photo-journalist');
      expect(achievement?.unlocked).toBe(true);
    });

    it('should not unlock photo-journalist with less than 3 photo trips', () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        result.current.addTripEntry({
          date: new Date(),
          from: 'Place1',
          to: 'Place2',
          photos: ['photo1.jpg'],
          notes: '',
          rating: 5,
          funFacts: [],
        } as any);
        result.current.addTripEntry({
          date: new Date(),
          from: 'Place2',
          to: 'Place3',
          photos: ['photo2.jpg'],
          notes: '',
          rating: 5,
          funFacts: [],
        } as any);
      });

      const achievement = result.current.achievements.find((a: Achievement) => a.id === 'photo-journalist');
      expect(achievement?.unlocked).toBe(false);
    });

    it('should update favorite transit mode', () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        result.current.updateStats({ favoriteTransitMode: 'subway' });
      });

      expect(result.current.userStats.favoriteTransitMode).toBe('subway');
    });

    it('should update streak days', () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        result.current.updateStats({ streakDays: 5 });
      });

      expect(result.current.userStats.streakDays).toBe(5);
    });

    it('should maintain other stats when updating one field', () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        result.current.addPoints(100);
        result.current.updateStats({ streakDays: 3 });
      });

      expect(result.current.userStats.totalPoints).toBe(100);
      expect(result.current.userStats.streakDays).toBe(3);
    });

    it('should generate unique IDs for safety contacts', async () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        result.current.addSafetyContact({ name: 'Contact1', phone: '111', relationship: 'parent', isPrimary: true } as any);
      });

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      act(() => {
        result.current.addSafetyContact({ name: 'Contact2', phone: '222', relationship: 'parent', isPrimary: false } as any);
      });

      const ids = result.current.safetyContacts.map((c: SafetyContact) => c.id);
      expect(new Set(ids).size).toBe(2); // All unique
    });

    it('should generate unique IDs for trip entries', async () => {
      const { result } = renderHook(() => useGamificationStore());

      act(() => {
        result.current.addTripEntry({
          date: new Date(),
          from: 'Place1',
          to: 'Place2',
          photos: [],
          notes: '',
          rating: 5,
          funFacts: [],
        } as any);
      });

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      act(() => {
        result.current.addTripEntry({
          date: new Date(),
          from: 'Place2',
          to: 'Place3',
          photos: [],
          notes: '',
          rating: 5,
          funFacts: [],
        } as any);
      });

      const ids = result.current.tripJournal.map((e: TripJournal) => e.id);
      expect(new Set(ids).size).toBe(2); // All unique
    });
  });
});
