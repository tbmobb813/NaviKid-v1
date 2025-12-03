import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import { useCategoryManagement } from '@/stores/categoryStore';
import { useCategoryForm } from '@/hooks/useCategoryForm';
import { useCategoryActions } from '@/hooks/useCategoryActions';
import { ArrowLeft, Plus } from 'lucide-react-native';
import {
  PendingApprovalSection,
  AllCategoriesSection,
  CategoryModal,
} from './categoryManagement';

type CategoryManagementProps = {
  onBack: () => void;
  userMode: 'parent' | 'child';
};

const CategoryManagement: React.FC<CategoryManagementProps> = ({ onBack, userMode }) => {
  const {
    getApprovedCategories,
    getPendingCategories,
    getAvailableIcons,
    getAvailableColors,
    canCreateCategory,
  } = useCategoryManagement();

  const approvedCategories = getApprovedCategories();
  const pendingCategories = getPendingCategories();
  const availableIcons = getAvailableIcons();
  const availableColors = getAvailableColors();

  const {
    showCreateModal,
    editingCategory,
    newCategoryName,
    selectedIcon,
    selectedColor,
    setNewCategoryName,
    setSelectedIcon,
    setSelectedColor,
    openCreateModal,
    openEditModal,
    closeModal,
    resetForm,
  } = useCategoryForm();

  const {
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleApproveCategory,
  } = useCategoryActions(userMode, () => {
    closeModal();
    resetForm();
  });

  const handleSave = async () => {
    if (editingCategory) {
      const success = await handleEditCategory(
        editingCategory.id,
        newCategoryName,
        selectedIcon,
        selectedColor,
      );
      if (success) {
        closeModal();
        resetForm();
      }
    } else {
      const success = await handleCreateCategory(newCategoryName, selectedIcon, selectedColor);
      if (success) {
        closeModal();
        resetForm();
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Manage Categories</Text>
        {canCreateCategory(userMode) && (
          <Pressable onPress={openCreateModal} style={styles.addButton}>
            <Plus size={24} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content}>
        {userMode === 'parent' && (
          <PendingApprovalSection
            categories={pendingCategories}
            onApprove={handleApproveCategory}
            onDelete={handleDeleteCategory}
          />
        )}

        <AllCategoriesSection
          categories={approvedCategories}
          userMode={userMode}
          onEdit={openEditModal}
          onDelete={handleDeleteCategory}
        />
      </ScrollView>

      <CategoryModal
        visible={showCreateModal}
        isEditing={!!editingCategory}
        categoryName={newCategoryName}
        selectedIcon={selectedIcon}
        selectedColor={selectedColor}
        userMode={userMode}
        availableIcons={availableIcons}
        availableColors={availableColors}
        onClose={closeModal}
        onSave={handleSave}
        onNameChange={setNewCategoryName}
        onIconSelect={setSelectedIcon}
        onColorSelect={setSelectedColor}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
});

export default CategoryManagement;
