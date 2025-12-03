import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';

type CheckInRequest = {
  id: string;
  requestedAt: number;
  message: string;
  status: string;
};

type PendingCategory = {
  id: string;
  name: string;
};

type AlertsSectionProps = {
  pendingCheckIns: CheckInRequest[];
  pendingCategories: PendingCategory[];
  onApproveCategory: (categoryId: string) => void;
  formatTime: (timestamp: number) => string;
};

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  pendingCheckIns,
  pendingCategories,
  onApproveCategory,
  formatTime,
}) => {
  if (pendingCheckIns.length === 0 && pendingCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Alerts</Text>

      {pendingCheckIns.map((request) => (
        <View key={request.id} style={styles.alertCard}>
          <AlertTriangle size={20} color={Colors.warning} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Pending Check-in Request</Text>
            <Text style={styles.alertSubtitle}>
              Sent {formatTime(request.requestedAt)} - {request.message}
            </Text>
          </View>
        </View>
      ))}

      {pendingCategories.map((category) => (
        <View key={category.id} style={styles.alertCard}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Category Approval Needed</Text>
            <Text style={styles.alertSubtitle}>
              Child wants to add &quot;{category.name}&quot; category
            </Text>
          </View>
          <Pressable style={styles.approveButton} onPress={() => onApproveCategory(category.id)}>
            <Text style={styles.approveButtonText}>Approve</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  approveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
