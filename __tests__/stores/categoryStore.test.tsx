/**
 * Comprehensive Tests for Category Store
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  CategoryProvider,
  useCategoryStore,
  useCategoryManagement,
} from '../../stores/categoryStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomCategory } from '@/types/navigation';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Category Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with 8 default categories', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.categories).toHaveLength(8);
      expect(result.current.categories[0].id).toBe('home');
      expect(result.current.categories[0].isDefault).toBe(true);
    });

    it('should have correct default settings', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.settings).toEqual({
        allowChildToCreateCategories: true,
        requireParentApproval: true,
        maxCustomCategories: 20,
      });
    });

    it('should load categories from AsyncStorage', async () => {
      const storedCategories = [
        {
          id: 'custom_test',
          name: 'Test Category',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'parent',
          isApproved: true,
          createdAt: Date.now(),
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'kidmap_custom_categories') {
          return Promise.resolve(JSON.stringify(storedCategories));
        }
        return Promise.resolve(null);
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.categories).toEqual(storedCategories);
    });

    it('should load settings from AsyncStorage', async () => {
      const storedSettings = {
        allowChildToCreateCategories: false,
        requireParentApproval: false,
        maxCustomCategories: 10,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'kidmap_category_settings') {
          return Promise.resolve(JSON.stringify(storedSettings));
        }
        return Promise.resolve(null);
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.settings).toEqual(storedSettings);
    });
  });

  describe('Add Category', () => {
    it('should add a new custom category', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let newCategory: CustomCategory | undefined;
      await act(async () => {
        newCategory = await result.current.addCategory({
          name: 'Custom Place',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'parent',
          isApproved: true,
        });
      });

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(9);
      });

      expect(newCategory).toBeDefined();
      expect(newCategory?.name).toBe('Custom Place');
      expect(newCategory?.id).toMatch(/^custom_/);
    });

    it('should generate unique ID for new category', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let category1: CustomCategory | undefined;
      let category2: CustomCategory | undefined;

      await act(async () => {
        category1 = await result.current.addCategory({
          name: 'Category 1',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'parent',
          isApproved: true,
        });
      });

      await act(async () => {
        category2 = await result.current.addCategory({
          name: 'Category 2',
          icon: 'Heart',
          color: '#00FF00',
          isDefault: false,
          createdBy: 'parent',
          isApproved: true,
        });
      });

      expect(category1?.id).not.toBe(category2?.id);
    });

    it('should save to AsyncStorage when adding category', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addCategory({
          name: 'Test',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'parent',
          isApproved: true,
        });
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'kidmap_custom_categories',
          expect.any(String),
        );
      });
    });
  });

  describe('Update Category', () => {
    it('should update an existing category', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateCategory('home', { name: 'Updated Home' });
      });

      await waitFor(() => {
        const homeCategory = result.current.categories.find(
          (cat: CustomCategory) => cat.id === 'home',
        );
        expect(homeCategory?.name).toBe('Updated Home');
      });
    });

    it('should not affect other categories when updating one', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const schoolBefore = result.current.categories.find(
        (cat: CustomCategory) => cat.id === 'school',
      );

      await act(async () => {
        await result.current.updateCategory('home', { color: '#000000' });
      });

      await waitFor(() => {
        const schoolAfter = result.current.categories.find(
          (cat: CustomCategory) => cat.id === 'school',
        );
        expect(schoolAfter).toEqual(schoolBefore);
      });
    });
  });

  describe('Delete Category', () => {
    it('should delete a custom category', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let customCategory;
      await act(async () => {
        customCategory = await result.current.addCategory({
          name: 'Custom',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'parent',
          isApproved: true,
        });
      });

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(9);
      });

      await act(async () => {
        await result.current.deleteCategory(customCategory!.id);
      });

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(8);
        expect(
          result.current.categories.find((cat: CustomCategory) => cat.id === customCategory!.id),
        ).toBeUndefined();
      });
    });

    it('should not delete default categories', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deleteCategory('home');
      });

      await waitFor(() => {
        const homeCategory = result.current.categories.find(
          (cat: CustomCategory) => cat.id === 'home',
        );
        expect(homeCategory).toBeDefined();
      });
    });
  });

  describe('Approve Category', () => {
    it('should approve a pending category', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let pendingCategory;
      await act(async () => {
        pendingCategory = await result.current.addCategory({
          name: 'Pending',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'child',
          isApproved: false,
        });
      });

      await act(async () => {
        await result.current.approveCategory(pendingCategory!.id);
      });

      await waitFor(() => {
        const category = result.current.categories.find(
          (cat: CustomCategory) => cat.id === pendingCategory!.id,
        );
        expect(category?.isApproved).toBe(true);
      });
    });
  });

  describe('Getters - Approved Categories', () => {
    it('should return only approved categories', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let approvedCat: CustomCategory | undefined;
      let pendingCat: CustomCategory | undefined;

      await act(async () => {
        approvedCat = await result.current.addCategory({
          name: 'Approved',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'parent',
          isApproved: true,
        });
      });

      await act(async () => {
        pendingCat = await result.current.addCategory({
          name: 'Pending',
          icon: 'Heart',
          color: '#00FF00',
          isDefault: false,
          createdBy: 'child',
          isApproved: false,
        });
      });

      await waitFor(
        () => {
          expect(result.current.categories).toHaveLength(10); // 8 default + 2 custom
        },
        { timeout: 3000 },
      );

      const approved = result.current.getApprovedCategories();
      expect(approved.every((cat: CustomCategory) => cat.isApproved)).toBe(true);
      expect(approved).toHaveLength(9); // 8 default + 1 approved custom
    });
  });

  describe('Getters - Pending Categories', () => {
    it('should return only pending child-created categories', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addCategory({
          name: 'Pending 1',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'child',
          isApproved: false,
        });
      });

      await act(async () => {
        await result.current.addCategory({
          name: 'Pending 2',
          icon: 'Heart',
          color: '#00FF00',
          isDefault: false,
          createdBy: 'child',
          isApproved: false,
        });
      });

      await waitFor(
        () => {
          expect(result.current.categories).toHaveLength(10); // 8 default + 2 pending
        },
        { timeout: 3000 },
      );

      const pending = result.current.getPendingCategories();
      expect(pending).toHaveLength(2);
      expect(
        pending.every((cat: CustomCategory) => !cat.isApproved && cat.createdBy === 'child'),
      ).toBe(true);
    });

    it('should not include approved categories in pending list', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addCategory({
          name: 'Approved',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'child',
          isApproved: true,
        });
      });

      await waitFor(() => {
        const pending = result.current.getPendingCategories();
        expect(pending).toHaveLength(0);
      });
    });
  });

  describe('Getters - Place Category', () => {
    it('should return default category ID for default categories', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const placeCategory = result.current.getPlaceCategory('home');
      expect(placeCategory).toBe('home');
    });

    it('should return "other" for custom categories', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let customCategory;
      await act(async () => {
        customCategory = await result.current.addCategory({
          name: 'Custom',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'parent',
          isApproved: true,
        });
      });

      await waitFor(() => {
        const placeCategory = result.current.getPlaceCategory(customCategory!.id);
        expect(placeCategory).toBe('other');
      });
    });

    it('should return "other" for non-existent category', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const placeCategory = result.current.getPlaceCategory('non-existent');
      expect(placeCategory).toBe('other');
    });
  });

  describe('Getters - Available Icons and Colors', () => {
    it('should return available icons', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const icons = result.current.getAvailableIcons();
      expect(icons).toContain('Home');
      expect(icons).toContain('GraduationCap');
      expect(icons).toContain('Star');
      expect(icons.length).toBeGreaterThan(20);
    });

    it('should return available colors', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const colors = result.current.getAvailableColors();
      expect(colors).toContain('#007AFF');
      expect(colors).toContain('#FF9500');
      expect(colors).toContain('#34C759');
      expect(colors.length).toBeGreaterThan(20);
    });
  });

  describe('Settings Management', () => {
    it('should update settings', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.saveSettings({
          allowChildToCreateCategories: false,
          requireParentApproval: false,
          maxCustomCategories: 10,
        });
      });

      await waitFor(() => {
        expect(result.current.settings.allowChildToCreateCategories).toBe(false);
        expect(result.current.settings.maxCustomCategories).toBe(10);
      });
    });

    it('should save settings to AsyncStorage', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryStore(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.saveSettings({
          allowChildToCreateCategories: false,
          requireParentApproval: false,
          maxCustomCategories: 5,
        });
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'kidmap_category_settings',
          expect.any(String),
        );
      });
    });
  });

  describe('Category Management Hook', () => {
    it('should allow parents to create categories', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryManagement(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.canCreateCategory('parent')).toBe(true);
    });

    it('should respect maxCustomCategories limit for children', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryManagement(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.saveSettings({
          allowChildToCreateCategories: true,
          requireParentApproval: true,
          maxCustomCategories: 1,
        });
      });

      await waitFor(() => {
        expect(result.current.canCreateCategory('child')).toBe(true);
      });

      await act(async () => {
        await result.current.addCategory({
          name: 'Custom',
          icon: 'Star',
          color: '#FF0000',
          isDefault: false,
          createdBy: 'child',
          isApproved: true,
        });
      });

      await waitFor(() => {
        expect(result.current.canCreateCategory('child')).toBe(false);
      });
    });

    it('should respect allowChildToCreateCategories setting', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryManagement(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.saveSettings({
          allowChildToCreateCategories: false,
          requireParentApproval: true,
          maxCustomCategories: 20,
        });
      });

      await waitFor(() => {
        expect(result.current.canCreateCategory('child')).toBe(false);
      });
    });

    it('should indicate when child categories need approval', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryManagement(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.needsApproval('child')).toBe(true);
      expect(result.current.needsApproval('parent')).toBe(false);
    });

    it('should not require approval when setting is disabled', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategoryManagement(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.saveSettings({
          allowChildToCreateCategories: true,
          requireParentApproval: false,
          maxCustomCategories: 20,
        });
      });

      await waitFor(() => {
        expect(result.current.needsApproval('child')).toBe(false);
      });
    });
  });
});
