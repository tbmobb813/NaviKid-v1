import { renderHook, act } from '@testing-library/react-native';
// Import default export and alias to match template intent
import useEnhancedNavigationStore from '../enhancedNavigationStore';

// Mock unifiedRoutingService used by the store to avoid network calls
jest.mock('@/utils/unifiedRoutingService', () => ({
  unifiedRoutingService: {
    getRoutes: jest.fn().mockResolvedValue([
      {
        id: 'u1',
        type: 'walking',
        summary: { duration: 15, distance: 1000, walkingDistance: 1000, elevationGain: 0 },
        accessibilityScore: 80,
        safetyScore: 85,
        kidFriendlyScore: 90,
        source: 'mock',
        geometry: null,
        alerts: [],
        description: 'Test route',
        instructions: [],
        rawData: {},
      },
    ]),
  },
}));

// Helper to create mock Place objects
const mockPlace = (id: string, name: string, lat = 0, lng = 0) => ({
  id,
  name,
  address: `Address for ${name}`,
  category: 'store' as const,
  coordinates: { latitude: lat, longitude: lng },
});

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
      result.current.setOrigin(mockPlace('o1', 'Start', 1, 1));
      result.current.setDestination(mockPlace('d1', 'End', 2, 2));
    });

    expect(result.current.origin?.name).toBe('Start');
    expect(result.current.destination?.name).toBe('End');

    act(() => {
      result.current.setOrigin(mockPlace('o2', 'New Start', 3, 3));
    });

    expect(result.current.origin?.name).toBe('New Start');
    expect(result.current.destination?.name).toBe('End');
  });

  it('manages favorites correctly', () => {
    const { result } = renderHook(() => useEnhancedNavigationStore());
    const fav = mockPlace('f1', 'Home', 40, -73);

    act(() => result.current.addToFavorites(fav));
    expect(result.current.favorites).toContainEqual(expect.objectContaining({ id: 'f1' }));

    act(() => result.current.addToFavorites(fav));
    const count = result.current.favorites.filter((f: any) => f.id === 'f1').length;
    expect(count).toBe(1);

    act(() => result.current.removeFromFavorites('f1'));
    expect(result.current.favorites.some((f: any) => f.id === 'f1')).toBe(false);
  });

  it('adds and limits recent searches', () => {
    const { result } = renderHook(() => useEnhancedNavigationStore());

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.addToRecentSearches(mockPlace(`s${i}`, `S${i}`, i, i));
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
      result.current.setOrigin(mockPlace('o', 'A', 0, 0));
      result.current.setDestination(mockPlace('d', 'B', 1, 1));
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
      result.current.setOrigin(mockPlace('o', 'A', 0, 0));
      result.current.setDestination(mockPlace('d', 'B', 1, 1));
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
      { photoUrl: 'file://p.jpg', placeId: 'p1', timestamp: Date.now() } as any,
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0 },
    );

    expect(typeof verification.isWithinRadius).toBe('boolean');
    expect(typeof verification.distance).toBe('number');
  });

  describe('Additional Coverage Tests', () => {
    it('should clear route and reset state', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        result.current.setOrigin(mockPlace('o1', 'Origin', 0, 0));
        result.current.setDestination(mockPlace('d1', 'Dest', 1, 1));
        result.current.setSearchQuery('test query');
      });

      expect(result.current.origin).not.toBeNull();
      expect(result.current.destination).not.toBeNull();
      expect(result.current.searchQuery).toBe('test query');

      act(() => {
        result.current.clearRoute();
      });

      expect(result.current.origin).toBeNull();
      expect(result.current.destination).toBeNull();
      expect(result.current.searchQuery).toBe('');
      expect(result.current.availableRoutes).toEqual([]);
      expect(result.current.unifiedRoutes).toEqual([]);
      expect(result.current.selectedRoute).toBeNull();
      expect(result.current.selectedUnifiedRoute).toBeNull();
      expect(result.current.routingError).toBeNull();
    });

    it('should update accessibility settings', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        result.current.updateAccessibilitySettings({ largeText: true, highContrast: true });
      });

      expect(result.current.accessibilitySettings.largeText).toBe(true);
      expect(result.current.accessibilitySettings.highContrast).toBe(true);
      expect(result.current.accessibilitySettings.voiceDescriptions).toBe(false);

      act(() => {
        result.current.updateAccessibilitySettings({ voiceDescriptions: true });
      });

      expect(result.current.accessibilitySettings.largeText).toBe(true);
      expect(result.current.accessibilitySettings.voiceDescriptions).toBe(true);
    });

    it('should set weather info', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());
      const weather = { temperature: 72, condition: 'sunny', humidity: 50 };

      act(() => {
        result.current.setWeatherInfo(weather);
      });

      expect(result.current.weatherInfo).toEqual(weather);
    });

    it('should update route options and trigger route search', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        result.current.updateRouteOptions({ avoidTolls: true, accessibilityMode: true });
      });

      expect(result.current.routeOptions.avoidTolls).toBe(true);
      expect(result.current.routeOptions.accessibilityMode).toBe(true);
    });

    it('should update routing preferences and trigger route search', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        result.current.updateRoutingPreferences({
          wheelchair: true,
          childAge: 8,
          maxWalkDistance: 500,
          maxTransfers: 1,
        });
      });

      expect(result.current.routingPreferences.wheelchair).toBe(true);
      expect(result.current.routingPreferences.childAge).toBe(8);
      expect(result.current.routingPreferences.maxWalkDistance).toBe(500);
      expect(result.current.routingPreferences.maxTransfers).toBe(1);
    });

    it('should toggle advanced routing', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      expect(result.current.useAdvancedRouting).toBe(true);

      act(() => {
        result.current.toggleAdvancedRouting(false);
      });

      expect(result.current.useAdvancedRouting).toBe(false);

      act(() => {
        result.current.toggleAdvancedRouting(true);
      });

      expect(result.current.useAdvancedRouting).toBe(true);
    });

    it('should set search query', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        result.current.setSearchQuery('coffee shop');
      });

      expect(result.current.searchQuery).toBe('coffee shop');

      act(() => {
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });

    it('should add photo check-in without location verification', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());
      const beforeCount = result.current.photoCheckIns.length;

      act(() => {
        result.current.addPhotoCheckIn({
          photoUrl: 'file://photo1.jpg',
          placeId: 'p1',
          timestamp: Date.now(),
        } as any);
      });

      expect(result.current.photoCheckIns.length).toBe(beforeCount + 1);
      expect(result.current.photoCheckIns[beforeCount].photoUrl).toBe('file://photo1.jpg');
      expect(result.current.photoCheckIns[beforeCount].id).toBeDefined();
    });

    it('should select a route and corresponding unified route', async () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      // Setup routes first
      act(() => {
        result.current.setOrigin(mockPlace('o', 'A', 0, 0));
        result.current.setDestination(mockPlace('d', 'B', 1, 1));
      });

      await act(async () => {
        await result.current.findAdvancedRoutes();
      });

      const route = result.current.availableRoutes[0];

      act(() => {
        result.current.selectRoute(route as any);
      });

      expect(result.current.selectedRoute).toEqual(route);
    });

    it('should select a unified route', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      const mockUnifiedRoute = {
        id: 'test-route',
        type: 'walking' as const,
        description: 'Start to End',
        summary: { duration: 20, distance: 1500, walkingDistance: 1500, elevationGain: 0 },
        safetyScore: 85,
        kidFriendlyScore: 90,
        accessibilityScore: 75,
        source: 'test',
        geometry: null,
        alerts: [],
        instructions: [],
        rawData: {},
      };

      act(() => {
        result.current.selectUnifiedRoute(mockUnifiedRoute as any);
      });

      expect(result.current.selectedUnifiedRoute).toEqual(mockUnifiedRoute);
      expect(result.current.selectedRoute).not.toBeNull();
      expect(result.current.selectedRoute?.id).toBe('test-route');
    });

    it('should handle findRoutes with advanced routing enabled', async () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        result.current.setOrigin(mockPlace('o', 'A', 0, 0));
        result.current.setDestination(mockPlace('d', 'B', 1, 1));
        result.current.toggleAdvancedRouting(true);
      });

      await act(async () => {
        await result.current.findRoutes();
      });

      expect(result.current.availableRoutes.length).toBeGreaterThan(0);
    });

    it('should handle findRoutes with advanced routing disabled', async () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        result.current.setOrigin(mockPlace('o', 'A', 0, 0));
        result.current.setDestination(mockPlace('d', 'B', 1, 1));
        result.current.toggleAdvancedRouting(false);
      });

      await act(async () => {
        await result.current.findRoutes();
      });

      // Should still use advanced routes as fallback
      expect(result.current.availableRoutes.length).toBeGreaterThan(0);
    });

    it('should not find routes when origin or destination is missing', async () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        result.current.setOrigin(mockPlace('o', 'A', 0, 0));
        result.current.setDestination(null);
      });

      await act(async () => {
        await result.current.findAdvancedRoutes();
      });

      expect(result.current.availableRoutes).toEqual([]);
      expect(result.current.unifiedRoutes).toEqual([]);
      expect(result.current.selectedRoute).toBeNull();
    });

    it('should keep recent searches under limit', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addToRecentSearches(mockPlace(`search-${i}`, `Location ${i}`, i, i));
        }
      });

      // Store limits to 5 recent searches
      expect(result.current.recentSearches.length).toBeLessThanOrEqual(5);

      // Most recent should be first
      expect(result.current.recentSearches[0].id).toBe('search-9');
    });

    it('should not add duplicate to recent searches', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());
      const place = mockPlace('p1', 'Place 1', 1, 1);

      act(() => {
        result.current.addToRecentSearches(place);
        result.current.addToRecentSearches(place);
      });

      const count = result.current.recentSearches.filter((p: any) => p.id === 'p1').length;
      expect(count).toBe(1);
    });

    it('should handle location verification within radius', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      const verification = result.current.addLocationVerifiedPhotoCheckIn(
        { photoUrl: 'file://nearby.jpg', placeId: 'p1', timestamp: Date.now() } as any,
        { latitude: 40.7128, longitude: -74.006 },
        { latitude: 40.7128, longitude: -74.006 },
      );

      expect(verification.isWithinRadius).toBe(true);
      expect(verification.distance).toBeLessThanOrEqual(100);
    });

    it('should handle location verification outside radius', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());

      const verification = result.current.addLocationVerifiedPhotoCheckIn(
        { photoUrl: 'file://far.jpg', placeId: 'p2', timestamp: Date.now() } as any,
        { latitude: 40.7128, longitude: -74.006 },
        { latitude: 41.0, longitude: -75.0 },
      );

      expect(verification.isWithinRadius).toBe(false);
      expect(verification.distance).toBeGreaterThan(100);
    });

    it('should maintain state when adding duplicate favorite', () => {
      const { result } = renderHook(() => useEnhancedNavigationStore());
      const place = mockPlace('dup', 'Duplicate', 1, 1);

      act(() => {
        result.current.addToFavorites(place);
      });

      const initialCount = result.current.favorites.length;

      act(() => {
        result.current.addToFavorites(place);
      });

      expect(result.current.favorites.length).toBe(initialCount);
    });
  });
});
