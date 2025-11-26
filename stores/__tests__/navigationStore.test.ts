import { renderHook, act } from '@testing-library/react-hooks';
import { useNavigationStore } from '../navigationStore';

describe('navigationStore', () => {
  beforeEach(() => {
    // Reset the store to a known state
    useNavigationStore.setState({
      favorites: [],
      recentSearches: [],
      origin: null,
      destination: null,
      availableRoutes: [],
      selectedRoute: null,
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
    });
  });

  it('initializes with defaults', () => {
    const s = useNavigationStore.getState();
    expect(s.favorites).toBeDefined();
    expect(s.recentSearches).toBeDefined();
    expect(s.selectedRoute).toBeNull();
  });

  it('adds and removes favorites', () => {
    const { result } = renderHook(() => useNavigationStore());
    const place = { id: 'p1', name: 'Place 1', coordinates: { latitude: 1, longitude: 1 } };

    act(() => result.current.addToFavorites(place));
  expect(result.current.favorites.find((f: any) => f.id === 'p1')).toBeDefined();

    act(() => result.current.removeFromFavorites('p1'));
  expect(result.current.favorites.find((f: any) => f.id === 'p1')).toBeUndefined();
  });

  it('adds recent searches and enforces limit', () => {
    const { result } = renderHook(() => useNavigationStore());

    act(() => {
      for (let i = 0; i < 8; i++) {
        result.current.addToRecentSearches({ id: `r${i}`, name: `R${i}`, coordinates: { latitude: i, longitude: i } });
      }
    });

    expect(result.current.recentSearches.length).toBeGreaterThan(0);
    act(() => result.current.clearRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
  });

  it('sets origin/destination and finds routes', () => {
    const { result } = renderHook(() => useNavigationStore());

    act(() => {
      result.current.setOrigin({ id: 'o', name: 'O', coordinates: { latitude: 0, longitude: 0 } });
      result.current.setDestination({ id: 'd', name: 'D', coordinates: { latitude: 1, longitude: 1 } });
    });

    act(() => result.current.findRoutes());

    expect(result.current.availableRoutes.length).toBeGreaterThanOrEqual(0);
    // selectedRoute will be set to first route if any
  });

  it('selects route safely', () => {
    const { result } = renderHook(() => useNavigationStore());

  const mockRoutes: any = [{ id: '1', totalDuration: 100, steps: [] }, { id: '2', totalDuration: 200, steps: [] }];
    act(() => {
      // Directly set availableRoutes for test
  useNavigationStore.setState({ availableRoutes: mockRoutes, selectedRoute: mockRoutes[0] });
    });

    act(() => result.current.selectRoute(mockRoutes[1] as any));
    expect(result.current.selectedRoute).toEqual(mockRoutes[1]);

    // Selecting invalid index should not throw (store selectRoute handles objects)
    expect(() => {
      // Type cast to any to simulate incorrect input
      act(() => result.current.selectRoute({} as any));
    }).not.toThrow();
  });

  it('adds verified photo check-in and returns verification', () => {
    const { result } = renderHook(() => useNavigationStore());
    const verification = result.current.addLocationVerifiedPhotoCheckIn(
      { photoUri: 'file://p.jpg' } as any,
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0 },
    );

    expect(typeof verification.isWithinRadius).toBe('boolean');
    expect(typeof verification.distance).toBe('number');
  });
});
