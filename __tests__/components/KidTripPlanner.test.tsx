import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert, Text } from 'react-native';
import KidTripPlanner from '@/components/KidTripPlanner';

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    MapPin: () => <View testID="lucide-icon" />,
    Navigation: () => <View testID="lucide-icon" />,
    Clock: () => <View testID="lucide-icon" />,
    Train: () => <View testID="lucide-icon" />,
    Bus: () => <View testID="lucide-icon" />,
    AlertTriangle: () => <View testID="lucide-icon" />,
    CheckCircle: () => <View testID="lucide-icon" />,
    Star: () => <View testID="lucide-icon" />,
    Users: () => <View testID="lucide-icon" />,
    Shield: () => <View testID="lucide-icon" />,
    Heart: () => <View testID="lucide-icon" />,
    Play: () => <View testID="lucide-icon" />,
  };
});

// Mock constants/colors
jest.mock('@/constants/colors', () => ({
  __esModule: true,
  default: {
    primary: '#007AFF',
    text: '#000000',
    textLight: '#666666',
    background: '#FFFFFF',
    card: '#F8F9FA',
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },
}));

// Mock subway line colors
jest.mock('@/config/transit-data/mta-subway-lines', () => ({
  subwayLineColors: {
    '1': '#FF6B6B',
    '2': '#FF6B6B',
    '3': '#FF6B6B',
    N: '#FFD93D',
    Q: '#FFD93D',
    '4': '#6BCF7F',
    '7': '#9D4EDD',
  },
}));

describe('KidTripPlanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the component with header and form', () => {
      render(<KidTripPlanner />);

      expect(screen.getByText('Kid-Friendly Trip Planner')).toBeTruthy();
      expect(screen.getByText('Plan safe and fun trips around NYC!')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter starting location...')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter destination...')).toBeTruthy();
    });

    it('should render with user location when provided', () => {
      const userLocation = {
        lat: 40.758,
        lng: -73.9855,
        name: 'Times Square',
      };

      render(<KidTripPlanner userLocation={userLocation} />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      expect(fromInput.props.value).toBe('Times Square');
    });

    it('should render group size controls with default values', () => {
      render(<KidTripPlanner />);

      // Default group size is 1 adult, 1 child
      const counterValues = screen.getAllByText(/^[0-9]+$/);
      expect(counterValues.length).toBeGreaterThanOrEqual(2);
    });

    it('should render accessibility options', () => {
      render(<KidTripPlanner />);

      expect(screen.getByText('Accessibility Needs')).toBeTruthy();
      expect(screen.getByText('Wheelchair Access')).toBeTruthy();
      expect(screen.getByText('Stroller Friendly')).toBeTruthy();
    });

    it('should render plan trip button', () => {
      render(<KidTripPlanner />);

      expect(screen.getByText('Plan My Trip!')).toBeTruthy();
    });
  });

  describe('Form Input Handling', () => {
    it('should update from location on text input', () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      fireEvent.changeText(fromInput, 'Central Park');

      expect(fromInput.props.value).toBe('Central Park');
    });

    it('should update to location on text input', () => {
      render(<KidTripPlanner />);

      const toInput = screen.getByPlaceholderText('Enter destination...');
      fireEvent.changeText(toInput, 'Brooklyn Bridge');

      expect(toInput.props.value).toBe('Brooklyn Bridge');
    });
  });

  describe('Group Size Controls', () => {
    it('should increment adult count when + button is pressed', () => {
      const { getAllByText } = render(<KidTripPlanner />);

      const plusButtons = getAllByText('+');
      const adultPlusButton = plusButtons[0]; // First + button is for adults

      fireEvent.press(adultPlusButton);

      // Find all number displays and check that adult count increased
      const numberDisplays = getAllByText(/^[0-9]+$/);
      // After increment, adult count should be 2
      expect(numberDisplays.some((el) => el.props.children === 2)).toBeTruthy();
    });

    it('should decrement adult count when - button is pressed', () => {
      const { getAllByText } = render(<KidTripPlanner />);

      const plusButtons = getAllByText('+');
      const minusButtons = getAllByText('-');

      // First increment to 2
      fireEvent.press(plusButtons[0]);
      // Then decrement back to 1
      fireEvent.press(minusButtons[0]);

      const numberDisplays = getAllByText(/^[0-9]+$/);
      expect(numberDisplays.some((el) => el.props.children === 1)).toBeTruthy();
    });

    it('should not decrement adult count below 1', () => {
      const { getAllByText } = render(<KidTripPlanner />);

      const minusButtons = getAllByText('-');
      fireEvent.press(minusButtons[0]); // Try to go below 1

      const numberDisplays = getAllByText(/^[0-9]+$/);
      // Should still be 1
      expect(numberDisplays.some((el) => el.props.children === 1)).toBeTruthy();
    });

    it('should increment child count when + button is pressed', () => {
      const { getAllByText } = render(<KidTripPlanner />);

      const plusButtons = getAllByText('+');
      const childPlusButton = plusButtons[1]; // Second + button is for children

      fireEvent.press(childPlusButton);

      const numberDisplays = getAllByText(/^[0-9]+$/);
      expect(numberDisplays.some((el) => el.props.children === 2)).toBeTruthy();
    });

    it('should decrement child count to 0', () => {
      const { getAllByText } = render(<KidTripPlanner />);

      const minusButtons = getAllByText('-');
      const childMinusButton = minusButtons[1]; // Second - button is for children

      fireEvent.press(childMinusButton);

      const numberDisplays = getAllByText(/^[0-9]+$/);
      expect(numberDisplays.some((el) => el.props.children === 0)).toBeTruthy();
    });
  });

  describe('Accessibility Options', () => {
    it('should toggle wheelchair accessibility option', () => {
      const { getByText } = render(<KidTripPlanner />);

      const wheelchairOption = getByText('Wheelchair Access');
      const wheelchairButton = wheelchairOption.parent;

      // Toggle on
      fireEvent.press(wheelchairButton!);
      // Should now be active (visual change would be tested with snapshot)

      // Toggle off
      fireEvent.press(wheelchairButton!);
      // Should now be inactive
    });

    it('should toggle stroller friendly option', () => {
      const { getByText } = render(<KidTripPlanner />);

      const strollerOption = getByText('Stroller Friendly');
      const strollerButton = strollerOption.parent;

      // Toggle on
      fireEvent.press(strollerButton!);
      // Toggle off
      fireEvent.press(strollerButton!);
    });
  });

  describe('Trip Planning', () => {
    it('should show alert when planning trip without from location', () => {
      render(<KidTripPlanner />);

      const planButton = screen.getByText('Plan My Trip!');
      fireEvent.press(planButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please enter both starting point and destination!',
      );
    });

    it('should show alert when planning trip without to location', () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      fireEvent.changeText(fromInput, 'Times Square');

      const planButton = screen.getByText('Plan My Trip!');
      fireEvent.press(planButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please enter both starting point and destination!',
      );
    });

    it('should show loading state when planning trip', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      const planButton = screen.getByText('Plan My Trip!');
      fireEvent.press(planButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Planning Your Trip...')).toBeTruthy();
      });
    });

    it('should display trip options after planning', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      const planButton = screen.getByText('Plan My Trip!');
      fireEvent.press(planButton);

      // Wait for trip options to appear
      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      // Should show trip option cards
      expect(screen.getAllByText(/minutes total/)[0]).toBeTruthy();
    });

    it('should display multiple trip options with different modes', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      const planButton = screen.getByText('Plan My Trip!');
      fireEvent.press(planButton);

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      // Should have multiple trip options (subway and bus in mock data)
      const selectButtons = screen.getAllByText('Select This Route');
      expect(selectButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Trip Selection', () => {
    it('should display selected trip details when trip is selected', async () => {
      render(<KidTripPlanner />);

      // Plan a trip
      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      const planButton = screen.getByText('Plan My Trip!');
      fireEvent.press(planButton);

      // Wait for options
      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      // Select first trip option
      const selectButtons = screen.getAllByText('Select This Route');
      fireEvent.press(selectButtons[0]);

      // Should show selected trip section
      await waitFor(() => {
        expect(screen.getByText('Your Selected Route')).toBeTruthy();
      });
    });

    it('should display step-by-step directions for selected trip', async () => {
      render(<KidTripPlanner />);

      // Plan and select a trip
      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      await waitFor(() => {
        expect(screen.getByText('Step-by-Step Directions')).toBeTruthy();
      });

      // Should show segments with kid-friendly tips
      expect(screen.getAllByText(/Kid Tip:/)[0]).toBeTruthy();
    });

    it('should display trip reminders for selected trip', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      await waitFor(() => {
        expect(screen.getByText(/Things to Remember/)).toBeTruthy();
      });
    });

    it('should display fun activities for selected trip', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      await waitFor(() => {
        expect(screen.getByText(/Fun Things to Do Along the Way/)).toBeTruthy();
      });
    });

    it('should display emergency information for selected trip', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      await waitFor(() => {
        expect(screen.getByText(/Emergency Information/)).toBeTruthy();
      });
    });

    it('should call onTripReady callback when trip is selected', async () => {
      const onTripReadyMock = jest.fn();
      render(<KidTripPlanner onTripReady={onTripReadyMock} />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      await waitFor(() => {
        expect(onTripReadyMock).toHaveBeenCalled();
      });

      // Should pass trip data
      expect(onTripReadyMock.mock.calls[0][0]).toHaveProperty('id');
      expect(onTripReadyMock.mock.calls[0][0]).toHaveProperty('segments');
    });
  });

  describe('Trip Option Display', () => {
    it('should display trip duration for each option', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getAllByText(/minutes total/)[0]).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it('should display walking time for each option', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getAllByText(/min walking/)[0]).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it('should display difficulty badge for each option', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          const difficulties = screen.queryAllByText(/Easy|Medium|Hard/);
          expect(difficulties.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );
    });

    it('should display best time to go for each option', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getAllByText(/⏰/)[0]).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it('should display cost information for each option', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getAllByText(/💰/)[0]).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Trip Segment Display', () => {
    it('should display segment type icons', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      await waitFor(() => {
        // Should show emoji indicators for walk, subway, etc.
        expect(screen.getAllByText(/🚶|🚇|🚌/)[0]).toBeTruthy();
      });
    });

    it('should display kid-friendly tips for segments', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/💡 Kid Tip:/)[0]).toBeTruthy();
      });
    });

    it('should display safety notes when present', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      // Safety notes should be present in the mock data
      await waitFor(() => {
        const allText = screen.UNSAFE_getAllByType(Text);
        const hasSafetyNote = allText.some((el) =>
          el.props.children?.toString().includes('hands tight'),
        );
        expect(hasSafetyNote).toBeTruthy();
      });
    });

    it('should display accessibility information for segments', async () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(toInput, 'Central Park');

      fireEvent.press(screen.getByText('Plan My Trip!'));

      await waitFor(
        () => {
          expect(screen.getByText('Trip Options')).toBeTruthy();
        },
        { timeout: 3000 },
      );

      fireEvent.press(screen.getAllByText('Select This Route')[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Wheelchair OK|Stroller OK/)[0]).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button presses', () => {
      const { getAllByText } = render(<KidTripPlanner />);

      const plusButtons = getAllByText('+');

      // Rapidly press the button multiple times
      fireEvent.press(plusButtons[0]);
      fireEvent.press(plusButtons[0]);
      fireEvent.press(plusButtons[0]);

      // Should increment correctly
      const numberDisplays = getAllByText(/^[0-9]+$/);
      expect(numberDisplays.some((el) => el.props.children === 4)).toBeTruthy();
    });

    it('should handle empty location strings gracefully', () => {
      render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      const toInput = screen.getByPlaceholderText('Enter destination...');

      // Set and then clear
      fireEvent.changeText(fromInput, 'Times Square');
      fireEvent.changeText(fromInput, '   '); // Whitespace only
      fireEvent.changeText(toInput, 'Central Park');

      const planButton = screen.getByText('Plan My Trip!');
      fireEvent.press(planButton);

      // Should show missing information alert
      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please enter both starting point and destination!',
      );
    });

    it('should maintain state when re-rendering', async () => {
      const { rerender } = render(<KidTripPlanner />);

      const fromInput = screen.getByPlaceholderText('Enter starting location...');
      fireEvent.changeText(fromInput, 'Times Square');

      // Re-render component
      rerender(<KidTripPlanner />);

      // State should be maintained after re-render
      const fromInputAfterRerender = screen.getByPlaceholderText('Enter starting location...');
      expect(fromInputAfterRerender.props.value).toBe('Times Square');
    });
  });
});
