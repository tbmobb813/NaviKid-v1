import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { CustomCategory } from '@/types/navigation';
import { CategoryItem } from './CategoryItem';

type AllCategoriesSectionProps = {
  categories: CustomCategory[];
  userMode: 'parent' | 'child';
  onEdit: (category: CustomCategory) => void;
  onDelete: (category: CustomCategory) => void;
};

export const AllCategoriesSection: React.FC<AllCategoriesSectionProps> = ({
  categories,
  userMode,
  onEdit,
  onDelete,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>All Categories</Text>
    <Text style={styles.sectionDescription}>
      {userMode === 'parent'
        ? 'Manage all categories available to your child'
        : 'Your available categories'}
    </Text>
    {categories.map((category) => {
      const canEditDelete =
        !category.isDefault && (userMode === 'parent' || category.createdBy === userMode);

      return (
        <CategoryItem
          key={category.id}
          category={category}
          showActions={canEditDelete}
          onEdit={canEditDelete ? () => onEdit(category) : undefined}
          onDelete={canEditDelete ? () => onDelete(category) : undefined}
        />
      );
    })}
  </View>
);

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
