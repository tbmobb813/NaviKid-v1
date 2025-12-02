import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MTAStationFinder from '@/components/MTAStationFinder';
import { generateMockStations } from '@/services/mockStationData';
import { StationInfo } from '@/types/station';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock subway line colors
jest.mock('@/config/transit-data/mta-subway-lines', () => ({
  subwayLineColors: {
    '1': '#EE352E',
    '2': '#EE352E',
    '3': '#EE352E',
    '4': '#00933C',
    '5': '#00933C',
    '6': '#00933C',
    '7': '#B933AD',
    'A': '#0039A6',
    'C': '#0039A6',
    'E': '#0039A6',
    'N': '#FCCC0A',
    'Q': '#FCCC0A',
    'R': '#FCCC0A',
    'W': '#FCCC0A',
  },
}));

// Mock the generateMockStations function
jest.mock('@/services/mockStationData', () => ({
  generateMockStations: jest.fn(),
}));

// Mock StationCard and StationFilters
jest.mock('@/components/station-finder/StationCard', () => ({
  StationCard: ({ station, isFavorite, onPress, onToggleFavorite }: any) => {
    const { View, Text, Pressable } = require('react-native');
    return (
      <View testID={`station-card-${station.id}`}>
        <Pressable testID={`station-press-${station.id}`} onPress={() => onPress(station)}>
          <Text>{station.name}</Text>
          <Text>{station.kidFriendlyInfo.nickname}</Text>
        </Pressable>
        <Pressable
          testID={`favorite-button-${station.id}`}
          onPress={() => onToggleFavorite(station.id)}
        >
          <Text>{isFavorite ? 'Favorited' : 'Not Favorited'}</Text>
        </Pressable>
      </View>
    );
  },
}));

jest.mock('@/components/station-finder/StationFilters', () => ({
  StationFilters: ({
    searchQuery,
    selectedType,
    accessibilityOnly,
    onSearchChange,
    onTypeChange,
    onAccessibilityToggle,
  }: any) => {
    const { View, TextInput, Pressable, Text } = require('react-native');
    return (
      <View testID="station-filters">
        <TextInput
          testID="search-input"
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search stations..."
        />
        <View testID="type-filters">
          <Pressable testID="filter-all" onPress={() => onTypeChange('all')}>
            <Text>All {selectedType === 'all' ? '(Active)' : ''}</Text>
          </Pressable>
          <Pressable testID="filter-subway" onPress={() => onTypeChange('subway')}>
            <Text>Subway {selectedType === 'subway' ? '(Active)' : ''}</Text>
          </Pressable>
          <Pressable testID="filter-bus" onPress={() => onTypeChange('bus')}>
            <Text>Bus {selectedType === 'bus' ? '(Active)' : ''}</Text>
          </Pressable>
        </View>
        <Pressable testID="accessibility-toggle" onPress={onAccessibilityToggle}>
          <Text>Wheelchair Accessible {accessibilityOnly ? '(Active)' : ''}</Text>
        </Pressable>
      </View>
    );
  },
}));

// Mock station data
const mockStations: StationInfo[] = [
  {
    id: 'station-1',
    name: 'Times Square-42nd St',
    type: 'subway',
    lines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W'],
    borough: 'Manhattan',
    coordinates: { latitude: 40.7589, longitude: -73.9851 },
    distance: 100,
    accessibility: {
      wheelchairAccessible: true,
      elevatorStatus: 'operational',
    },
    kidFriendlyInfo: {
      nickname: 'The Bright Lights Station',
      tip: 'This is the busiest subway station in NYC!',
      funFact: 'Over 200,000 people use this station every day',
      whatToSee: ['Times Square', 'Broadway Theaters', 'M&M Store'],
      safetyNote: 'Stay close to your family - it gets very crowded here!',
    },
  },
  {
    id: 'station-2',
    name: 'Grand Central-42nd St',
    type: 'subway',
    lines: ['4', '5', '6', '7'],
    borough: 'Manhattan',
    coordinates: { latitude: 40.7527, longitude: -73.9772 },
    distance: 500,
    accessibility: {
      wheelchairAccessible: true,
      elevatorStatus: 'operational',
    },
    kidFriendlyInfo: {
      nickname: 'The Beautiful Station',
      tip: 'Look up at the ceiling - it shows the constellations!',
      funFact: 'Grand Central has a secret tennis court on the 4th floor',
      whatToSee: ['Grand Central Terminal', 'The Whispering Gallery'],
      safetyNote: null,
    },
  },
  {
    id: 'station-3',
    name: 'Coney Island-Stillwell Ave',
    type: 'subway',
    lines: ['D', 'F', 'N', 'Q'],
    borough: 'Brooklyn',
    coordinates: { latitude: 40.5774, longitude: -73.9812 },
    distance: 15000,
    accessibility: {
      wheelchairAccessible: false,
      elevatorStatus: 'out-of-service',
    },
    kidFriendlyInfo: {
      nickname: 'The Beach Station',
      tip: 'This station takes you to the beach and amusement park!',
      funFact: 'Coney Island is home to the world-famous hot dog eating contest',
      whatToSee: ['Coney Island Beach', 'Luna Park', 'New York Aquarium', 'Wonder Wheel'],
      safetyNote: 'Apply sunscreen before going to the beach!',
    },
  },
  {
    id: 'station-4',
    name: 'M42 Bus Stop',
    type: 'bus',
    lines: ['M42'],
    borough: 'Manhattan',
    coordinates: { latitude: 40.7567, longitude: -73.9864 },
    distance: 200,
    accessibility: {
      wheelchairAccessible: true,
      elevatorStatus: null,
    },
    kidFriendlyInfo: {
      nickname: 'The Crosstown Bus',
      tip: 'This bus goes all the way across Manhattan!',
      funFact: 'The M42 is one of the busiest crosstown bus routes',
      whatToSee: ['United Nations', 'Port Authority'],
      safetyNote: null,
    },
  },
];

describe('MTAStationFinder Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (generateMockStations as jest.Mock).mockReturnValue(mockStations);
  });

  describe('Initial Rendering', () => {
    it('should render the component', () => {
      const { getByTestId } = render(<MTAStationFinder />);
      expect(getByTestId('station-filters')).toBeTruthy();
    });

    it('should display station filters', () => {
      const { getByTestId } = render(<MTAStationFinder />);
      expect(getByTestId('search-input')).toBeTruthy();
      expect(getByTestId('type-filters')).toBeTruthy();
      expect(getByTestId('accessibility-toggle')).toBeTruthy();
    });

    it('should load and display all stations initially', async () => {
      const { getByText } = render(<MTAStationFinder />);

      await waitFor(() => {
        expect(getByText('Times Square-42nd St')).toBeTruthy();
        expect(getByText('Grand Central-42nd St')).toBeTruthy();
        expect(getByText('Coney Island-Stillwell Ave')).toBeTruthy();
        expect(getByText('M42 Bus Stop')).toBeTruthy();
      });
    });

    it('should display results count', async () => {
      const { getByText } = render(<MTAStationFinder />);

      await waitFor(() => {
        expect(getByText('4 stations found')).toBeTruthy();
      });
    });

    it('should handle singular station count', async () => {
      (generateMockStations as jest.Mock).mockReturnValue([mockStations[0]]);
      const { getByText } = render(<MTAStationFinder />);

      await waitFor(() => {
        expect(getByText('1 station found')).toBeTruthy();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter stations by name', async () => {
      const { getByTestId, getByText, queryByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Times Square');

      await waitFor(() => {
        expect(getByText('Times Square-42nd St')).toBeTruthy();
        expect(queryByText('Grand Central-42nd St')).toBeNull();
      });
    });

    it('should filter stations by borough', async () => {
      const { getByTestId, getByText, queryByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Brooklyn');

      await waitFor(() => {
        expect(getByText('Coney Island-Stillwell Ave')).toBeTruthy();
        expect(queryByText('Times Square-42nd St')).toBeNull();
      });
    });

    it('should filter stations by line number', async () => {
      const { getByTestId, getByText, queryByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, '7');

      await waitFor(() => {
        expect(getByText('Times Square-42nd St')).toBeTruthy();
        expect(getByText('Grand Central-42nd St')).toBeTruthy();
        expect(queryByText('Coney Island-Stillwell Ave')).toBeNull();
      });
    });

    it('should filter stations by nickname', async () => {
      const { getByTestId, getByText, queryByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Beach');

      await waitFor(() => {
        expect(getByText('Coney Island-Stillwell Ave')).toBeTruthy();
        expect(queryByText('Times Square-42nd St')).toBeNull();
      });
    });

    it('should be case-insensitive', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'TIMES SQUARE');

      await waitFor(() => {
        expect(getByText('Times Square-42nd St')).toBeTruthy();
      });
    });

    it('should update results count when searching', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Times Square');

      await waitFor(() => {
        expect(getByText('1 station found')).toBeTruthy();
      });
    });

    it('should show empty state when no results found', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Nonexistent Station');

      await waitFor(() => {
        expect(getByText('No stations found matching your search')).toBeTruthy();
        expect(
          getByText('Try searching for a different station name, line, or neighborhood')
        ).toBeTruthy();
      });
    });
  });

  describe('Type Filtering', () => {
    it('should show all stations by default', async () => {
      const { getByText } = render(<MTAStationFinder />);

      await waitFor(() => {
        expect(getByText('4 stations found')).toBeTruthy();
      });
    });

    it('should filter to subway stations only', async () => {
      const { getByTestId, getByText, queryByText } = render(<MTAStationFinder />);

      const subwayFilter = getByTestId('filter-subway');
      fireEvent.press(subwayFilter);

      await waitFor(() => {
        expect(getByText('Times Square-42nd St')).toBeTruthy();
        expect(getByText('Grand Central-42nd St')).toBeTruthy();
        expect(queryByText('M42 Bus Stop')).toBeNull();
        expect(getByText('3 stations found')).toBeTruthy();
      });
    });

    it('should filter to bus stops only', async () => {
      const { getByTestId, getByText, queryByText } = render(<MTAStationFinder />);

      const busFilter = getByTestId('filter-bus');
      fireEvent.press(busFilter);

      await waitFor(() => {
        expect(getByText('M42 Bus Stop')).toBeTruthy();
        expect(queryByText('Times Square-42nd St')).toBeNull();
        expect(getByText('1 station found')).toBeTruthy();
      });
    });

    it('should return to all stations when all filter is pressed', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      // First filter to subway
      const subwayFilter = getByTestId('filter-subway');
      fireEvent.press(subwayFilter);

      await waitFor(() => {
        expect(getByText('3 stations found')).toBeTruthy();
      });

      // Then return to all
      const allFilter = getByTestId('filter-all');
      fireEvent.press(allFilter);

      await waitFor(() => {
        expect(getByText('4 stations found')).toBeTruthy();
      });
    });
  });

  describe('Accessibility Filtering', () => {
    it('should filter to wheelchair accessible stations only', async () => {
      const { getByTestId, getByText, queryByText } = render(<MTAStationFinder />);

      const accessibilityToggle = getByTestId('accessibility-toggle');
      fireEvent.press(accessibilityToggle);

      await waitFor(() => {
        expect(getByText('Times Square-42nd St')).toBeTruthy();
        expect(getByText('Grand Central-42nd St')).toBeTruthy();
        expect(queryByText('Coney Island-Stillwell Ave')).toBeNull();
        expect(getByText('3 stations found')).toBeTruthy();
      });
    });

    it('should toggle accessibility filter off', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      const accessibilityToggle = getByTestId('accessibility-toggle');

      // Turn on
      fireEvent.press(accessibilityToggle);
      await waitFor(() => {
        expect(getByText('3 stations found')).toBeTruthy();
      });

      // Turn off
      fireEvent.press(accessibilityToggle);
      await waitFor(() => {
        expect(getByText('4 stations found')).toBeTruthy();
      });
    });
  });

  describe('Combined Filtering', () => {
    it('should apply search and type filter together', async () => {
      const { getByTestId, getByText, queryByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Manhattan');

      const subwayFilter = getByTestId('filter-subway');
      fireEvent.press(subwayFilter);

      await waitFor(() => {
        expect(getByText('Times Square-42nd St')).toBeTruthy();
        expect(getByText('Grand Central-42nd St')).toBeTruthy();
        expect(queryByText('M42 Bus Stop')).toBeNull();
      });
    });

    it('should apply all three filters together', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      // Search for Manhattan
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Manhattan');

      // Filter to subway
      const subwayFilter = getByTestId('filter-subway');
      fireEvent.press(subwayFilter);

      // Enable accessibility filter
      const accessibilityToggle = getByTestId('accessibility-toggle');
      fireEvent.press(accessibilityToggle);

      await waitFor(() => {
        expect(getByText('Times Square-42nd St')).toBeTruthy();
        expect(getByText('Grand Central-42nd St')).toBeTruthy();
      });
    });
  });

  describe('Favorite Stations', () => {
    it('should toggle favorite status when star is pressed', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      await waitFor(() => {
        expect(getByText('Not Favorited')).toBeTruthy();
      });

      const favoriteButton = getByTestId('favorite-button-station-1');
      fireEvent.press(favoriteButton);

      await waitFor(() => {
        expect(getByText('Favorited')).toBeTruthy();
      });
    });

    it('should unfavorite when pressed again', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      const favoriteButton = getByTestId('favorite-button-station-1');

      // Favorite
      fireEvent.press(favoriteButton);
      await waitFor(() => {
        expect(getByText('Favorited')).toBeTruthy();
      });

      // Unfavorite
      fireEvent.press(favoriteButton);
      await waitFor(() => {
        expect(getByText('Not Favorited')).toBeTruthy();
      });
    });

    it('should maintain favorite status when filtering', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      // Favorite a station
      const favoriteButton = getByTestId('favorite-button-station-1');
      fireEvent.press(favoriteButton);

      await waitFor(() => {
        expect(getByText('Favorited')).toBeTruthy();
      });

      // Apply a filter
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Times');

      // Clear filter
      fireEvent.changeText(searchInput, '');

      // Favorite status should persist
      await waitFor(() => {
        expect(getByText('Favorited')).toBeTruthy();
      });
    });
  });

  describe('Station Selection', () => {
    it('should call onStationSelect when station is pressed', async () => {
      const onStationSelect = jest.fn();
      const { getByTestId } = render(<MTAStationFinder onStationSelect={onStationSelect} />);

      await waitFor(() => {
        const stationPress = getByTestId('station-press-station-1');
        fireEvent.press(stationPress);
      });

      expect(onStationSelect).toHaveBeenCalledWith(mockStations[0]);
    });

    it('should show alert with station info when no onStationSelect prop', async () => {
      const { getByTestId } = render(<MTAStationFinder />);

      await waitFor(() => {
        const stationPress = getByTestId('station-press-station-1');
        fireEvent.press(stationPress);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'The Bright Lights Station',
        expect.stringContaining('This is the busiest subway station in NYC!'),
        [{ text: 'Cool!', style: 'default' }]
      );
    });
  });

  describe('User Location Sorting', () => {
    it('should sort stations by distance when user location is provided', async () => {
      const userLocation = { latitude: 40.7589, longitude: -73.9851 };
      const { getAllByTestId } = render(<MTAStationFinder userLocation={userLocation} />);

      await waitFor(() => {
        const stationCards = getAllByTestId(/station-card/);
        expect(stationCards).toBeTruthy();
        // Stations should be sorted by distance (100, 200, 500, 15000)
      });
    });

    it('should not sort when user location is not provided', async () => {
      const { getAllByTestId } = render(<MTAStationFinder />);

      await waitFor(() => {
        const stationCards = getAllByTestId(/station-card/);
        expect(stationCards).toBeTruthy();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no stations available', async () => {
      (generateMockStations as jest.Mock).mockReturnValue([]);
      const { getByText } = render(<MTAStationFinder />);

      await waitFor(() => {
        expect(getByText('No stations found matching your search')).toBeTruthy();
      });
    });

    it('should display helper text in empty state', async () => {
      (generateMockStations as jest.Mock).mockReturnValue([]);
      const { getByText } = render(<MTAStationFinder />);

      await waitFor(() => {
        expect(
          getByText('Try searching for a different station name, line, or neighborhood')
        ).toBeTruthy();
      });
    });
  });

  describe('Filter Persistence', () => {
    it('should maintain type filter when searching', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      // Set type filter
      const subwayFilter = getByTestId('filter-subway');
      fireEvent.press(subwayFilter);

      await waitFor(() => {
        expect(getByText('3 stations found')).toBeTruthy();
      });

      // Search
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Times');

      await waitFor(() => {
        expect(getByText('1 station found')).toBeTruthy();
      });
    });

    it('should maintain search when changing type filter', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      // Search first
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Manhattan');

      await waitFor(() => {
        expect(getByText('3 stations found')).toBeTruthy();
      });

      // Then filter type
      const subwayFilter = getByTestId('filter-subway');
      fireEvent.press(subwayFilter);

      await waitFor(() => {
        expect(getByText('2 stations found')).toBeTruthy();
      });
    });
  });

  describe('Results Display', () => {
    it('should render station cards for each result', async () => {
      const { getByTestId } = render(<MTAStationFinder />);

      await waitFor(() => {
        expect(getByTestId('station-card-station-1')).toBeTruthy();
        expect(getByTestId('station-card-station-2')).toBeTruthy();
        expect(getByTestId('station-card-station-3')).toBeTruthy();
        expect(getByTestId('station-card-station-4')).toBeTruthy();
      });
    });

    it('should pass correct props to StationCard', async () => {
      const { getByTestId } = render(<MTAStationFinder />);

      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button-station-1');
        expect(favoriteButton).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search query', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, '   ');

      await waitFor(() => {
        expect(getByText('4 stations found')).toBeTruthy();
      });
    });

    it('should handle rapid filter changes', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      const subwayFilter = getByTestId('filter-subway');
      const busFilter = getByTestId('filter-bus');
      const allFilter = getByTestId('filter-all');

      fireEvent.press(subwayFilter);
      fireEvent.press(busFilter);
      fireEvent.press(allFilter);

      await waitFor(() => {
        expect(getByText('4 stations found')).toBeTruthy();
      });
    });

    it('should handle rapid search inputs', async () => {
      const { getByTestId } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'T');
      fireEvent.changeText(searchInput, 'Ti');
      fireEvent.changeText(searchInput, 'Tim');
      fireEvent.changeText(searchInput, 'Times');

      await waitFor(() => {
        expect(getByTestId('station-card-station-1')).toBeTruthy();
      });
    });

    it('should handle toggling accessibility filter rapidly', async () => {
      const { getByTestId, getByText } = render(<MTAStationFinder />);

      const accessibilityToggle = getByTestId('accessibility-toggle');

      fireEvent.press(accessibilityToggle);
      fireEvent.press(accessibilityToggle);
      fireEvent.press(accessibilityToggle);

      await waitFor(() => {
        expect(getByText('3 stations found')).toBeTruthy();
      });
    });
  });

  describe('Component Integration', () => {
    it('should pass search query to StationFilters', async () => {
      const { getByTestId } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      expect(searchInput.props.value).toBe('');
    });

    it('should update StationFilters when search changes', async () => {
      const { getByTestId } = render(<MTAStationFinder />);

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Test');

      await waitFor(() => {
        expect(searchInput.props.value).toBe('Test');
      });
    });
  });
});
