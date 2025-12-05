import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

type CategorySettingsProps = {
  allowChildCategoryCreation: boolean;
  requireApprovalForCategories: boolean;
};

export const CategorySettings: React.FC<CategorySettingsProps> = ({
  allowChildCategoryCreation,
  requireApprovalForCategories,
}) => {
  return (
    <View style={styles.settingCard}>
      <Text style={styles.settingTitle}>Category Management</Text>
      <Text style={styles.settingSubtitle}>
        Child can create categories: {allowChildCategoryCreation ? 'Yes' : 'No'}
      </Text>
      <Text style={styles.settingSubtitle}>
        Requires approval: {requireApprovalForCategories ? 'Yes' : 'No'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
