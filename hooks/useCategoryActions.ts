import { Alert } from 'react-native';
import { CustomCategory } from '@/types/navigation';
import { useCategoryManagement } from '@/stores/categoryStore';

export const useCategoryActions = (
  userMode: 'parent' | 'child',
  onSuccess: () => void,
) => {
  const {
    settings,
    addCategory,
    updateCategory,
    deleteCategory,
    approveCategory,
    canCreateCategory,
    needsApproval,
  } = useCategoryManagement();

  const handleCreateCategory = async (
    name: string,
    icon: string,
    color: string,
  ): Promise<boolean> => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return false;
    }

    if (!canCreateCategory(userMode)) {
      Alert.alert(
        'Limit Reached',
        `You can only create up to ${settings.maxCustomCategories} custom categories.`,
      );
      return false;
    }

    try {
      const isApproved = !needsApproval(userMode);

      await addCategory({
        name: name.trim(),
        icon,
        color,
        isDefault: false,
        createdBy: userMode,
        isApproved,
      });

      onSuccess();

      if (needsApproval(userMode)) {
        Alert.alert(
          'Category Created',
          'Your category has been created and is waiting for parent approval.',
        );
      } else {
        Alert.alert('Success', 'Category created successfully!');
      }

      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to create category. Please try again.');
      return false;
    }
  };

  const handleEditCategory = async (
    categoryId: string,
    name: string,
    icon: string,
    color: string,
  ): Promise<boolean> => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return false;
    }

    try {
      await updateCategory(categoryId, {
        name: name.trim(),
        icon,
        color,
      });

      onSuccess();
      Alert.alert('Success', 'Category updated successfully!');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to update category. Please try again.');
      return false;
    }
  };

  const handleDeleteCategory = (category: CustomCategory) => {
    if (category.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
      return;
    }

    Alert.alert('Delete Category', `Are you sure you want to delete "${category.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(category.id);
            Alert.alert('Success', 'Category deleted successfully!');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete category. Please try again.');
          }
        },
      },
    ]);
  };

  const handleApproveCategory = async (categoryId: string) => {
    try {
      await approveCategory(categoryId);
      Alert.alert('Success', 'Category approved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve category. Please try again.');
    }
  };

  return {
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleApproveCategory,
  };
};
