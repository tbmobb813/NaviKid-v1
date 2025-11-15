/**
 * Privacy Consent Modal
 *
 * Displays consent prompt for analytics.
 * Privacy-first: Users must opt-in to analytics tracking.
 * COPPA-compliant: No data sent without explicit consent.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { usePrivacyStore } from '@/stores/privacyStore';

interface PrivacyConsentModalProps {
  visible: boolean;
  onDismiss?: () => void;
}

/**
 * Privacy Consent Modal Component
 *
 * Shows privacy policy and asks for analytics consent.
 * Users can accept or decline analytics.
 */
export function PrivacyConsentModal({ visible, onDismiss }: PrivacyConsentModalProps) {
  const { setAnalyticsEnabled, dismissConsentPrompt } = usePrivacyStore();

  const handleAccept = () => {
    setAnalyticsEnabled(true);
    onDismiss?.();
  };

  const handleDecline = () => {
    setAnalyticsEnabled(false);
    dismissConsentPrompt();
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        // On Android, allow back button to dismiss
        handleDecline();
      }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Privacy & Analytics</Text>
            <Text style={styles.subtitle}>Help us improve your experience</Text>
          </View>

          {/* Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 What is Analytics?</Text>
            <Text style={styles.sectionText}>
              We use Plausible Analytics to understand how you use our app. This helps us improve
              features and fix issues.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ What We Track (with your permission)</Text>
            <View style={styles.bulletList}>
              <BulletPoint text="Which screens you visit" />
              <BulletPoint text="Features you use" />
              <BulletPoint text="How long you spend in the app" />
              <BulletPoint text="Your device type (iOS/Android)" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚫 What We Never Track</Text>
            <View style={styles.bulletList}>
              <BulletPoint text="Your location (unless you share it)" />
              <BulletPoint text="Your name or email" />
              <BulletPoint text="Your personal information" />
              <BulletPoint text="Your child's identity or data" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Privacy & COPPA</Text>
            <Text style={styles.sectionText}>
              Kid-Friendly Map is fully compliant with COPPA (Children's Online Privacy Protection
              Act). We never sell your data and keep your information private.
            </Text>
            <Text style={styles.sectionText}>
              You can change your privacy settings at any time in the app settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Learn More</Text>
            <Text style={styles.sectionText}>
              For more details, please review our <Text style={styles.link}>Privacy Policy</Text>{' '}
              and <Text style={styles.link}>Terms of Service</Text>.
            </Text>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            activeOpacity={0.7}
          >
            <Text style={styles.declineButtonText}>Decline Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
            activeOpacity={0.7}
          >
            <Text style={styles.acceptButtonText}>Accept & Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Bullet point component for list items
 */
function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletPoint}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

/**
 * Custom hook to show consent modal if needed
 */
export function usePrivacyConsentModal() {
  const [visible, setVisible] = React.useState(false);
  const { consentDismissed, getConsentStatus } = usePrivacyStore();

  // Show modal on first load if consent not given
  React.useEffect(() => {
    if (!consentDismissed && getConsentStatus() === 'unknown') {
      setVisible(true);
    }
  }, [consentDismissed, getConsentStatus]);

  return {
    visible,
    show: () => setVisible(true),
    hide: () => setVisible(false),
  };
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  bulletList: {
    marginLeft: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 16,
  },
  bullet: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 12,
    fontWeight: '600',
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    flex: 1,
  },
  link: {
    color: '#2196F3',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  spacer: {
    height: 100,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
    gap: 12,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  declineButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
