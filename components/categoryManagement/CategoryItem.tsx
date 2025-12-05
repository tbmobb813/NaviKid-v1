import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Edit3, Trash2, Check, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CustomCategory } from '@/types/navigation';
import CategoryButton from '../CategoryButton';

type CategoryItemProps = {
  category: CustomCategory;
  showActions: boolean;
  isPending?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
};

export const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  showActions,
  isPending = false,
  onEdit,
  onDelete,
  onApprove,
}) => (
  <View style={styles.categoryItem}>
    <CategoryButton customCategory={category} onPress={() => {}} size="small" />
    <View style={styles.categoryInfo}>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryMeta}>
        {isPending
          ? `Created ${new Date(category.createdAt).toLocaleDateString()}`
          : category.isDefault
            ? 'Default'
            : `Created by ${category.createdBy}`}
      </Text>
    </View>
    {showActions && (
      <View style={styles.categoryActions}>
        {isPending && onApprove ? (
          <>
            <Pressable onPress={onApprove} style={[styles.actionButton, styles.approveButton]}>
              <Check size={20} color="#FFF" />
            </Pressable>
            <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteButton]}>
              <X size={20} color="#FFF" />
            </Pressable>
          </>
        ) : (
          <>
            {onEdit && (
              <Pressable onPress={onEdit} style={[styles.actionButton, styles.editButton]}>
                <Edit3 size={20} color="#FFF" />
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteButton]}>
                <Trash2 size={20} color="#FFF" />
              </Pressable>
            )}
          </>
        )}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryMeta: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
});
