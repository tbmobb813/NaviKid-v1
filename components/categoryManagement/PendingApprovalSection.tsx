import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { CustomCategory } from '@/types/navigation';
import { CategoryItem } from './CategoryItem';

type PendingApprovalSectionProps = {
  categories: CustomCategory[];
  onApprove: (categoryId: string) => void;
  onDelete: (category: CustomCategory) => void;
};

export const PendingApprovalSection: React.FC<PendingApprovalSectionProps> = ({
  categories,
  onApprove,
  onDelete,
}) => {
  if (categories.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pending Approval</Text>
      <Text style={styles.sectionDescription}>
        Categories created by your child that need approval
      </Text>
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          showActions={true}
          isPending={true}
          onApprove={() => onApprove(category.id)}
          onDelete={() => onDelete(category)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
});
