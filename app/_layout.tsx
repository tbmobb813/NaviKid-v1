import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CategoryProvider } from '@/stores/categoryStore';
import { ParentalProvider } from '@/stores/parentalStore';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { PrivacyConsentModal, usePrivacyConsentModal } from '@/components/PrivacyConsentModal';
import { usePrivacyStore } from '@/stores/privacyStore';
import { initializePlausible } from '@/hooks/usePlausible';
import { initializeDataRetention } from '@/stores/dataRetentionStore';

Sentry.init({
  dsn: Constants?.manifest?.extra?.SENTRY_DSN,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: false,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function RootLayoutContent() {
  const { consentDismissed } = usePrivacyStore();
  const { visible, hide } = usePrivacyConsentModal();

  // Initialize analytics and data retention on app startup
  useEffect(() => {
    initializePlausible();
    initializeDataRetention();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CategoryProvider>
            <ParentalProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </ParentalProvider>
          </CategoryProvider>
        </AuthProvider>
      </QueryClientProvider>

      {/* Privacy Consent Modal - shows on first app load if consent not given */}
      <PrivacyConsentModal visible={visible} onDismiss={hide} />
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayoutContent);