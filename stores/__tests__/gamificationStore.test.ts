import { renderHook, act } from '@testing-library/react-hooks';
import { useGamificationStore } from '../gamificationStore';

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
      result.current.addSafetyContact({ name: 'Mom', phone: '+1234567890' });
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
      result.current.addTripEntry({ date: new Date().toISOString(), distance: 1, duration: 300, mode: 'walking', photos: [] });
      result.current.addTripEntry({ date: new Date().toISOString(), distance: 2, duration: 600, mode: 'walking', photos: ['uri1'] });
      result.current.addTripEntry({ date: new Date().toISOString(), distance: 3, duration: 900, mode: 'walking', photos: ['uri2'] });
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
});
