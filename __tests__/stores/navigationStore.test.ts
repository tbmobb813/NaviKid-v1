/**
 * Comprehensive Tests for Navigation Store
 */

import { useNavigationStore } from '../../stores/navigationStore';
import { Place } from '../../types/navigation';

// Mock dependencies
jest.mock('../../mocks/places', () => ({
  favoriteLocations: [
    {
      id: 'mock-favorite-1',
      name: 'Mock Favorite',
      address: '123 Mock St',
      category: 'home',
      coordinates: { latitude: 40.7128, longitude: -74.006 },
      isFavorite: true,
    },
  ],
}));

jest.mock('../../mocks/transit', () => ({
  sampleRoutes: [
    {
      id: 'route-1',
      steps: [],
      totalDuration: 30,
      departureTime: '10:00 AM',
      arrivalTime: '10:30 AM',
    },
  ],
}));

jest.mock('../../utils/locationUtils', () => ({
  verifyLocationProximity: jest.fn((lat1, lon1, lat2, lon2, radius) => ({
    isWithinRadius: true,
    distance: 50,
  })),
}));

describe('Navigation Store', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useNavigationStore.getState();
    store.clearRoute();
    store.clearRecentSearches();
    useNavigationStore.setState({
      favorites: [
        {
          id: 'mock-favorite-1',
          name: 'Mock Favorite',
          address: '123 Mock St',
          category: 'home',
          coordinates: { latitude: 40.7128, longitude: -74.006 },
          isFavorite: true,
        },
      ],
      photoCheckIns: [],
      weatherInfo: null,
      selectedTravelMode: 'transit',
      accessibilitySettings: {
        largeText: false,
        highContrast: false,
        voiceDescriptions: false,
        simplifiedMode: false,
      },
    });
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const store = useNavigationStore.getState();

      expect(store.origin).toBe(null);
      expect(store.destination).toBe(null);
      expect(store.availableRoutes).toEqual([]);
      expect(store.selectedRoute).toBe(null);
      expect(store.searchQuery).toBe('');
      expect(store.selectedTravelMode).toBe('transit');
      expect(store.recentSearches).toEqual([]);
      expect(store.photoCheckIns).toEqual([]);
      expect(store.weatherInfo).toBe(null);
    });

    it('should initialize accessibility settings to false', () => {
      const store = useNavigationStore.getState();

      expect(store.accessibilitySettings).toEqual({
        largeText: false,
        highContrast: false,
        voiceDescriptions: false,
        simplifiedMode: false,
      });
    });

    it('should initialize with favorite locations from mock', () => {
      const store = useNavigationStore.getState();

      expect(store.favorites.length).toBeGreaterThan(0);
      expect(store.favorites[0].id).toBe('mock-favorite-1');
    });
  });

  describe('Origin and Destination', () => {
    const mockOrigin: Place = {
      id: 'origin-1',
      name: 'Origin Place',
      address: '100 Origin St',
      category: 'home',
      coordinates: { latitude: 40.7128, longitude: -74.006 },
    };

    const mockDestination: Place = {
      id: 'dest-1',
      name: 'Destination Place',
      address: '200 Dest Ave',
      category: 'restaurant',
      coordinates: { latitude: 40.7505, longitude: -73.9934 },
    };

    it('should set origin', () => {
      const { setOrigin } = useNavigationStore.getState();

      setOrigin(mockOrigin);

      const store = useNavigationStore.getState();
      expect(store.origin).toEqual(mockOrigin);
    });

    it('should set destination', () => {
      const { setDestination } = useNavigationStore.getState();

      setDestination(mockDestination);

      const store = useNavigationStore.getState();
      expect(store.destination).toEqual(mockDestination);
    });

    it('should allow clearing origin by passing null', () => {
      const { setOrigin } = useNavigationStore.getState();

      setOrigin(mockOrigin);
      setOrigin(null);

      const store = useNavigationStore.getState();
      expect(store.origin).toBe(null);
    });
  });

  describe('Favorites', () => {
    const newPlace: Place = {
      id: 'new-fav-1',
      name: 'New Favorite',
      address: '300 New St',
      category: 'park',
      coordinates: { latitude: 40.7589, longitude: -73.9851 },
    };

    it('should add a place to favorites', () => {
      const { addToFavorites } = useNavigationStore.getState();

      addToFavorites(newPlace);

      const store = useNavigationStore.getState();
      expect(store.favorites).toHaveLength(2);
      expect(store.favorites[1].id).toBe('new-fav-1');
      expect(store.favorites[1].isFavorite).toBe(true);
    });

    it('should not add duplicate favorites', () => {
      const { addToFavorites } = useNavigationStore.getState();

      addToFavorites(newPlace);
      addToFavorites(newPlace);

      const store = useNavigationStore.getState();
      expect(store.favorites).toHaveLength(2); // Should still be 2, not 3
    });

    it('should remove a place from favorites', () => {
      const { addToFavorites, removeFromFavorites } = useNavigationStore.getState();

      addToFavorites(newPlace);
      removeFromFavorites('new-fav-1');

      const store = useNavigationStore.getState();
      expect(store.favorites).toHaveLength(1);
      expect(store.favorites.find((p) => p.id === 'new-fav-1')).toBeUndefined();
    });
  });

  describe('Recent Searches', () => {
    const place1: Place = {
      id: 'search-1',
      name: 'Search 1',
      address: '1 Search St',
      category: 'other',
      coordinates: { latitude: 40.7, longitude: -74.0 },
    };

    const place2: Place = {
      id: 'search-2',
      name: 'Search 2',
      address: '2 Search St',
      category: 'other',
      coordinates: { latitude: 40.71, longitude: -74.01 },
    };

    it('should add to recent searches', () => {
      const { addToRecentSearches } = useNavigationStore.getState();

      addToRecentSearches(place1);

      const store = useNavigationStore.getState();
      expect(store.recentSearches).toHaveLength(1);
      expect(store.recentSearches[0].id).toBe('search-1');
    });

    it('should add new searches to the beginning', () => {
      const { addToRecentSearches } = useNavigationStore.getState();

      addToRecentSearches(place1);
      addToRecentSearches(place2);

      const store = useNavigationStore.getState();
      expect(store.recentSearches[0].id).toBe('search-2');
      expect(store.recentSearches[1].id).toBe('search-1');
    });

    it('should remove duplicates when adding to recent searches', () => {
      const { addToRecentSearches } = useNavigationStore.getState();

      addToRecentSearches(place1);
      addToRecentSearches(place2);
      addToRecentSearches(place1); // Add place1 again

      const store = useNavigationStore.getState();
      expect(store.recentSearches).toHaveLength(2);
      expect(store.recentSearches[0].id).toBe('search-1'); // Should be at front now
    });

    it('should limit recent searches to 5 items', () => {
      const { addToRecentSearches } = useNavigationStore.getState();

      for (let i = 1; i <= 7; i++) {
        addToRecentSearches({
          id: `search-${i}`,
          name: `Search ${i}`,
          address: `${i} Search St`,
          category: 'other',
          coordinates: { latitude: 40.7, longitude: -74.0 },
        });
      }

      const store = useNavigationStore.getState();
      expect(store.recentSearches).toHaveLength(5);
      expect(store.recentSearches[0].id).toBe('search-7'); // Most recent
      expect(store.recentSearches[4].id).toBe('search-3'); // Oldest kept
    });

    it('should clear recent searches', () => {
      const { addToRecentSearches, clearRecentSearches } = useNavigationStore.getState();

      addToRecentSearches(place1);
      addToRecentSearches(place2);
      clearRecentSearches();

      const store = useNavigationStore.getState();
      expect(store.recentSearches).toEqual([]);
    });
  });

  describe('Route Finding', () => {
    const origin: Place = {
      id: 'origin-1',
      name: 'Home',
      address: '100 Home St',
      category: 'home',
      coordinates: { latitude: 40.7128, longitude: -74.006 },
    };

    const destination: Place = {
      id: 'dest-1',
      name: 'Work',
      address: '200 Work Ave',
      category: 'other',
      coordinates: { latitude: 40.7505, longitude: -73.9934 },
    };

    beforeEach(() => {
      const { setOrigin, setDestination } = useNavigationStore.getState();
      setOrigin(origin);
      setDestination(destination);
    });

    it('should find routes when origin and destination are set', () => {
      const { findRoutes } = useNavigationStore.getState();

      findRoutes();

      const store = useNavigationStore.getState();
      expect(store.availableRoutes.length).toBeGreaterThan(0);
      expect(store.selectedRoute).toBeDefined();
    });

    it('should clear routes when origin is missing', () => {
      const { setOrigin, findRoutes } = useNavigationStore.getState();

      setOrigin(null);
      findRoutes();

      const store = useNavigationStore.getState();
      expect(store.availableRoutes).toEqual([]);
      expect(store.selectedRoute).toBe(null);
    });

    it('should clear routes when destination is missing', () => {
      const { setDestination, findRoutes } = useNavigationStore.getState();

      setDestination(null);
      findRoutes();

      const store = useNavigationStore.getState();
      expect(store.availableRoutes).toEqual([]);
      expect(store.selectedRoute).toBe(null);
    });

    it('should select a specific route', () => {
      const { findRoutes, selectRoute } = useNavigationStore.getState();

      findRoutes();
      const store = useNavigationStore.getState();
      const firstRoute = store.availableRoutes[0];

      selectRoute(firstRoute);

      const updatedStore = useNavigationStore.getState();
      expect(updatedStore.selectedRoute).toEqual(firstRoute);
    });

    it('should clear route and reset state', () => {
      const { findRoutes, clearRoute } = useNavigationStore.getState();

      findRoutes();
      clearRoute();

      const store = useNavigationStore.getState();
      expect(store.origin).toBe(null);
      expect(store.destination).toBe(null);
      expect(store.availableRoutes).toEqual([]);
      expect(store.selectedRoute).toBe(null);
      expect(store.searchQuery).toBe('');
    });
  });

  describe('Travel Mode', () => {
    it('should set travel mode', () => {
      const { setOrigin, setDestination, setTravelMode } = useNavigationStore.getState();

      // Set origin and destination first
      setOrigin({
        id: 'o1',
        name: 'Origin',
        address: 'Addr',
        category: 'home',
        coordinates: { latitude: 40.7, longitude: -74.0 },
      });
      setDestination({
        id: 'd1',
        name: 'Dest',
        address: 'Addr',
        category: 'other',
        coordinates: { latitude: 40.75, longitude: -73.99 },
      });

      setTravelMode('walking');

      const store = useNavigationStore.getState();
      expect(store.selectedTravelMode).toBe('walking');
      expect(store.routeOptions.travelMode).toBe('walking');
    });

    it('should automatically refind routes when travel mode changes', () => {
      const { setOrigin, setDestination, setTravelMode } = useNavigationStore.getState();

      setOrigin({
        id: 'o1',
        name: 'Origin',
        address: 'Addr',
        category: 'home',
        coordinates: { latitude: 40.7, longitude: -74.0 },
      });
      setDestination({
        id: 'd1',
        name: 'Dest',
        address: 'Addr',
        category: 'other',
        coordinates: { latitude: 40.75, longitude: -73.99 },
      });

      setTravelMode('biking');

      const store = useNavigationStore.getState();
      expect(store.availableRoutes.length).toBeGreaterThan(0);
      expect(store.availableRoutes[0].id).toContain('bike_');
    });
  });

  describe('Accessibility Settings', () => {
    it('should update accessibility settings', () => {
      const { updateAccessibilitySettings } = useNavigationStore.getState();

      updateAccessibilitySettings({ largeText: true, highContrast: true });

      const store = useNavigationStore.getState();
      expect(store.accessibilitySettings.largeText).toBe(true);
      expect(store.accessibilitySettings.highContrast).toBe(true);
      expect(store.accessibilitySettings.voiceDescriptions).toBe(false);
    });

    it('should merge accessibility settings', () => {
      const { updateAccessibilitySettings } = useNavigationStore.getState();

      updateAccessibilitySettings({ largeText: true });
      updateAccessibilitySettings({ voiceDescriptions: true });

      const store = useNavigationStore.getState();
      expect(store.accessibilitySettings.largeText).toBe(true);
      expect(store.accessibilitySettings.voiceDescriptions).toBe(true);
    });
  });

  describe('Photo Check-ins', () => {
    it('should add a photo check-in', () => {
      const { addPhotoCheckIn } = useNavigationStore.getState();

      addPhotoCheckIn({
        placeId: 'place-1',
        placeName: 'Test Place',
        photoUrl: 'https://example.com/photo.jpg',
        timestamp: Date.now(),
      });

      const store = useNavigationStore.getState();
      expect(store.photoCheckIns).toHaveLength(1);
      expect(store.photoCheckIns[0].placeId).toBe('place-1');
      expect(store.photoCheckIns[0].id).toBeDefined();
    });

    it('should add location-verified photo check-in', () => {
      const { addLocationVerifiedPhotoCheckIn } = useNavigationStore.getState();

      const result = addLocationVerifiedPhotoCheckIn(
        {
          placeId: 'place-1',
          placeName: 'Test Place',
          photoUrl: 'https://example.com/photo.jpg',
          timestamp: Date.now(),
        },
        { latitude: 40.7128, longitude: -74.006 },
        { latitude: 40.7128, longitude: -74.006 },
      );

      expect(result.isWithinRadius).toBe(true);
      expect(result.distance).toBe(50);

      const store = useNavigationStore.getState();
      expect(store.photoCheckIns).toHaveLength(1);
    });
  });

  describe('Weather Info', () => {
    it('should set weather info', () => {
      const { setWeatherInfo } = useNavigationStore.getState();

      const weather = {
        temperature: 72,
        condition: 'Sunny',
        humidity: 60,
      };

      setWeatherInfo(weather);

      const store = useNavigationStore.getState();
      expect(store.weatherInfo).toEqual(weather);
    });
  });

  describe('Search Query', () => {
    it('should set search query', () => {
      const { setSearchQuery } = useNavigationStore.getState();

      setSearchQuery('Central Park');

      const store = useNavigationStore.getState();
      expect(store.searchQuery).toBe('Central Park');
    });
  });

  describe('Route Options', () => {
    it('should update route options', () => {
      const { setOrigin, setDestination, updateRouteOptions } = useNavigationStore.getState();

      setOrigin({
        id: 'o1',
        name: 'Origin',
        address: 'Addr',
        category: 'home',
        coordinates: { latitude: 40.7, longitude: -74.0 },
      });
      setDestination({
        id: 'd1',
        name: 'Dest',
        address: 'Addr',
        category: 'other',
        coordinates: { latitude: 40.75, longitude: -73.99 },
      });

      updateRouteOptions({ avoidTolls: true, accessibilityMode: true });

      const store = useNavigationStore.getState();
      expect(store.routeOptions.avoidTolls).toBe(true);
      expect(store.routeOptions.accessibilityMode).toBe(true);
    });

    it('should automatically refind routes when options change', () => {
      const { setOrigin, setDestination, updateRouteOptions } = useNavigationStore.getState();

      setOrigin({
        id: 'o1',
        name: 'Origin',
        address: 'Addr',
        category: 'home',
        coordinates: { latitude: 40.7, longitude: -74.0 },
      });
      setDestination({
        id: 'd1',
        name: 'Dest',
        address: 'Addr',
        category: 'other',
        coordinates: { latitude: 40.75, longitude: -73.99 },
      });

      updateRouteOptions({ avoidHighways: true });

      const store = useNavigationStore.getState();
      expect(store.availableRoutes.length).toBeGreaterThan(0);
    });
  });
});
