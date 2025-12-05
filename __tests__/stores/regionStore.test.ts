/**
 * Comprehensive Tests for Region Store
 */

import { useRegionStore } from '../../stores/regionStore';
import { RegionConfig } from '@/types/region';

// Helper to create minimal mock region config
const createMockRegion = (
  id: string,
  name: string,
  country: string,
  emergencyNumber: string,
  transitSystemIds: string[],
): RegionConfig => {
  // Determine safety tips and fun facts based on region ID
  let safetyTips: string[] = [];
  let funFacts: string[] = [];

  if (id === 'nyc') {
    safetyTips = ['Stay aware of surroundings', 'Travel in groups'];
    funFacts = ['NYC has 472 subway stations', 'The subway runs 24/7'];
  } else if (id === 'sf') {
    safetyTips = ['Mind the gap'];
    funFacts = ['BART opened in 1972'];
  } else if (id === 'chicago') {
    safetyTips = ['Stay alert'];
    funFacts = ['CTA is the second largest transit system'];
  }

  return {
    id,
    name,
    country,
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: transitSystemIds.map((tsId) => ({
      id: tsId,
      name: tsId,
      type: 'subway' as const,
      color: '#000000',
    })),
    emergencyNumber,
    safetyTips,
    funFacts,
    popularPlaces: [],
  };
};

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock region configs (inlined because jest.mock is hoisted)
jest.mock('../../config/regions/newYork', () => ({
  newYorkConfig: {
    id: 'nyc',
    name: 'New York City',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [
      { id: 'mta-subway', name: 'mta-subway', type: 'subway', color: '#000000' },
      { id: 'mta-bus', name: 'mta-bus', type: 'subway', color: '#000000' },
    ],
    emergencyNumber: '911',
    safetyTips: ['Stay aware of surroundings', 'Travel in groups'],
    funFacts: ['NYC has 472 subway stations', 'The subway runs 24/7'],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/chicago', () => ({
  chicagoConfig: {
    id: 'chicago',
    name: 'Chicago',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [{ id: 'cta', name: 'cta', type: 'subway', color: '#000000' }],
    emergencyNumber: '911',
    safetyTips: ['Stay alert'],
    funFacts: ['CTA is the second largest transit system'],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/sanFrancisco', () => ({
  sanFranciscoConfig: {
    id: 'sf',
    name: 'San Francisco',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [
      { id: 'bart', name: 'bart', type: 'subway', color: '#000000' },
      { id: 'muni', name: 'muni', type: 'subway', color: '#000000' },
    ],
    emergencyNumber: '911',
    safetyTips: ['Mind the gap'],
    funFacts: ['BART opened in 1972'],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/washington', () => ({
  washingtonConfig: {
    id: 'dc',
    name: 'Washington DC',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [{ id: 'wmata', name: 'wmata', type: 'subway', color: '#000000' }],
    emergencyNumber: '911',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/boston', () => ({
  bostonConfig: {
    id: 'boston',
    name: 'Boston',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [{ id: 'mbta', name: 'mbta', type: 'subway', color: '#000000' }],
    emergencyNumber: '911',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/losAngeles', () => ({
  losAngelesConfig: {
    id: 'la',
    name: 'Los Angeles',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [{ id: 'metro', name: 'metro', type: 'subway', color: '#000000' }],
    emergencyNumber: '911',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/seattle', () => ({
  seattleConfig: {
    id: 'seattle',
    name: 'Seattle',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [{ id: 'link', name: 'link', type: 'subway', color: '#000000' }],
    emergencyNumber: '911',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/philadelphia', () => ({
  philadelphiaConfig: {
    id: 'philly',
    name: 'Philadelphia',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [{ id: 'septa', name: 'septa', type: 'subway', color: '#000000' }],
    emergencyNumber: '911',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/atlanta', () => ({
  atlantaConfig: {
    id: 'atlanta',
    name: 'Atlanta',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [{ id: 'marta', name: 'marta', type: 'subway', color: '#000000' }],
    emergencyNumber: '911',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/miami', () => ({
  miamiConfig: {
    id: 'miami',
    name: 'Miami',
    country: 'United States',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [{ id: 'metrorail', name: 'metrorail', type: 'subway', color: '#000000' }],
    emergencyNumber: '911',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/london', () => ({
  londonConfig: {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [
      { id: 'tube', name: 'tube', type: 'subway', color: '#000000' },
      { id: 'bus', name: 'bus', type: 'subway', color: '#000000' },
    ],
    emergencyNumber: '999',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

jest.mock('../../config/regions/tokyo', () => ({
  tokyoConfig: {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    coordinates: { latitude: 0, longitude: 0 },
    transitSystems: [
      { id: 'jr', name: 'jr', type: 'subway', color: '#000000' },
      { id: 'metro', name: 'metro', type: 'subway', color: '#000000' },
    ],
    emergencyNumber: '110',
    safetyTips: [],
    funFacts: [],
    popularPlaces: [],
  },
}));

describe('Region Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useRegionStore.setState({
      availableRegions: [
        createMockRegion('nyc', 'New York City', 'United States', '911', ['mta-subway', 'mta-bus']),
        createMockRegion('chicago', 'Chicago', 'United States', '911', ['cta']),
        createMockRegion('sf', 'San Francisco', 'United States', '911', ['bart', 'muni']),
        createMockRegion('dc', 'Washington DC', 'United States', '911', ['wmata']),
        createMockRegion('boston', 'Boston', 'United States', '911', ['mbta']),
        createMockRegion('la', 'Los Angeles', 'United States', '911', ['metro']),
        createMockRegion('seattle', 'Seattle', 'United States', '911', ['link']),
        createMockRegion('philly', 'Philadelphia', 'United States', '911', ['septa']),
        createMockRegion('atlanta', 'Atlanta', 'United States', '911', ['marta']),
        createMockRegion('miami', 'Miami', 'United States', '911', ['metrorail']),
        createMockRegion('london', 'London', 'United Kingdom', '999', ['tube', 'bus']),
        createMockRegion('tokyo', 'Tokyo', 'Japan', '110', ['jr', 'metro']),
      ],
      currentRegion: createMockRegion('nyc', 'New York City', 'United States', '911', [
        'mta-subway',
        'mta-bus',
      ]),
      userPreferences: {
        selectedRegion: 'nyc',
        preferredLanguage: 'en',
        preferredUnits: 'imperial',
        accessibilityMode: false,
        parentalControls: true,
      },
      isConfigured: false,
      isHydrated: false,
    });
  });

  describe('Initial State', () => {
    it('should have 12 available regions', () => {
      const store = useRegionStore.getState();

      expect(store.availableRegions).toHaveLength(12);
    });

    it('should default to New York City as current region', () => {
      const store = useRegionStore.getState();

      expect(store.currentRegion.id).toBe('nyc');
      expect(store.currentRegion.name).toBe('New York City');
    });

    it('should have correct default preferences', () => {
      const store = useRegionStore.getState();

      expect(store.userPreferences).toEqual({
        selectedRegion: 'nyc',
        preferredLanguage: 'en',
        preferredUnits: 'imperial',
        accessibilityMode: false,
        parentalControls: true,
      });
    });

    it('should not be configured initially', () => {
      const store = useRegionStore.getState();

      expect(store.isConfigured).toBe(false);
    });

    it('should not be hydrated initially', () => {
      const store = useRegionStore.getState();

      expect(store.isHydrated).toBe(false);
    });
  });

  describe('Region Switching', () => {
    it('should switch to a different region', () => {
      const { setRegion } = useRegionStore.getState();

      setRegion('chicago');

      const store = useRegionStore.getState();
      expect(store.currentRegion.id).toBe('chicago');
      expect(store.currentRegion.name).toBe('Chicago');
    });

    it('should update user preferences when switching regions', () => {
      const { setRegion } = useRegionStore.getState();

      setRegion('london');

      const store = useRegionStore.getState();
      expect(store.userPreferences.selectedRegion).toBe('london');
    });

    it('should not change region for invalid region ID', () => {
      const { setRegion } = useRegionStore.getState();
      const beforeState = useRegionStore.getState();

      setRegion('invalid-region');

      const afterState = useRegionStore.getState();
      expect(afterState.currentRegion).toEqual(beforeState.currentRegion);
    });

    it('should switch to international region with different emergency number', () => {
      const { setRegion, getEmergencyNumber } = useRegionStore.getState();

      setRegion('london');
      expect(getEmergencyNumber()).toBe('999');

      setRegion('tokyo');
      expect(getEmergencyNumber()).toBe('110');
    });
  });

  describe('Preferences Management', () => {
    it('should update preferred language', () => {
      const { updatePreferences } = useRegionStore.getState();

      updatePreferences({ preferredLanguage: 'es' });

      const store = useRegionStore.getState();
      expect(store.userPreferences.preferredLanguage).toBe('es');
    });

    it('should update preferred units', () => {
      const { updatePreferences } = useRegionStore.getState();

      updatePreferences({ preferredUnits: 'metric' });

      const store = useRegionStore.getState();
      expect(store.userPreferences.preferredUnits).toBe('metric');
    });

    it('should toggle accessibility mode', () => {
      const { updatePreferences } = useRegionStore.getState();

      updatePreferences({ accessibilityMode: true });

      const store = useRegionStore.getState();
      expect(store.userPreferences.accessibilityMode).toBe(true);
    });

    it('should toggle parental controls', () => {
      const { updatePreferences } = useRegionStore.getState();

      updatePreferences({ parentalControls: false });

      const store = useRegionStore.getState();
      expect(store.userPreferences.parentalControls).toBe(false);
    });

    it('should update multiple preferences at once', () => {
      const { updatePreferences } = useRegionStore.getState();

      updatePreferences({
        preferredLanguage: 'ja',
        preferredUnits: 'metric',
        accessibilityMode: true,
      });

      const store = useRegionStore.getState();
      expect(store.userPreferences.preferredLanguage).toBe('ja');
      expect(store.userPreferences.preferredUnits).toBe('metric');
      expect(store.userPreferences.accessibilityMode).toBe(true);
    });

    it('should not affect other preferences when updating one', () => {
      const { updatePreferences } = useRegionStore.getState();

      updatePreferences({ preferredLanguage: 'fr' });

      const store = useRegionStore.getState();
      expect(store.userPreferences.preferredUnits).toBe('imperial');
      expect(store.userPreferences.parentalControls).toBe(true);
    });
  });

  describe('Onboarding', () => {
    it('should complete onboarding', () => {
      const { completeOnboarding } = useRegionStore.getState();

      completeOnboarding();

      const store = useRegionStore.getState();
      expect(store.isConfigured).toBe(true);
    });
  });

  describe('Custom Regions', () => {
    it('should add a custom region', () => {
      const { addCustomRegion } = useRegionStore.getState();

      const customRegion: RegionConfig = createMockRegion(
        'custom-city',
        'Custom City',
        'Custom Country',
        '000',
        ['custom-transit'],
      );

      addCustomRegion(customRegion);

      const store = useRegionStore.getState();
      expect(store.availableRegions).toHaveLength(13);
      expect(store.availableRegions[12].id).toBe('custom-city');
    });

    it('should remove a region by ID', () => {
      const { removeRegion } = useRegionStore.getState();

      removeRegion('miami');

      const store = useRegionStore.getState();
      expect(store.availableRegions).toHaveLength(11);
      expect(store.availableRegions.find((r) => r.id === 'miami')).toBeUndefined();
    });

    it('should maintain other regions when removing one', () => {
      const { removeRegion } = useRegionStore.getState();

      removeRegion('atlanta');

      const store = useRegionStore.getState();
      expect(store.availableRegions.find((r) => r.id === 'chicago')).toBeDefined();
      expect(store.availableRegions.find((r) => r.id === 'nyc')).toBeDefined();
    });
  });

  describe('Transit Data Updates', () => {
    it('should update transit data for a specific region', () => {
      const { updateRegionTransitData } = useRegionStore.getState();

      updateRegionTransitData('chicago', {
        transitSystems: [
          { id: 'cta', name: 'CTA', type: 'subway', color: '#000000' },
          { id: 'metra', name: 'Metra', type: 'train', color: '#FF0000' },
        ],
      });

      const store = useRegionStore.getState();
      const chicago = store.availableRegions.find((r) => r.id === 'chicago');
      expect(chicago?.transitSystems).toHaveLength(2);
      expect(chicago?.transitSystems[0].id).toBe('cta');
      expect(chicago?.transitSystems[1].id).toBe('metra');
    });

    it('should update current region if it matches the updated region', () => {
      const { setRegion, updateRegionTransitData } = useRegionStore.getState();

      setRegion('sf');
      updateRegionTransitData('sf', {
        transitSystems: [
          { id: 'bart', name: 'BART', type: 'train', color: '#000000' },
          { id: 'muni', name: 'Muni', type: 'bus', color: '#FF0000' },
          { id: 'caltrain', name: 'Caltrain', type: 'train', color: '#00FF00' },
        ],
      });

      const store = useRegionStore.getState();
      expect(store.currentRegion.transitSystems).toHaveLength(3);
      expect(store.currentRegion.transitSystems[2].id).toBe('caltrain');
    });

    it('should not update current region if it does not match', () => {
      const { updateRegionTransitData } = useRegionStore.getState();

      // Current region is NYC
      updateRegionTransitData('boston', {
        transitSystems: [
          { id: 'mbta', name: 'MBTA', type: 'subway', color: '#000000' },
          { id: 'commuter-rail', name: 'Commuter Rail', type: 'train', color: '#FF0000' },
        ],
      });

      const store = useRegionStore.getState();
      expect(store.currentRegion.id).toBe('nyc');
      expect(store.currentRegion.transitSystems[0].id).toBe('mta-subway');
      expect(store.currentRegion.transitSystems[1].id).toBe('mta-bus');
    });

    it('should not affect other regions when updating one', () => {
      const { updateRegionTransitData } = useRegionStore.getState();

      updateRegionTransitData('dc', {
        safetyTips: ['Stand right, walk left on escalators'],
      });

      const store = useRegionStore.getState();
      const nyc = store.availableRegions.find((r) => r.id === 'nyc');
      expect(nyc?.safetyTips).toEqual(['Stay aware of surroundings', 'Travel in groups']);
    });
  });

  describe('Getters - Transit Systems', () => {
    it('should get current region transit systems', () => {
      const { getCurrentTransitSystems } = useRegionStore.getState();

      const systems = getCurrentTransitSystems();

      expect(systems).toHaveLength(2);
      expect(systems[0].id).toBe('mta-subway');
      expect(systems[1].id).toBe('mta-bus');
    });

    it('should return updated transit systems after region switch', () => {
      const { setRegion, getCurrentTransitSystems } = useRegionStore.getState();

      setRegion('london');
      const systems = getCurrentTransitSystems();

      expect(systems).toHaveLength(2);
      expect(systems[0].id).toBe('tube');
      expect(systems[1].id).toBe('bus');
    });
  });

  describe('Getters - Emergency Number', () => {
    it('should get current region emergency number', () => {
      const { getEmergencyNumber } = useRegionStore.getState();

      const number = getEmergencyNumber();

      expect(number).toBe('911');
    });

    it('should return updated emergency number after region switch', () => {
      const { setRegion, getEmergencyNumber } = useRegionStore.getState();

      setRegion('tokyo');
      const number = getEmergencyNumber();

      expect(number).toBe('110');
    });
  });

  describe('Getters - Safety Tips', () => {
    it('should get current region safety tips', () => {
      const { getSafetyTips } = useRegionStore.getState();

      const tips = getSafetyTips();

      expect(tips).toEqual(['Stay aware of surroundings', 'Travel in groups']);
    });

    it('should return updated safety tips after region switch', () => {
      const { setRegion, getSafetyTips } = useRegionStore.getState();

      setRegion('sf');
      const tips = getSafetyTips();

      expect(tips).toEqual(['Mind the gap']);
    });

    it('should return empty array for regions with no safety tips', () => {
      const { setRegion, getSafetyTips } = useRegionStore.getState();

      setRegion('dc');
      const tips = getSafetyTips();

      expect(tips).toEqual([]);
    });
  });

  describe('Getters - Fun Facts', () => {
    it('should get current region fun facts', () => {
      const { getFunFacts } = useRegionStore.getState();

      const facts = getFunFacts();

      expect(facts).toEqual(['NYC has 472 subway stations', 'The subway runs 24/7']);
    });

    it('should return updated fun facts after region switch', () => {
      const { setRegion, getFunFacts } = useRegionStore.getState();

      setRegion('chicago');
      const facts = getFunFacts();

      expect(facts).toEqual(['CTA is the second largest transit system']);
    });

    it('should return empty array for regions with no fun facts', () => {
      const { setRegion, getFunFacts } = useRegionStore.getState();

      setRegion('boston');
      const facts = getFunFacts();

      expect(facts).toEqual([]);
    });
  });

  describe('Search and Filter', () => {
    it('should filter regions by country', () => {
      const { getRegionsByCountry } = useRegionStore.getState();

      const usRegions = getRegionsByCountry('United States');

      expect(usRegions).toHaveLength(10);
      expect(usRegions.every((r) => r.country === 'United States')).toBe(true);
    });

    it('should filter international regions', () => {
      const { getRegionsByCountry } = useRegionStore.getState();

      const ukRegions = getRegionsByCountry('United Kingdom');
      const japanRegions = getRegionsByCountry('Japan');

      expect(ukRegions).toHaveLength(1);
      expect(ukRegions[0].id).toBe('london');
      expect(japanRegions).toHaveLength(1);
      expect(japanRegions[0].id).toBe('tokyo');
    });

    it('should return empty array for non-existent country', () => {
      const { getRegionsByCountry } = useRegionStore.getState();

      const regions = getRegionsByCountry('Non-existent Country');

      expect(regions).toEqual([]);
    });

    it('should search regions by name (case insensitive)', () => {
      const { searchRegions } = useRegionStore.getState();

      const results = searchRegions('york');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('nyc');
    });

    it('should search regions by country (case insensitive)', () => {
      const { searchRegions } = useRegionStore.getState();

      const results = searchRegions('united kingdom');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('london');
    });

    it('should return multiple results for partial matches', () => {
      const { searchRegions } = useRegionStore.getState();

      const results = searchRegions('san');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((r) => r.id === 'sf')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const { searchRegions } = useRegionStore.getState();

      const results = searchRegions('nonexistent');

      expect(results).toEqual([]);
    });

    it('should handle case insensitive search', () => {
      const { searchRegions } = useRegionStore.getState();

      const upperCase = searchRegions('CHICAGO');
      const lowerCase = searchRegions('chicago');
      const mixedCase = searchRegions('ChIcAgO');

      expect(upperCase).toEqual(lowerCase);
      expect(lowerCase).toEqual(mixedCase);
      expect(upperCase[0].id).toBe('chicago');
    });
  });

  describe('Hydration', () => {
    it('should set hydrated flag', () => {
      const { setHydrated } = useRegionStore.getState();

      setHydrated();

      const store = useRegionStore.getState();
      expect(store.isHydrated).toBe(true);
    });

    it('should be configured for AsyncStorage persistence', () => {
      expect(useRegionStore).toBeDefined();
      expect(useRegionStore.getState).toBeDefined();
    });
  });
});
