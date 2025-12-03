import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ParentDashboard from '@/components/ParentDashboard';
import { useParentalStore } from '@/stores/parentalStore';
import { useCategoryStore } from '@/stores/categoryStore';

// Mock Alert
jest.spyOn(Alert, 'alert');
jest.spyOn(Alert, 'prompt');

// Mock the stores
jest.mock('@/stores/parentalStore');
jest.mock('@/stores/categoryStore');

// Mock child components
jest.mock('@/components/SafeZoneManagement', () => ({
  __esModule: true,
  default: ({ onBack }: { onBack: () => void }) => {
    const { View, Text, Pressable } = require('react-native');
    return (
      <View testID="safe-zone-management">
        <Text>Safe Zone Management</Text>
        <Pressable testID="back-button" onPress={onBack}>
          <Text>Back</Text>
        </Pressable>
      </View>
    );
  },
}));

jest.mock('@/components/SafeZoneStatusCard', () => ({
  SafeZoneStatusCard: () => {
    const { View, Text } = require('react-native');
    return (
      <View testID="safe-zone-status-card">
        <Text>Safe Zone Status</Text>
      </View>
    );
  },
}));

jest.mock('@/components/SafeZoneActivityLog', () => ({
  SafeZoneActivityLog: () => {
    const { View, Text } = require('react-native');
    return (
      <View testID="safe-zone-activity-log">
        <Text>Activity Log</Text>
      </View>
    );
  },
}));

jest.mock('@/components/DevicePingHistory', () => ({
  __esModule: true,
  default: ({ testId }: { testId: string }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testId}>
        <Text>Device Ping History</Text>
      </View>
    );
  },
}));

jest.mock('@/hooks/useGeofenceEvents', () => ({
  useGeofenceEvents: jest.fn(),
}));

// Mock data
const mockDashboardData = {
  lastKnownLocation: {
    placeName: 'Central Park',
    latitude: 40.785091,
    longitude: -73.968285,
    timestamp: Date.now() - 300000, // 5 minutes ago
  },
  recentCheckIns: [
    {
      id: '1',
      placeName: 'School',
      timestamp: Date.now() - 3600000, // 1 hour ago
      photoUrl: 'https://example.com/photo1.jpg',
      location: { latitude: 40.7589, longitude: -73.9851 },
    },
    {
      id: '2',
      placeName: 'Library',
      timestamp: Date.now() - 7200000, // 2 hours ago
      photoUrl: null,
      location: { latitude: 40.7614, longitude: -73.9776 },
    },
  ],
};

const mockCheckInRequests = [
  {
    id: 'req1',
    message: 'Please check in',
    status: 'pending' as const,
    requestedAt: Date.now() - 600000, // 10 minutes ago
  },
  {
    id: 'req2',
    message: 'Are you safe?',
    status: 'completed' as const,
    requestedAt: Date.now() - 1200000, // 20 minutes ago
  },
];

const mockSafeZones = [
  {
    id: 'zone1',
    name: 'Home',
    latitude: 40.7589,
    longitude: -73.9851,
    radius: 100,
    isActive: true,
    notifications: { onEntry: true, onExit: true },
  },
  {
    id: 'zone2',
    name: 'School',
    latitude: 40.7614,
    longitude: -73.9776,
    radius: 50,
    isActive: true,
    notifications: { onEntry: true, onExit: false },
  },
];

const mockSettings = {
  allowChildCategoryCreation: true,
  requireApprovalForCategories: true,
  safeZoneAlerts: true,
  checkInReminders: true,
  emergencyContacts: [
    {
      id: 'contact1',
      name: 'Mom',
      phone: '555-0100',
      relationship: 'mother' as const,
      isPrimary: true,
    },
    {
      id: 'contact2',
      name: 'Dad',
      phone: '555-0101',
      relationship: 'father' as const,
      isPrimary: false,
    },
  ],
};

const mockPendingCategories = [
  {
    id: 'cat1',
    name: 'Gaming Store',
    icon: '🎮',
    color: '#FF6B6B',
    isDefault: false,
    createdBy: 'child' as const,
    isApproved: false,
    createdAt: Date.now() - 1800000,
  },
];

describe('ParentDashboard', () => {
  const mockOnExit = jest.fn();
  const mockSendDevicePing = jest.fn();
  const mockRequestCheckIn = jest.fn();
  const mockGetPendingCategories = jest.fn();
  const mockApproveCategory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup store mocks
    (useParentalStore as unknown as jest.Mock).mockReturnValue({
      dashboardData: mockDashboardData,
      checkInRequests: mockCheckInRequests,
      safeZones: mockSafeZones,
      settings: mockSettings,
      sendDevicePing: mockSendDevicePing,
      requestCheckIn: mockRequestCheckIn,
    });

    (useCategoryStore as unknown as jest.Mock).mockReturnValue({
      getPendingCategories: mockGetPendingCategories,
      approveCategory: mockApproveCategory,
    });

    mockGetPendingCategories.mockReturnValue(mockPendingCategories);
  });

  describe('Initial Rendering', () => {
    it('should render the dashboard header', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('Parent Dashboard')).toBeTruthy();
    });

    it('should render all tab buttons', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('Overview')).toBeTruthy();
      expect(screen.getByText('Check-ins')).toBeTruthy();
      expect(screen.getByText('Safe Zones')).toBeTruthy();
      expect(screen.getByText('Device Pings')).toBeTruthy();
      expect(screen.getByText('Settings')).toBeTruthy();
    });

    it('should render overview tab by default', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('Quick Actions')).toBeTruthy();
    });

    it('should render exit button', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const exitButton = screen.getAllByTestId('lucide-icon')[0]; // LogOut icon
      expect(exitButton).toBeTruthy();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to check-ins tab when clicked', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const checkInsTab = screen.getByText('Check-ins');
      fireEvent.press(checkInsTab);

      expect(screen.getByText('All Check-ins')).toBeTruthy();
    });

    it('should switch to safe zones tab when clicked', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const safeZonesTab = screen.getByText('Safe Zones');
      fireEvent.press(safeZonesTab);

      expect(screen.getByTestId('safe-zone-status-card')).toBeTruthy();
    });

    it('should switch to device pings tab when clicked', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const pingsTab = screen.getByText('Device Pings');
      fireEvent.press(pingsTab);

      expect(screen.getByTestId('device-ping-history')).toBeTruthy();
    });

    it('should switch to settings tab when clicked', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const settingsTab = screen.getByText('Settings');
      fireEvent.press(settingsTab);

      expect(screen.getByText('Parental Settings')).toBeTruthy();
    });

    it('should switch back to overview tab', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      // Switch to another tab first
      fireEvent.press(screen.getByText('Settings'));

      // Switch back to overview
      fireEvent.press(screen.getByText('Overview'));

      expect(screen.getByText('Quick Actions')).toBeTruthy();
    });
  });

  describe('Quick Actions', () => {
    it('should show request check-in dialog when button is pressed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const requestCheckInButton = screen.getByText('Request Check-in');
      fireEvent.press(requestCheckInButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Request Check-in',
        'Send a check-in request to your child?',
        expect.any(Array),
      );
    });

    it('should send check-in request when confirmed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const requestCheckInButton = screen.getByText('Request Check-in');
      fireEvent.press(requestCheckInButton);

      // Simulate confirming the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const lastCall = alertCalls[alertCalls.length - 1];
      const confirmButton = lastCall[2][1]; // Second button (Send Request)
      confirmButton.onPress();

      expect(mockRequestCheckIn).toHaveBeenCalledWith(
        'Please check in and let me know you are safe',
        false,
      );
    });

    it('should show get location alert when button is pressed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const getLocationButton = screen.getByText('Get Location');
      fireEvent.press(getLocationButton);

      expect(mockSendDevicePing).toHaveBeenCalledWith('location', 'Parent requested your location');
      expect(Alert.alert).toHaveBeenCalledWith('Ping Sent', expect.any(String));
    });

    it('should show ring device alert when button is pressed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const ringButton = screen.getByText('Ring Device');
      fireEvent.press(ringButton);

      expect(mockSendDevicePing).toHaveBeenCalledWith('ring', 'Parent is pinging your device');
      expect(Alert.alert).toHaveBeenCalledWith('Ping Sent', expect.any(String));
    });

    it('should show send message prompt when button is pressed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const sendMessageButton = screen.getByText('Send Message');
      fireEvent.press(sendMessageButton);

      expect(Alert.prompt).toHaveBeenCalledWith(
        'Send Message',
        'Enter a message to send to your child:',
        expect.any(Array),
        'plain-text',
        '',
        'default',
      );
    });

    it('should send message when prompt is confirmed with text', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const sendMessageButton = screen.getByText('Send Message');
      fireEvent.press(sendMessageButton);

      // Simulate entering a message and confirming
      const promptCalls = (Alert.prompt as jest.Mock).mock.calls;
      const lastCall = promptCalls[promptCalls.length - 1];
      const sendButton = lastCall[2][1]; // Second button (Send)
      sendButton.onPress('Hello from parent');

      expect(mockSendDevicePing).toHaveBeenCalledWith('message', 'Hello from parent');
    });

    it('should not send message when prompt text is empty', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const sendMessageButton = screen.getByText('Send Message');
      fireEvent.press(sendMessageButton);

      const promptCalls = (Alert.prompt as jest.Mock).mock.calls;
      const lastCall = promptCalls[promptCalls.length - 1];
      const sendButton = lastCall[2][1];
      sendButton.onPress('   '); // Only whitespace

      expect(mockSendDevicePing).not.toHaveBeenCalled();
    });
  });

  describe('Alerts Display', () => {
    it('should display pending check-in requests', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('Alerts')).toBeTruthy();
      expect(screen.getByText('Pending Check-in Request')).toBeTruthy();
      expect(screen.getByText(/Please check in/)).toBeTruthy();
    });

    it('should display pending category approvals', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('Category Approval Needed')).toBeTruthy();
      expect(screen.getByText(/Gaming Store/)).toBeTruthy();
    });

    it('should approve category when approve button is pressed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      const approveButton = screen.getByText('Approve');
      fireEvent.press(approveButton);

      expect(mockApproveCategory).toHaveBeenCalledWith('cat1');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Category Approved',
        'The category has been approved and is now available',
      );
    });

    it('should not show alerts section when no pending items', () => {
      mockGetPendingCategories.mockReturnValue([]);
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: mockDashboardData,
        checkInRequests: [],
        safeZones: mockSafeZones,
        settings: mockSettings,
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.queryByText('Alerts')).toBeNull();
    });
  });

  describe('Last Known Location', () => {
    it('should display last known location when available', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('Last Known Location')).toBeTruthy();
      expect(screen.getByText('Central Park')).toBeTruthy();
    });

    it('should show Unknown Location when place name is not available', () => {
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: {
          ...mockDashboardData,
          lastKnownLocation: {
            ...mockDashboardData.lastKnownLocation!,
            placeName: null,
          },
        },
        checkInRequests: mockCheckInRequests,
        safeZones: mockSafeZones,
        settings: mockSettings,
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('Unknown Location')).toBeTruthy();
    });

    it('should not display last known location section when not available', () => {
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: { ...mockDashboardData, lastKnownLocation: null },
        checkInRequests: mockCheckInRequests,
        safeZones: mockSafeZones,
        settings: mockSettings,
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.queryByText('Last Known Location')).toBeNull();
    });
  });

  describe('Recent Check-ins', () => {
    it('should display recent check-ins on overview tab', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('Recent Check-ins')).toBeTruthy();
      expect(screen.getByText('School')).toBeTruthy();
      expect(screen.getByText('Library')).toBeTruthy();
    });

    it('should limit recent check-ins to 3 on overview tab', () => {
      const manyCheckIns = Array.from({ length: 10 }, (_, i) => ({
        id: `checkin${i}`,
        placeName: `Place ${i}`,
        timestamp: Date.now() - i * 3600000,
        photoUrl: null,
        location: { latitude: 40.7589, longitude: -73.9851 },
      }));

      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: { ...mockDashboardData, recentCheckIns: manyCheckIns },
        checkInRequests: mockCheckInRequests,
        safeZones: mockSafeZones,
        settings: mockSettings,
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      // Should only show first 3
      expect(screen.getByText('Place 0')).toBeTruthy();
      expect(screen.getByText('Place 1')).toBeTruthy();
      expect(screen.getByText('Place 2')).toBeTruthy();
      expect(screen.queryByText('Place 3')).toBeNull();
    });

    it('should show empty state when no recent check-ins', () => {
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: { ...mockDashboardData, recentCheckIns: [] },
        checkInRequests: mockCheckInRequests,
        safeZones: mockSafeZones,
        settings: mockSettings,
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      expect(screen.getByText('No recent check-ins')).toBeTruthy();
    });

    it('should display all check-ins on check-ins tab', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Check-ins'));

      expect(screen.getByText('All Check-ins')).toBeTruthy();
      expect(screen.getByText('School')).toBeTruthy();
      expect(screen.getByText('Library')).toBeTruthy();
    });

    it('should display check-in coordinates when available', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Check-ins'));

      // Coordinates should be formatted to 4 decimal places
      expect(screen.getByText(/40\.7589.*-73\.9851/)).toBeTruthy();
    });
  });

  describe('Safe Zones', () => {
    it('should display safe zones on safe zones tab', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Safe Zones'));

      expect(screen.getByText('Manage Safe Zones')).toBeTruthy();
      expect(screen.getByText('Home')).toBeTruthy();
      expect(screen.getByText('School')).toBeTruthy();
    });

    it('should display safe zone details', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Safe Zones'));

      expect(screen.getByText(/Radius: 100m.*Active/)).toBeTruthy();
      expect(screen.getByText(/Entry & Exit/)).toBeTruthy();
    });

    it('should show empty state when no safe zones exist', () => {
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: mockDashboardData,
        checkInRequests: mockCheckInRequests,
        safeZones: [],
        settings: mockSettings,
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Safe Zones'));

      expect(screen.getByText('No Safe Zones')).toBeTruthy();
      expect(screen.getByText(/Create safe zones to monitor/)).toBeTruthy();
    });

    it('should open safe zone management when add button is pressed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Safe Zones'));

      // Find and press the add button (Plus icon)
      const icons = screen.getAllByTestId('lucide-icon');
      const addButton = icons[icons.length - 1]; // Plus icon typically last
      fireEvent.press(addButton);

      expect(screen.getByTestId('safe-zone-management')).toBeTruthy();
    });

    it('should open safe zone management from empty state', () => {
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: mockDashboardData,
        checkInRequests: mockCheckInRequests,
        safeZones: [],
        settings: mockSettings,
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Safe Zones'));

      const createButton = screen.getByText('Create Safe Zone');
      fireEvent.press(createButton);

      expect(screen.getByTestId('safe-zone-management')).toBeTruthy();
    });

    it('should close safe zone management when back is pressed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Safe Zones'));

      // Open management
      const icons = screen.getAllByTestId('lucide-icon');
      const addButton = icons[icons.length - 1]; // Plus icon
      fireEvent.press(addButton);

      // Close management
      const backButton = screen.getByTestId('back-button');
      fireEvent.press(backButton);

      expect(screen.queryByTestId('safe-zone-management')).toBeNull();
      expect(screen.getByText('Manage Safe Zones')).toBeTruthy();
    });

    it('should render safe zone status card', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Safe Zones'));

      expect(screen.getByTestId('safe-zone-status-card')).toBeTruthy();
    });

    it('should render safe zone activity log', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Safe Zones'));

      expect(screen.getByTestId('safe-zone-activity-log')).toBeTruthy();
    });
  });

  describe('Settings Display', () => {
    it('should display parental settings', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Settings'));

      expect(screen.getByText('Parental Settings')).toBeTruthy();
      expect(screen.getByText('Category Management')).toBeTruthy();
      expect(screen.getByText('Safety Settings')).toBeTruthy();
      expect(screen.getByText('Emergency Contacts')).toBeTruthy();
    });

    it('should display category management settings', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Settings'));

      expect(screen.getByText(/Child can create categories: Yes/)).toBeTruthy();
      expect(screen.getByText(/Requires approval: Yes/)).toBeTruthy();
    });

    it('should display safety settings', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Settings'));

      expect(screen.getByText(/Safe zone alerts: Enabled/)).toBeTruthy();
      expect(screen.getByText(/Check-in reminders: Enabled/)).toBeTruthy();
    });

    it('should display emergency contacts', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Settings'));

      expect(screen.getByText(/Mom.*mother.*555-0100.*Primary/)).toBeTruthy();
      expect(screen.getByText(/Dad.*father.*555-0101/)).toBeTruthy();
    });

    it('should display disabled states correctly', () => {
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: mockDashboardData,
        checkInRequests: mockCheckInRequests,
        safeZones: mockSafeZones,
        settings: {
          ...mockSettings,
          allowChildCategoryCreation: false,
          safeZoneAlerts: false,
        },
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Settings'));

      expect(screen.getByText(/Child can create categories: No/)).toBeTruthy();
      expect(screen.getByText(/Safe zone alerts: Disabled/)).toBeTruthy();
    });
  });

  describe('Exit Functionality', () => {
    it('should call onExit when exit button is pressed', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      // Find the exit button (LogOut icon in header)
      const exitButton = screen.getAllByTestId('lucide-icon')[0];
      fireEvent.press(exitButton);

      expect(mockOnExit).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid tab switching', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      // Rapidly switch tabs
      fireEvent.press(screen.getByText('Check-ins'));
      fireEvent.press(screen.getByText('Settings'));
      fireEvent.press(screen.getByText('Safe Zones'));
      fireEvent.press(screen.getByText('Overview'));

      // Should end up on overview tab
      expect(screen.getByText('Quick Actions')).toBeTruthy();
    });

    it('should handle null values gracefully', () => {
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: {
          lastKnownLocation: null,
          recentCheckIns: [],
        },
        checkInRequests: [],
        safeZones: [],
        settings: {
          allowChildCategoryCreation: false,
          requireApprovalForCategories: false,
          safeZoneAlerts: false,
          checkInReminders: false,
          emergencyContacts: [],
        },
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      // Should render without crashing
      expect(screen.getByText('Parent Dashboard')).toBeTruthy();
    });

    it('should handle empty emergency contacts list', () => {
      (useParentalStore as unknown as jest.Mock).mockReturnValue({
        dashboardData: mockDashboardData,
        checkInRequests: mockCheckInRequests,
        safeZones: mockSafeZones,
        settings: {
          ...mockSettings,
          emergencyContacts: [],
        },
        sendDevicePing: mockSendDevicePing,
        requestCheckIn: mockRequestCheckIn,
      });

      render(<ParentDashboard onExit={mockOnExit} />);

      fireEvent.press(screen.getByText('Settings'));

      // Should still render Emergency Contacts section
      expect(screen.getByText('Emergency Contacts')).toBeTruthy();
    });

    it('should maintain tab state after quick actions', () => {
      render(<ParentDashboard onExit={mockOnExit} />);

      // Switch to settings tab
      fireEvent.press(screen.getByText('Settings'));

      // Perform a quick action
      fireEvent.press(screen.getByText('Overview'));
      const requestCheckInButton = screen.getByText('Request Check-in');
      fireEvent.press(requestCheckInButton);

      // Should still be on overview tab
      expect(screen.getByText('Quick Actions')).toBeTruthy();
    });
  });
});
