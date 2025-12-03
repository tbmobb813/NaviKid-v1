import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import Colors from '@/constants/colors';
import {
  Shield,
  Camera,
  Phone,
  Settings,
  Plus,
  Eye,
  LogOut,
} from 'lucide-react-native';
import { useParentalStore } from '@/stores/parentalStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { logger } from '@/utils/logger';
import SafeZoneManagement from '@/components/SafeZoneManagement';
import { SafeZoneStatusCard } from '@/components/SafeZoneStatusCard';
import { SafeZoneActivityLog } from '@/components/SafeZoneActivityLog';
import DevicePingHistory from '@/components/DevicePingHistory';
import { useGeofenceEvents } from '@/hooks/useGeofenceEvents';
import {
  QuickActions,
  AlertsSection,
  LastKnownLocation,
  RecentCheckIns,
} from '@/components/parentDashboard';

type ParentDashboardProps = {
  onExit: () => void;
};

const ParentDashboard: React.FC<ParentDashboardProps> = ({ onExit }) => {
  const { dashboardData, checkInRequests, safeZones, settings, sendDevicePing, requestCheckIn } =
    useParentalStore();

  // Listen for real-time geofence events from background tasks
  useGeofenceEvents((event) => {
    // Real-time dashboard updates when child enters/exits safe zones
    logger.info(`Real-time geofence ${event.type}: ${event.regionId}`, event);

    // Optional: Show in-app notification or update UI state
    // You can add additional logic here to:
    // - Update a local state to show recent activity
    // - Display a toast notification
    // - Trigger sound/vibration alerts
    // - Send notifications to other parent devices via backend API
  });

  const { getPendingCategories, approveCategory } = useCategoryStore();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'checkins' | 'safezones' | 'pings' | 'settings'
  >('overview');
  const [showSafeZoneManagement, setShowSafeZoneManagement] = useState(false);

  const pendingCategories = getPendingCategories();
  const pendingCheckIns = checkInRequests.filter((req) => req.status === 'pending');

  const handleRequestCheckIn = () => {
    Alert.alert('Request Check-in', 'Send a check-in request to your child?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Request',
        onPress: () => {
          requestCheckIn('Please check in and let me know you are safe', false);
          Alert.alert('Request Sent', 'Your child will receive a check-in request');
        },
      },
    ]);
  };

  const handleDevicePing = (type: 'location' | 'ring') => {
    const message =
      type === 'location' ? 'Parent requested your location' : 'Parent is pinging your device';
    sendDevicePing(type, message);
    Alert.alert(
      'Ping Sent',
      `${type === 'location' ? 'Location request' : 'Device ping'} sent to child's device`,
    );
  };

  const handleSendMessage = () => {
    Alert.prompt(
      'Send Message',
      'Enter a message to send to your child:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: (message?: string) => {
            if (message && message.trim()) {
              sendDevicePing('message', message.trim());
              Alert.alert('Message Sent', 'Your message has been sent to your child');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default',
    );
  };

  const handleApproveCategory = (categoryId: string) => {
    approveCategory(categoryId);
    Alert.alert('Category Approved', 'The category has been approved and is now available');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const TabButton = ({
    id,
    title,
    icon,
  }: {
    id: typeof activeTab;
    title: string;
    icon: React.ReactNode;
  }) => (
    <Pressable
      style={[styles.tabButton, activeTab === id && styles.activeTab]}
      onPress={() => setActiveTab(id)}
    >
      {icon}
      <Text style={[styles.tabText, activeTab === id && styles.activeTabText]}>{title}</Text>
    </Pressable>
  );

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <QuickActions
        onRequestCheckIn={handleRequestCheckIn}
        onGetLocation={() => handleDevicePing('location')}
        onRingDevice={() => handleDevicePing('ring')}
        onSendMessage={handleSendMessage}
      />

      <AlertsSection
        pendingCheckIns={pendingCheckIns}
        pendingCategories={pendingCategories}
        onApproveCategory={handleApproveCategory}
        formatTime={formatTime}
      />

      {dashboardData.lastKnownLocation && (
        <LastKnownLocation
          placeName={dashboardData.lastKnownLocation.placeName}
          timestamp={dashboardData.lastKnownLocation.timestamp}
          formatTime={formatTime}
          formatDate={formatDate}
        />
      )}

      <RecentCheckIns
        checkIns={dashboardData.recentCheckIns}
        formatTime={formatTime}
        formatDate={formatDate}
        limit={3}
      />
    </View>
  );

  const renderCheckIns = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>All Check-ins</Text>
      <RecentCheckIns
        checkIns={dashboardData.recentCheckIns}
        formatTime={formatTime}
        formatDate={formatDate}
        showTitle={false}
      />
    </View>
  );

  const renderSafeZones = () => (
    <ScrollView style={styles.safeZonesContent} showsVerticalScrollIndicator={false}>
      <SafeZoneStatusCard />
      <SafeZoneManagementSection
        safeZones={safeZones}
        onAddSafeZone={() => setShowSafeZoneManagement(true)}
      />
      <SafeZoneActivityLog />
    </ScrollView>
  );

  const renderPings = () => <DevicePingHistory testId="device-ping-history" />;

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parental Settings</Text>
        <CategorySettings
          allowChildCategoryCreation={settings.allowChildCategoryCreation}
          requireApprovalForCategories={settings.requireApprovalForCategories}
        />
        <SafetySettings
          safeZoneAlerts={settings.safeZoneAlerts}
          checkInReminders={settings.checkInReminders}
        />
        <EmergencyContactsList contacts={settings.emergencyContacts} />
      </View>
    </View>
  );

  if (showSafeZoneManagement) {
    return <SafeZoneManagement onBack={() => setShowSafeZoneManagement(false)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Shield size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Parent Dashboard</Text>
        </View>
        <Pressable style={styles.exitButton} onPress={onExit} testID="exit-button">
          <LogOut size={20} color={Colors.textLight} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <TabButton
          id="overview"
          title="Overview"
          icon={<Eye size={16} color={activeTab === 'overview' ? '#FFFFFF' : Colors.textLight} />}
        />
        <TabButton
          id="checkins"
          title="Check-ins"
          icon={
            <Camera size={16} color={activeTab === 'checkins' ? '#FFFFFF' : Colors.textLight} />
          }
        />
        <TabButton
          id="safezones"
          title="Safe Zones"
          icon={
            <Shield size={16} color={activeTab === 'safezones' ? '#FFFFFF' : Colors.textLight} />
          }
        />
        <TabButton
          id="pings"
          title="Device Pings"
          icon={<Phone size={16} color={activeTab === 'pings' ? '#FFFFFF' : Colors.textLight} />}
        />
        <TabButton
          id="settings"
          title="Settings"
          icon={
            <Settings size={16} color={activeTab === 'settings' ? '#FFFFFF' : Colors.textLight} />
          }
        />
      </View>

      {activeTab === 'safezones' ? (
        renderSafeZones()
      ) : activeTab === 'pings' ? (
        renderPings()
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'checkins' && renderCheckIns()}
          {activeTab === 'settings' && renderSettings()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  exitButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textLight,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  addButton: {
    padding: 8,
  },
  safeZoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  safeZoneContent: {
    flex: 1,
  },
  safeZoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  safeZoneSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  settingCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  safeZonesContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default ParentDashboard;
