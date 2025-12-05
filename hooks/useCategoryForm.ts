import { useState } from 'react';
import { CustomCategory } from '@/types/navigation';

export const useCategoryForm = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('MapPin');
  const [selectedColor, setSelectedColor] = useState('#007AFF');

  const openCreateModal = () => {
    setNewCategoryName('');
    setSelectedIcon('MapPin');
    setSelectedColor('#007AFF');
    setEditingCategory(null);
    setShowCreateModal(true);
  };

  const openEditModal = (category: CustomCategory) => {
    setNewCategoryName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setEditingCategory(category);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
  };

  const resetForm = () => {
    setNewCategoryName('');
    setSelectedIcon('MapPin');
    setSelectedColor('#007AFF');
    setEditingCategory(null);
  };

  return {
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
  };
};
