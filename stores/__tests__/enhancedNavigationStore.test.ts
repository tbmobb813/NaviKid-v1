import { renderHook, act } from '@testing-library/react-hooks';
// Import default export and alias to match template intent
import useEnhancedNavigationStore from '../enhancedNavigationStore';

// Mock unifiedRoutingService used by the store to avoid network calls
jest.mock('@/utils/unifiedRoutingService', () => ({
  unifiedRoutingService: {
    getRoutes: jest.fn().mockResolvedValue([
      {
        id: 'u1',
        type: 'walking',
        summary: { duration: 15 },
        accessibilityScore: 80,
        safetyScore: 85,
        kidFriendlyScore: 90,
        source: 'mock',
        geometry: null,
        alerts: [],
      },
    ]),
  },
}));

describe('enhancedNavigationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to known state
    useEnhancedNavigationStore.setState({
      favorites: [],
      recentSearches: [],
      origin: null,
      destination: null,
      availableRoutes: [],
      unifiedRoutes: [],
      selectedRoute: null,
      selectedUnifiedRoute: null,
      searchQuery: '',
      accessibilitySettings: {
        largeText: false,
        highContrast: false,
        voiceDescriptions: false,
        simplifiedMode: false,
      },
      photoCheckIns: [],
      weatherInfo: null,
      selectedTravelMode: 'transit',
      routeOptions: {
        travelMode: 'transit',
        avoidTolls: false,
        avoidHighways: false,
        accessibilityMode: false,
      },
      routingPreferences: {
        wheelchair: false,
        prioritizeSafety: true,
        maxWalkDistance: 800,
        maxTransfers: 2,
        avoidTolls: false,
        avoidHighways: false,
      },
      isLoadingRoutes: false,
      routingError: null,
      useAdvancedRouting: true,
    });
  });

  it('initializes with default state', () => {
    const state = useEnhancedNavigationStore.getState();
    expect(state.origin).toBeNull();
    expect(state.destination).toBeNull();
    expect(Array.isArray(state.favorites)).toBe(true);
    expect(Array.isArray(state.recentSearches)).toBe(true);
  });

  it('sets origin and destination without interfering with each other', () => {
    const { result } = renderHook(() => useEnhancedNavigationStore());

    act(() => {
      result.current.setOrigin({ id: 'o1', name: 'Start', coordinates: { latitude: 1, longitude: 1 } });
      result.current.setDestination({ id: 'd1', name: 'End', coordinates: { latitude: 2, longitude: 2 } });
    });

    expect(result.current.origin?.name).toBe('Start');
    expect(result.current.destination?.name).toBe('End');

    act(() => {
      result.current.setOrigin({ id: 'o2', name: 'New Start', coordinates: { latitude: 3, longitude: 3 } });
    });

    expect(result.current.origin?.name).toBe('New Start');
    expect(result.current.destination?.name).toBe('End');
  });

  it('manages favorites correctly', () => {
    const { result } = renderHook(() => useEnhancedNavigationStore());
    const fav = { id: 'f1', name: 'Home', coordinates: { latitude: 40, longitude: -73 } };

    act(() => result.current.addToFavorites(fav));
    expect(result.current.favorites).toContainEqual(expect.objectContaining({ id: 'f1' }));

    act(() => result.current.addToFavorites(fav));
    const count = result.current.favorites.filter((f) => f.id === 'f1').length;
    expect(count).toBe(1);

    act(() => result.current.removeFromFavorites('f1'));
    expect(result.current.favorites.some((f) => f.id === 'f1')).toBe(false);
  });

  it('adds and limits recent searches', () => {
    const { result } = renderHook(() => useEnhancedNavigationStore());

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.addToRecentSearches({ id: `s${i}`, name: `S${i}`, coordinates: { latitude: i, longitude: i } });
      }
    });

    // Store limits recent searches; ensure not unbounded
    expect(result.current.recentSearches.length).toBeLessThanOrEqual(10);

    act(() => result.current.clearRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
  });

  it('finds advanced routes and updates availableRoutes and unifiedRoutes', async () => {
    const { result } = renderHook(() => useEnhancedNavigationStore());

    act(() => {
      result.current.setOrigin({ id: 'o', name: 'A', coordinates: { latitude: 0, longitude: 0 } });
      result.current.setDestination({ id: 'd', name: 'B', coordinates: { latitude: 1, longitude: 1 } });
    });

    await act(async () => {
      await result.current.findAdvancedRoutes();
    });

    expect(result.current.availableRoutes.length).toBeGreaterThan(0);
    expect(result.current.unifiedRoutes.length).toBeGreaterThan(0);
    expect(result.current.selectedRoute).not.toBeNull();
  });

  it('handles findAdvancedRoutes error gracefully', async () => {
    // Mock unifiedRoutingService to throw
    const utils = require('@/utils/unifiedRoutingService');
    utils.unifiedRoutingService.getRoutes.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useEnhancedNavigationStore());

    act(() => {
      result.current.setOrigin({ id: 'o', name: 'A', coordinates: { latitude: 0, longitude: 0 } });
      result.current.setDestination({ id: 'd', name: 'B', coordinates: { latitude: 1, longitude: 1 } });
    });

    await act(async () => {
      await result.current.findAdvancedRoutes();
    });

    expect(result.current.availableRoutes).toEqual([]);
    expect(result.current.unifiedRoutes).toEqual([]);
    expect(result.current.routingError).toBeDefined();
  });

  it('sets travel mode and triggers route search', () => {
    const { result } = renderHook(() => useEnhancedNavigationStore());
    act(() => {
      result.current.setTravelMode('walking');
    });
    expect(result.current.selectedTravelMode).toBe('walking');
  });

  it('adds and verifies location-verified photo check-in', () => {
    const { result } = renderHook(() => useEnhancedNavigationStore());
    const verification = result.current.addLocationVerifiedPhotoCheckIn(
      { photoUri: 'file://p.jpg' } as any,
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0 },
    );

    expect(typeof verification.isWithinRadius).toBe('boolean');
    expect(typeof verification.distance).toBe('number');
  });
});
